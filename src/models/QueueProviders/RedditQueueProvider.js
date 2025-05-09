// @ts-check
import flatMap from "lodash/flatMap";
import { extractSongsFromHtml } from "./HTMLQueueProvider.js";
import { SongProviderFactory } from "../SongProviders/SongProviderFactory.js";
/** @typedef {import('../Types.ts').QueueProvider} QueueProvider */

/**
 * @implements {QueueProvider}
 */
export class RedditQueueProvider {
  /**
   * @param {string} url
   */
  constructor(url) {
    this.name = 'reddit';
    /** @type {string} */
    this.url = url;
    /** @type {string} */
    this.fullUrl = this.expandUrl(url);
    const urlParts = this.parseRedditUrl(this.fullUrl);
    this.subreddit = urlParts.subreddit;
    this.sort = urlParts.sort;
    this.time = urlParts.time;
  }

  updateUrl() {
    let url = `${this.subreddit}`;
    if (this.sort && this.sort !== 'best') {
      url += `/${this.sort}`;
    }
    if (this.time && this.sort === 'top') {
      url += `?t=${this.time}`;
    }
    return url;
  }

  /**
   * @param {string} url
   * @returns {{ subreddit: string, sort: 'best' | 'hot' | 'new' | 'rising' } | 
   *  { subreddit: string, sort: 'top', time: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' } |
   *  { subreddit: string }
   * }
   */
  parseRedditUrl(url) {
    // eg  https://www.reddit.com/r/listentothis/top/
    // eg  https://www.reddit.com/r/listentothis/top/?t=all

    const urlObj = new URL(url);
    const subreddit = urlObj.pathname.match(/\/r\/[^/]+/)[0];
    let sort = urlObj.pathname.split('/')[3];
    const time = /** @type {'hour' | 'day' | 'week' | 'month' | 'year' | 'all' | null} */(urlObj.searchParams.get('t'));
    if (!sort) {
      sort = 'best';
    }

    switch (sort) {
      case 'best':
      case 'hot':
      case 'new':
      case 'rising':
        return { subreddit, sort };
      case 'top':
        return { subreddit, sort, time: time || 'hour' };
      default:
        return {subreddit}
    }
  }

  /**
   * @param {string} url 
   */
  static testUrl(url) {
    return url.startsWith('/r/') || url.startsWith('r/') || url.includes('reddit.');
  }

  /**
   * @param {string} url
   * @returns {string}
   */
  expandUrl(url) {
    if (url.startsWith("r/")) {
      url = "/" + url;
    }
    if (url.startsWith("/r/")) {
      url = "https://www.reddit.com" + url;
    }
    return url;
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
    url = this.expandUrl(url);

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
            /** @type {import('@/src/models/Types.ts').Song} */
            const song = {
              title: post.data.title,
              artist: post.data.author,
              oembed: sm.oembed,
              extra_links: [`https://www.reddit.com${post.data.permalink}`],
            };
            
            if (sm.oembed.html) {
              sm.oembed.html = sm.oembed.html.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

              const iframeSrc = new URL(sm.oembed.html.match(/src="([^"]+)"/)[1]);
              const normalizedLink = SongProviderFactory.normalizeLink(iframeSrc.toString());
              if (normalizedLink) {
                song.link = normalizedLink;
              }
            }
            if (sm.type == 'soundcloud.com') {
              // Not sure if this handles soundcloud.app links
              song.link = post.data.url_overridden_by_dest;
            }
            if (sm.type == 'audiomack.com') {
              song.link = sm.oembed.url;
            }
            
            if (!song.link) {
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

