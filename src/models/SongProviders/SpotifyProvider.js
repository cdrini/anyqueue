import { SongProvider } from "../SongProvider.js";

export class SpotifyProvider extends SongProvider {
  constructor() {
    super({ name: "Spotify" });
  }

  /** @override */
  testLink(link) {
    return link.includes("open.spotify.com");
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
    song.oembed = await this.fetchOembed(song.link);
    if (song.oembed) {
      song.title = song.oembed.title;
      song.thumbnail_url = song.oembed.thumbnail_url;
    }
  }
}
