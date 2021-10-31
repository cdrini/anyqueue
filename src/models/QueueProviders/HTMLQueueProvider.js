import uniqBy from "lodash/uniqBy";

/**
 * Extracts songs from links in a generic HTML document.
 */
export class HTMLQueueProvider {
  /**
   * @param {string} html 
   */
  extract(html) {
    return uniqBy(
      Array.from(
        new DOMParser().parseFromString(html, "text/html").querySelectorAll("a")
      ).map((a) => ({
        link: a.href,
        artist: "",
        title:
          a.textContent.trim() !== a.href
            ? a.textContent.trim()
            : a.parentElement.textContent.replace(a.href, ""),
      })),
      (s) => s.link
    );
  }
}