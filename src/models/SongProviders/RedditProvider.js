import { SongProvider } from "../SongProvider.js";

export class RedditProvider extends SongProvider {
  constructor() {
    super();
    this.name = "Reddit";
    this.iconUrl = "https://reddit.com/favicon.ico";
  }

  /** @override */
  testLink(link) {  // eslint-disable-line no-unused-vars
    // TODO
    return false;
  }

  /** @override */
  testSong(song) {
    return song.embed_link && song.embed_link.includes('/v.redd.it/');
  }
}
