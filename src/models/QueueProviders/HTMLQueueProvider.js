import uniqBy from "lodash/uniqBy";

/**
 * @param {string} html 
 */
export function extractSongsFromHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return uniqBy(
    Array.from(doc.querySelectorAll("a")).map((a) => ({
        link: a.href,
        artist: "",
        title:
          a.textContent.trim() !== a.href
            ? a.textContent.trim()
            : a.parentElement.textContent.replace(a.href, ""),
      }))
      .concat(
        (html.match(/youtube.com\/embed\/[a-z0-9-_]+/gi) || [])
        .map(link => ({
          link: 'https://' + link.replace('/embed/', '/watch?v='),
          artist: '',
          title: ''
        }))
      ),
    (s) => s.link
  );
}

/**
 * Extracts songs from links in a generic HTML document.
 */
export class HTMLQueueProvider {
  /**
   * @param {string} url
   */
  // eslint-disable-next-line no-unused-vars
  testUrl(url) {
    // This will handle all urls if it gets
    return true;
  }

  /**
   * @param {string} url 
   */
  async extract(url) {
    return extractSongsFromHtml(await fetch(url, { credentials: 'omit' }).then(r => r.text()));
  }
}
