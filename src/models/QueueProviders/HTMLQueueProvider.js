// @ts-check
import uniqBy from "lodash/uniqBy";
import { SongProviderFactory } from "../SongProviders/SongProviderFactory";

/** @typedef {import('@/src/models/Types.ts').QueueProvider} QueueProvider */

/**
 * @param {string} html
 * @return {import('@/src/models/Types.ts').Song[]}
 */
export function extractSongsFromHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return uniqBy(
    Array.from(doc.querySelectorAll("a"))
      .filter((a) => a.href && SongProviderFactory.testLink(a.href))
      .map((a) => ({
        link: SongProviderFactory.normalizeLink(a.href.toString()),
        artist: "",
        title:
          a.textContent.trim() !== a.href
            ? a.textContent.trim()
            : a.parentElement.textContent.replace(a.href, ""),
      }))
      .concat(
        (html.match(/youtube.com\/embed\/[a-z0-9-_]+/gi) || [])
        .map(link => ({
          link: SongProviderFactory.normalizeLink(link),
          artist: '',
          title: ''
        }))
      ),
    (s) => s.link
  );
}

/**
 * Extracts songs from links in a generic HTML document.
 * @implements {QueueProvider}
 */
export class HTMLQueueProvider {
  name = 'html';

  /**
   * @param {string} url
   */
  // eslint-disable-next-line no-unused-vars
  static testUrl(url) {
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
