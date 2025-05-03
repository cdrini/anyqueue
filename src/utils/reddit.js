import { csvParse } from "d3-dsv";

/** @type {Array<{ Category: string, Subreddit: string, Description?: string }>} */
let _musicSubreddits = null;

export async function loadMusicSubreddits() {
  if (!_musicSubreddits) {
    const response = await fetch("Reddit Music Subreddits.csv");
    const text = await response.text();
    /** @type {Array<{ Category: string, Subreddit: string, Description?: string }>} */
    _musicSubreddits = csvParse(text);
  }
  return _musicSubreddits;
}
