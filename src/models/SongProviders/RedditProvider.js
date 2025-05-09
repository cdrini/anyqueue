import { SongProvider } from "../SongProvider.js";

export class RedditProvider extends SongProvider {
  constructor() {
    super({ name: "Reddit" });
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
