import { SongProvider } from "../SongProvider.js";

export class GoogleDriveProvider extends SongProvider {
  constructor() {
    super({ name: "Google Drive" });
  }

  /** @override */
  testLink(link) {
    return link.includes("drive.google.com");
  }
}
