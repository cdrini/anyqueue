const DEFAULT_SETTINGS = {
  dj_enabled: true,
  /** The Voice URI. The empty string uses the system default */
  dj_voice: "",
  dj_rate: 1,
};

/** @typedef {typeof DEFAULT_SETTINGS} Settings */

/**
 * @returns {Settings}
 */
export function getSettings() {
  try {
    const localStorageSettings = localStorage.getItem("anyqueue_settings");
    if (localStorageSettings) {
      return Object.assign(
        {},
        DEFAULT_SETTINGS,
        JSON.parse(localStorageSettings),
      );
    }
  } catch (e) {
    console.error("Error reading settings from local storage", e);
  }
  return DEFAULT_SETTINGS;
}

/**
 * @param {Settings} settings
 * @returns {void}
 */
export function saveSettings(settings) {
  localStorage.setItem("anyqueue_settings", JSON.stringify(settings));
}
