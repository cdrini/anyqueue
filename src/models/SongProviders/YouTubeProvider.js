import { SongProvider } from "../SongProvider.js";
import { getIdFromUrl } from "vue-youtube";

export class YouTubeProvider extends SongProvider {
  constructor() {
    super();
    this.name = "YouTube";
    this.iconUrl = "https://youtube.com/favicon.ico";
  }
  /** @override */
  testLink(link) {
    return link.includes("youtube.com") || link.includes("youtu.be");
  }

  /** @override */
  normalizeLink(link) {
    const url = new URL(link);
    let videoId = null;

    if (url.searchParams.has("v")) {
      videoId = url.searchParams.get("v");
    } else if (url.pathname.startsWith("/embed/")) {
      videoId = url.pathname.split("/")[2];
    } else if (url.hostname === "youtu.be") {
      videoId = url.pathname.slice(1);
    }

    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    } else {
      return link;
    }
  }

  /**
   * @param {string} link
   */
  extractIdentifier(link) {
    return getIdFromUrl(link);
  }

  async fetchOembed(url) {
    return fetch(
      `https://www.youtube.com/oembed?${new URLSearchParams({
        url,
        format: "json"
      })}`
    ).then((r) => (r.status === 404 ? 404 : r.json()));
  }

  async augmentMetadata(song) {
    song.oembed = song.oembed || await this.fetchOembed(song.link);
    if (song.oembed === 404) {
      song.unavailable = true;
      return;
    }

    if (song.oembed) {
      song.title = song.oembed.title.replace(/&amp;/g, '&');
      song.artist = song.oembed.author_name?.replace(/&amp;/g, '&');
      song.thumbnail_url = song.oembed.thumbnail_url;
    }
  }
}
