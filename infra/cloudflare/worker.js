/**
 * Cloudflare Worker: API Gateway and edge proxy for agent telemetry and R2 storage offloading.
 *
 * Bindings (wrangler.toml):
 *   [vars] BACKEND_URL    -> backend origin, e.g. https://api.example.com
 *   [vars] WORKER_SECRET  -> shared secret for worker -> backend calls
 *   R2 bucket binding     -> R2_BUCKET
 */
export default {
  async fetch(request, env) {
    const BACKEND_URL = env.BACKEND_URL;
    const WORKER_SECRET = env.WORKER_SECRET || "";
    if (!BACKEND_URL) {
      return new Response("Worker not configured (BACKEND_URL missing)", { status: 500 });
    }

    const url = new URL(request.url);

    // Validate agent bearer token from Authorization header
    const authHeader = request.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401 });
    }
    const agentToken = authHeader.slice(7);

    // Verify token with backend
    const verifyResp = await fetch(`${BACKEND_URL}/agents/verify-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Worker-Secret": WORKER_SECRET,
      },
      body: JSON.stringify({ token: agentToken }),
    });
    if (!verifyResp.ok) return new Response("Unauthorized", { status: 401 });

    const pathParts = url.pathname.split("/").filter(Boolean);

    // GET /poll/{agent_id} -> check for pending job
    if (request.method === "GET" && pathParts[0] === "poll") {
      const agentId = pathParts[1];
      const jobResp = await fetch(`${BACKEND_URL}/jobs/pending/${agentId}`, {
        headers: {
          "Authorization": `Bearer ${agentToken}`,
          "X-Worker-Secret": WORKER_SECRET,
        },
      });
      return new Response(await jobResp.text(), {
        status: jobResp.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // PUT /results/{job_id} -> store encrypted result in R2
    if (request.method === "PUT" && pathParts[0] === "results") {
      const jobId = pathParts[1];
      const body = await request.arrayBuffer();
      await env.R2_BUCKET.put(`results/${jobId}/output.enc`, body);

      // Notify backend to ingest findings
      await fetch(`${BACKEND_URL}/results/ingest/${jobId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Worker-Secret": WORKER_SECRET,
        },
        body: JSON.stringify({ agent_id: "", status: "success" }),
      });

      return new Response(JSON.stringify({ status: "received" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
