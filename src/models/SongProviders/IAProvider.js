import { SongProvider } from "../SongProvider.js";

export class IAProvider extends SongProvider {
  constructor() {
    super();
    this.name = "Internet Archive";
    this.iconUrl = "https://archive.org/favicon.ico";
    this.base = "https://archive.org";
  }

  /** @override */
  testLink(link) {
    return link.includes("archive.org");
  }

  /**
   * @param {string} link
   */
  extractIdentifier(link) {
    const m = link.match(/\/details\/([^/?]+)/);
    return m && m[1];
  }

  /**
   * @param {string} link
   */
  extractSubIdentifier(link) {
    const m = link.match(/\/details\/.*?\/([^/?]+)/);
    return m && m[1];
  }

  /** @override */
  async augmentMetadata(song) {
    const identifier = this.extractIdentifier(song.link);
    const [{ result: title }, { result: creator }] = await Promise.all([
      fetch(`${this.base}/metadata/${identifier}/metadata/title`).then((r) =>
        r.json()
      ),
      fetch(`${this.base}/metadata/${identifier}/metadata/creator`).then((r) =>
        r.json()
      )
    ]);
    song.title = title;
    song.artist = creator;
  }
}
