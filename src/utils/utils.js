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

export async function pollUntilTruthy(fn, {interval = 100, maxWait = 5000} = {}) {
  return new Promise((res, rej) => {
    const start = Date.now();
    const intervalId = setInterval(() => {
      if (Date.now() - start > maxWait) {
        clearInterval(intervalId);
        rej(new Error("Timeout"));
      }
      const result = fn();
      if (result) {
        clearInterval(intervalId);
        res(result);
      }
    }, interval);
  });
}
