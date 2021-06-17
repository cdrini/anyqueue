import { SongProvider } from "../SongProvider.js";

export class AudioMackProvider extends SongProvider {
  constructor() {
    super({ name: "AudioMack" });
  }

  /** @override */
  testLink(link) {
    return link.includes("audiomack.com");
  }

  async fetchOembed(url) {
    return fetch(
      `https://audiomack.com/oembed?${new URLSearchParams({
        url,
        format: "json"
      })}`
    ).then((r) => r.json());
  }

  async augmentMetadata(song) {
    song.oembed = await this.fetchOembed(song.link);
    song.title = song.oembed.title;
    song.artist = song.oembed.author_name;
    song.thumbnail_url = song.oembed.thumbnail_url;
  }
}
