import { SongProvider } from "../SongProvider.js";

export class GoogleDriveProvider extends SongProvider {
  constructor() {
    super();
    this.name = "Google Drive";
    this.iconUrl = "https://drive.google.com/favicon.ico";
  }

  /** @override */
  testLink(link) {
    return link.includes("drive.google.com");
  }
}
