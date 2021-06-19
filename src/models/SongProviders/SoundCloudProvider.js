import { SongProvider } from "../SongProvider.js";

export class SoundCloudProvider extends SongProvider {
  constructor() {
    super({ name: "SoundCloud" });
  }
  /** @override */
  testLink(link) {
    return link.includes("soundcloud.com"); // || link.includes("soundcloud.app");
  }

  async normalizeLink(link) {
    // The API doesn't support CORS!!!
    // if (link.includes("soundcloud.app")) {
    //   let unshortened = { success: false };
    //   try {
    //     unshortened = await fetch(
    //       `https://unshorten.me/json/${link}`
    //     ).then((r) => r.json());
    //   } catch (err) {
    //     return link;
    //   }
    //   if (!unshortened.success) {
    //     alert(unshortened);
    //     return link;
    //   }
    //   return unshortened.resolved_url.split("?")[0];
    // }
    return link;
  }

  async fetchOembed(url) {
    return fetch(
      `https://soundcloud.com/oembed?${new URLSearchParams({
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
    const titleM = song.oembed.title.match(/^(.*) by (.*)$/);
    song.title = titleM[1];
    song.artist = titleM[2];
    song.thumbnail_url = song.oembed.thumbnail_url;
    if (song.thumbnail_url.includes("fb_placeholder.png")) {
      const authorOembed = await this.fetchOembed(song.oembed.author_url);
      song.thumbnail_url = authorOembed.thumbnail_url;
    }
  }
}
