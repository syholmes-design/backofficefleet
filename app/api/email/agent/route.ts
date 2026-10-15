import { emailServices } from "@/lib/email-service/route-helpers";
import { handleAgentMcpRequest } from "@/lib/email-service/mcp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Restricted Claude connector (MCP Streamable HTTP, stateless).
 * Auth: Authorization: Bearer <agent token> issued by `npm run email:agent-grant`.
 * Tools: read/search, draft, request approval, link to partner. No send/approve.
 */
function allowedOrigins(): string[] {
  return (process.env.EMAIL_MCP_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

async function handle(request: Request) {
  try {
    return await handleAgentMcpRequest(request, emailServices().core, { allowedOrigins: allowedOrigins() });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "content-type": "application/json" } });
  }
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
