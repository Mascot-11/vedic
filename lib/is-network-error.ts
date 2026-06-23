/**
 * Returns true when an error is caused by no network connectivity
 * (as opposed to a real server error like "insufficient stock").
 */
export function isNetworkError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const msg = e.message.toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("err_internet_disconnected") ||
    msg.includes("err_network_changed") ||
    msg.includes("load failed") ||       // Safari offline
    msg.includes("fetch failed")         // Node fetch offline
  );
}
