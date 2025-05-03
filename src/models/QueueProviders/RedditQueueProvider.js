// @ts-check
import flatMap from "lodash/flatMap";
import { extractSongsFromHtml } from "./HTMLQueueProvider.js";
/** @typedef {import('../Types.ts').QueueProvider} QueueProvider */

/**
 * @implements {QueueProvider}
 */
export class RedditQueueProvider {
  /**
   * @param {string} url 
   */
  testUrl(url) {
    return url.startsWith('/r/') || url.startsWith('r/') || url.includes('reddit.');
  }

  /**
   * @param {RedditComment | RedditPost} listing
   */
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
   * @param {object} opts
   * @param {function(string): import('@/src/models/Types.ts').Song[]} [opts.htmlExtractor]
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

    /** @type {RedditListing<RedditPost> | [RedditListing<RedditPost>, RedditListing<RedditComment>]} */
    const doc = await fetch(url).then((r) => r.json());
    const toProcess =
      // eg https://www.reddit.com/r/Songwriting/comments/ns5muz/.json
      doc instanceof Array
        ? doc[1].data.children
        : // eg https://www.reddit.com/r/Songwriting/.json
          doc.data.children;

    /** @type {import('@/src/models/Types.ts').Song[]} */
    let songs = [];
    // Processing a list of posts
    if (toProcess[0].kind == 't3') {
      songs = flatMap(/** @type {RedditPost[]} */(toProcess), (post) => {
        // Items with Reddit video
        if (post.data.secure_media) {
          const sm = post.data.secure_media;
          if ('reddit_video' in sm) {
            return {
              title: post.data.title,
              artist: post.data.author,
              link: `https://www.reddit.com${post.data.permalink}`,
              embed_link: sm.reddit_video.hls_url,
            }
          }
          else if ('type' in sm) {
            if (sm.oembed.html) {
              sm.oembed.html = sm.oembed.html.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            }
            /** @type {import('@/src/models/Types.ts').Song} */
            const song = {
              title: post.data.title,
              artist: post.data.author,
              oembed: sm.oembed,
              extra_links: [`https://www.reddit.com${post.data.permalink}`],
            };
            if (sm.type == 'youtube.com') {
              song.link = `https://youtube.com/watch?v=${sm.oembed.html.match(/\/embed\/([^?]+)/)[1]}`;
            }
            else if (sm.type == 'm.youtube.com') {
              song.link = `https://youtube.com/watch?v=${new URL(sm.oembed.url).searchParams.get('v')}`;
            }
            else if (sm.type == 'soundcloud.com') {
              // Not sure if this handles soundcloud.app links
              song.link = post.data.url_overridden_by_dest;
            }
            else if (sm.type == 'audiomack.com') {
              song.link = sm.oembed.url;
            }
            else if (sm.type == 'open.spotify.com') {
              song.link = new URL(sm.oembed.html.match(/src="([^"]+)"/)[1]).searchParams.get('src').replace('/embed', '');
            }
            else {
              song.unavailable = true;
              song.warnings = song.warnings || [];
              song.warnings.push('cannot embed');
            }
            return song;
          }
          else {
            console.error('Unknown secure media', sm);
            return null; // FIXME
          }
        }
        else {
          const html = this.extractListingHtml(post, true);
          const permalink = `https://www.reddit.com${post.data.permalink}`;
          const postSongs = htmlExtractor(html)
            .filter((s) => !s.link.includes("soundcloud.app") && s.link != permalink);
          postSongs.forEach((s) => {
            s.extra_links = s.extra_links || [];
            s.extra_links.push(`https://www.reddit.com${post.data.permalink}`);
            s.artist = post.data.author;
            s.title = s.title.trim();
          });
          
          return postSongs;
        }
      });
    } else if (toProcess[0].kind == 't1') {
      songs = flatMap(/** @type {RedditComment[]} */(toProcess), (comment) => {
        // I've planted confederate comments inside the Songwriting
        // challenge with the unshortened forms of the soundcloud.app
        // URLs, cause they're otherwise impossible to work with :(
        const html = this.extractListingHtml(comment, true);
        let songs = htmlExtractor(html);
        songs.forEach((s) => {
          s.extra_links = s.extra_links || [];
          s.extra_links.push(`https://www.reddit.com${comment.data.permalink}`);
          s.artist = comment.data.author;
          s.title = s.title.trim();
        });
  
        if (
          comment.data.body_html &&
          comment.data.body_html.includes("soundcloud.app")
        ) {
          if (songs.find((s) => s.link.includes("soundcloud.com"))) {
            songs = songs.filter((s) => !s.link.includes("soundcloud.app"));
          }
        }
  
        return songs;
      });
    } else {
      throw new Error(`Unknown kind: ${JSON.stringify(toProcess)}`);
    }

    return songs;
  }
}
