import { SongProvider } from "../SongProvider.js";

export class SpotifyProvider extends SongProvider {
  constructor() {
    super();
    this.name = "Spotify";
    this.iconUrl = "https://open.spotify.com/favicon.ico";
  }

  /** @override */
  testLink(link) {
    return link.includes("open.spotify.com");
  }

  /** @override */
  normalizeLink(link) {
    return link.replace('/embed', '');
  }

  async fetchOembed(url) {
    return fetch(
      `https://open.spotify.com/oembed?${new URLSearchParams({
        url,
        format: "json"
      })}`
    ).then((r) => r.json());
  }

  async augmentMetadata(song) {
    song.oembed = song.oembed || await this.fetchOembed(song.link);
    if (song.oembed) {
      song.title = song.oembed.title;
      song.thumbnail_url = song.oembed.thumbnail_url;
    }
  }
}
