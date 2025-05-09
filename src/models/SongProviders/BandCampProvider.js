// @ts-check
import { SongProvider } from "../SongProvider.js";

export class BandCampProvider extends SongProvider {
  constructor() {
    super({ name: "BandCamp" });
  }

  /**
   * @param {string} link
   * @returns {boolean}
   */
  testLink(link) {
    try {
      const url = new URL(link);
      return url.hostname === "bandcamp.com" && url.pathname.includes("EmbeddedPlayer");
    } catch {
      return false;
    }
  }

  /**
   * @param {string} link
   * @returns {string}
   */
  normalizeLink(link) {
    try {
      const url = new URL(link);
      return url.origin + url.pathname; // Strips query parameters for normalization
    } catch {
      return link;
    }
  }

  async augmentMetadata(song) {
    if (song.oembed) {
      song.title = song.oembed.title;
      song.thumbnail_url = song.oembed.thumbnail_url;
    }
  }
}
