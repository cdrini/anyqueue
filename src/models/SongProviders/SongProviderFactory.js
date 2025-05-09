import { YouTubeProvider } from "./YouTubeProvider.js";
import { IAProvider } from "./IAProvider.js";
import { SoundCloudProvider } from "./SoundCloudProvider.js";
import { SpotifyProvider } from "./SpotifyProvider.js";
import { GoogleDriveProvider } from "./GoogleDriveProvider.js";
import { AudioMackProvider } from "./AudioMackProvider.js";
import { RedditProvider } from "./RedditProvider.js";

export class SongProviderFactory {
  /**
   * @type {import('@/src/models/SongProvider.js').SongProvider[]}
   */
  static providers = [
    new YouTubeProvider(),
    new IAProvider(),
    new SoundCloudProvider(),
    new SpotifyProvider(),
    new GoogleDriveProvider(),
    new AudioMackProvider(),
    new RedditProvider(),
  ];

  /**
   * @param {string} link
   * @returns {import('@/src/models/SongProvider.js').SongProvider | null}
   */
  static testLink(link) {
    const url = new URL(link);
    if (url.hostname === "cdn.embedly.com") {
      return SongProviderFactory.testLink(url.searchParams.get("src"));
    }
    return this.providers.some((provider) => provider.testLink(link));
  }

  /**
   * @param {string} link
   */
  static normalizeLink(link) {
    const url = new URL(link);
    if (url.hostname === "cdn.embedly.com") {
      return SongProviderFactory.normalizeLink(url.searchParams.get("src"));
    }
    const provider = this.providers.find((provider) => provider.testLink(link));
    return provider ? provider.normalizeLink(link) : link;
  }

  /**
   * @param {Song} song 
   * @returns {import('@/src/models/SongProvider.js').SongProvider | null}
   */
  static findForSong(song) {
    return this.providers.find((provider) => provider.testSong(song));
  }
}
