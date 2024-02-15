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
