import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = { fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response };
let serverEntryPromise: Promise<ServerEntry> | undefined;
async function getServerEntry() { serverEntryPromise ??= import("@tanstack/react-start/server-entry").then((m) => (m.default ?? m) as ServerEntry); return serverEntryPromise; }
export default { async fetch(request: Request, env: unknown, ctx: unknown) { try { const response = await (await getServerEntry()).fetch(request, env, ctx); if (response.status >= 500 && (response.headers.get("content-type") ?? "").includes("application/json")) { const body = await response.clone().text(); try { const payload = JSON.parse(body); if (payload.unhandled === true && payload.message === "HTTPError") return new Response(renderErrorPage(), { status: 500, headers: { "content-type": "text/html; charset=utf-8" } }); } catch { /* Keep the original response when the body is not valid JSON. */ } } return response; } catch (error) { console.error(consumeLastCapturedError() ?? error); return new Response(renderErrorPage(), { status: 500, headers: { "content-type": "text/html; charset=utf-8" } }); } } };
