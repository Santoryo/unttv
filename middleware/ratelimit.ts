export default defineEventHandler(async (event) => {
  if (!isUpstashEnabled()) return;

  const identifier =
    getRequestHeader(event, "cf-connecting-ip") ||
    getRequestIP(event) ||
    event.context.clientAddress ||
    "unknown";
  const ratelimitResponse = await limitRequest(identifier);

  if (!ratelimitResponse.success) {
    return new Response(null, {
      headers: {
        "X-Rate-Limit-Reset": ratelimitResponse.reset.toString(),
      },
      status: 429,
    });
  }
});
