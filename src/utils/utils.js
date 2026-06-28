/**
 * @param {string} url
 */
export function getIdFromUrl(url) {
  console.log("getIdFromUrl", url);
  const u = new URL(url);
  if (u.searchParams.has("v")) return u.searchParams.get("v");
  if (u.hostname === "youtu.be") return u.pathname.slice(1);
  if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2];
  return null;
}

/**
 * @param {string} url
 */
export async function loadScript(url) {
  return new Promise((res, rej) => {
    const script = document.createElement("script");
    script.onload = res;
    script.onerror = rej;
    script.src = url;
    document.head.append(script);
  });
}
