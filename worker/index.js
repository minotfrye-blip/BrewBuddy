// Cloudflare Worker: Coffee Bag Scanner Proxy
// Sits between your frontend and the Anthropic API.
// Keeps your API key secret and adds CORS headers.

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

// The system prompt that tells Claude how to read a coffee bag
const SYSTEM_PROMPT = `You are a coffee expert analyzing a photo of a coffee bag. Extract details from the label. Respond ONLY with a JSON object, no markdown, no backticks, no preamble:
{
  "name": "Coffee name and/or roaster name",
  "roastLevel": "one of: light, light-medium, medium, medium-dark, dark",
  "origin": "Country or region of origin, plus any tasting/flavor notes on the bag",
  "roastDate": "ISO date string YYYY-MM-DD if visible, otherwise null"
}
If you cannot determine a field, use a reasonable best guess for roastLevel (default to medium) and empty string for others. Always return valid JSON.`;

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(env),
      });
    }

    // Only allow POST
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders(env), "Content-Type": "application/json" },
      });
    }

    try {
      const body = await request.json();

      // Expect: { image: "base64string", media_type: "image/jpeg" }
      if (!body.image || !body.media_type) {
        return new Response(
          JSON.stringify({ error: "Missing image or media_type" }),
          {
            status: 400,
            headers: {
              ...corsHeaders(env),
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Build the Anthropic API request
      const anthropicBody = {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: body.media_type,
                  data: body.image,
                },
              },
              {
                type: "text",
                text: SYSTEM_PROMPT,
              },
            ],
          },
        ],
      };

      const apiResponse = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(anthropicBody),
      });

      const data = await apiResponse.json();

      // Extract the text response and parse JSON
      if (data.content) {
        const text = data.content
          .filter((item) => item.type === "text")
          .map((item) => item.text)
          .join("");

        const clean = text.replace(/```json|```/g, "").trim();

        try {
          const parsed = JSON.parse(clean);
          return new Response(JSON.stringify(parsed), {
            headers: {
              ...corsHeaders(env),
              "Content-Type": "application/json",
            },
          });
        } catch {
          return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: clean }), {
            status: 502,
            headers: {
              ...corsHeaders(env),
              "Content-Type": "application/json",
            },
          });
        }
      }

      return new Response(
        JSON.stringify({ error: "Unexpected API response", details: data }),
        {
          status: 502,
          headers: {
            ...corsHeaders(env),
            "Content-Type": "application/json",
          },
        }
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders(env), "Content-Type": "application/json" },
      });
    }
  },
};

function corsHeaders(env) {
  // In production, lock this down to your GitHub Pages URL:
  // e.g., "https://yourusername.github.io"
  const origin = env.ALLOWED_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}
