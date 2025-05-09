import { SongProvider } from "../SongProvider.js";
import { getIdFromUrl } from "vue-youtube";

export class YouTubeProvider extends SongProvider {
  constructor() {
    super({ name: "YouTube" });
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

    return `https://www.youtube.com/watch?v=${videoId}`;
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
      song.title = song.oembed.title;
      song.artist = song.oembed.author_name;
      song.thumbnail_url = song.oembed.thumbnail_url;
    }
  }
}
