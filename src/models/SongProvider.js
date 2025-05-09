// @ts-check
/** @typedef {import('@/src/models/Types.ts').Song} Song */

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
   * @returns {boolean}
   */
  testLink(link) {  // eslint-disable-line no-unused-vars
    throw new Error("Not Implemented");
  }

  /**
   * @param {Song} song
   */
  testSong(song) {
    return this.testLink(song.link || '');
  }

  /** @param {string} link */
  supported(link) {  // eslint-disable-line no-unused-vars
    return true;
  }

  /** @param {string} link */
  normalizeLink(link) {
    return link;
  }

  /**
   * @param {Song} song
   */
  async augmentMetadata(song) {  // eslint-disable-line no-unused-vars
    return;
  }
}
