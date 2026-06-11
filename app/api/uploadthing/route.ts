import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Behind a reverse proxy (nginx) the Node app sees the request as plain http, so
// UploadThing would build an http callback URL that gets 301-redirected to https
// and the callback POST fails (upload spinner hangs). In production we pin the
// callback URL to the public https origin so UploadThing reaches us directly.
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";
const callbackUrl = serverUrl.startsWith("https://")
  ? `${serverUrl.replace(/\/$/, "")}/api/uploadthing`
  : undefined;

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  ...(callbackUrl ? { config: { callbackUrl } } : {}),
});