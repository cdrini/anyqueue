// Based on https://developer.spotify.com/documentation/embeds/references/iframe-api

/**
 * Interface to interact with the Spotify iFrame API.
 * This API provides methods to control playback, load content, and listen to events from Spotify embeds.
 */
export interface IFrameAPI {
  /**
   * @param element - The DOM element that will be replaced by the embed.
   * @param options
   * @param callback
   */
  createController(
    element: HTMLElement,
    options: { uri: string; width?: number; height?: number; },
    callback: (controller: EmbedController) => void
  ): void;
}

/**
 * Interface for a controller created by the IFrameAPI to manage a Spotify embed.
 */
export interface EmbedController {
  /**
   * Load a new URI into the embed.
   * @param spotifyUri - The Spotify URI to load.
   */
  loadUri(spotifyUri: string): void;

  /**
   * Start playback of the loaded content.
   */
  play(): void;

  /**
   * Toggle playback state between play and pause.
   */
  togglePlay(): void;

  /**
   * Seek to a specific time in the currently loaded content.
   * @param seconds - The time to seek to, in seconds.
   */
  seek(seconds: number): void;

  /**
   * Destroy the embed, removing it from the DOM.
   */
  destroy(): void;

  /**
   * Occurs when the embed is ready.
   */
  addListener(event: 'ready', callback: () => void): void;

  /**
   * Provides updates on playback state.
   */
  addListener(event: 'playback_update', callback: (e: { data: { position: number; duration: number; } }) => void): void;

}

/**
 * The global function to define for receiving the IFrameAPI object.
 * Your application should implement this function to get started with the Spotify iFrame API.
 * @param IFrameAPI - The IFrameAPI object used to create embed controllers.
 */
declare function onSpotifyIframeApiReady(IFrameAPI: IFrameAPI): void;
