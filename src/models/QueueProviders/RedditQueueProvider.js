// @ts-check
import flatMap from "lodash/flatMap";
import { extractSongsFromHtml } from "./HTMLQueueProvider.js";

export class RedditQueueProvider {
  /**
   * 
   * @param {string} url 
   */
  testUrl(url) {
    return url.startsWith('/r/') || url.startsWith('r/') || url.includes('reddit.');
  }

  extractListingHtml(listing, recur = false) {
    let html = "";
    if (listing.data.body_html) {
      html += listing.data.body_html
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\\";/g, '"');
    }
    if (listing.data.url) {
      html += `\n<a href="${listing.data.url}">${listing.data.title}</a>`;
    }
    if (
      recur &&
      listing.data.replies &&
      listing.data.replies.kind === "Listing"
    ) {
      html += listing.data.replies.data.children
        // Really long thread are excluded 😬
        .filter((c) => c.kind !== "more")
        .map((c) => this.extractListingHtml(c, true))
        .join("\n");
    }
    return html;
  }

  /**
   * @param {string} url
   */
  async extract(url, { htmlExtractor = extractSongsFromHtml } = {}) {
    if (url.startsWith("/r/")) {
      // The link is mis-behaving on Reddit's mobile webapp :/ It's removing
      // the domain for some ungodly reason.
      url = "https://www.reddit.com" + url;
    }

    // Set default for the r/SongWriting post 😅
    const urlObj = new URL(url);
    if (!urlObj.searchParams.has("limit")) {
      urlObj.searchParams.set("limit", '500');
    }
    if (!urlObj.searchParams.has("depth")) {
      urlObj.searchParams.set("depth", '2');
    }
    // Add .json if not there
    if (!urlObj.pathname.endsWith('.json')) {
      urlObj.pathname += '.json';
    }
    url = urlObj.toString();

    // Assume a URL like:
    // https://www.reddit.com/r/Songwriting/comments/ns5muz/.json

    const doc = await fetch(url).then((r) => r.json());
    const toProcess =
      // eg https://www.reddit.com/r/Songwriting/comments/ns5muz/.json
      doc.length
        ? doc[1].data.children
        : // eg https://www.reddit.com/r/Songwriting/.json
          doc.data.children;

    const songs = flatMap(toProcess, (listing) => {
      // I've planted confederate comments inside the Songwriting
      // challenge with the unshortened forms of the soundcloud.app
      // URLs, cause they're otherwise impossible to work with :(
      const html = this.extractListingHtml(listing, true);
      let songs = htmlExtractor(html);
      songs.forEach((s) => {
        s.extra_links = s.extra_links || [];
        s.extra_links.push(`https://www.reddit.com${listing.data.permalink}`);
        s.artist = listing.data.author;
        s.title = s.title.trim();
      });

      if (
        listing.data.body_html &&
        listing.data.body_html.includes("soundcloud.app")
      ) {
        if (songs.find((s) => s.link.includes("soundcloud.com"))) {
          songs = songs.filter((s) => !s.link.includes("soundcloud.app"));
        }
      }

      return songs;
    });

    return songs;
  }
}
