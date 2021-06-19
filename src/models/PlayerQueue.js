export class PlayerQueue {
  constructor(songs = []) {
    this.activeSongIndex = 0;
    this.started = false;
    this.songs = songs;
  }

  get activeSong() {
    return this.songs[this.activeSongIndex];
  }

  get nextSong() {
    return this.songs[this.findNextSongIndex()];
  }

  findNextSongIndex(startIndex = this.activeSongIndex) {
    for (let i = startIndex; i < this.songs.length; i++) {
      if (!this.songs[i].unavailable) {
        return i;
      }
    }
  }

  load(songs, activeSongIndex = 0) {
    this.songs = songs;
    this.activeSongIndex = activeSongIndex;
  }

  start() {
    if (this.activeSong) {
      delete this.activeSong.active;
    }

    this.started = true;
    this.activeSong.active = true;
  }

  skip() {
    if (this.activeSong) {
      delete this.activeSong.active;
    }

    this.activeSongIndex = this.findNextSongIndex();
    this.activeSong.active = true;
  }

  playTrackAt(index) {
    if (this.activeSong) {
      delete this.activeSong.active;
    }
    this.activeSongIndex = this.findNextSongIndex(index);
    this.activeSong.active = true;
    if (!this.started) this.start();
  }
}
