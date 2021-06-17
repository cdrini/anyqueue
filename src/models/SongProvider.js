/* eslint-disable no-unused-vars */
/**
 * @abstract
 */
export class SongProvider {
  /**
   * @param {object} param0
   * @param {string} param0.name
   */
  constructor({ name }) {
    this.name = name;
  }
  /**
   * @abstract
   * @param {string} link
   * @returns {bool}
   */
  testLink(link) {
    throw new Error("Not Implemented");
  }

  /** @param {string} link */
  supported(link) {
    return true;
  }

  /** @param {string} link */
  async normalizeLink(link) {
    return link;
  }

  /**
   * @param {object} song
   * @param {string} [song.title]
   * @param {string} [song.artist]
   * @param {string} song.link
   */
  async augmentMetadata(song) {
    return;
  }
}
