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

  async normalizeLink(link) {
    if (link.includes("youtu.be")) {
      const url = new URL(link);
      const id = url.pathname.slice(1);
      return `https://www.youtube.com/watch?v=${id}`;
    }
    return link;
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
    song.oembed = await this.fetchOembed(song.link);
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
