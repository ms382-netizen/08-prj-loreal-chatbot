// Cloudflare Worker: paste into your Worker, then add a secret named OPENAI_API_KEY
// under Settings > Variables and Secrets. (Use your provided helper script if it differs.)
export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    const body = await request.json();

    const apiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: body.model || "gpt-4o",
          messages: body.messages,
          max_tokens: body.max_tokens || 500,
        }),
      },
    );

    const data = await apiResponse.json();
    return new Response(JSON.stringify(data), {
      status: apiResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
