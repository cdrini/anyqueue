<template>
  <div class="settings-pane">
    <label>
      <input type="checkbox" v-model="tentative_settings.dj_enabled" />
      <span class="label-body">
        Enable “DJ”
        <small
          >When enabled, the player will speak the song title and artist after
          each song.</small
        >
      </span>
    </label>
    <label
      class="voice-row"
      :class="{ disabled: !tentative_settings.dj_enabled }"
    >
      <span class="label-body" style="grid-area: 1 / 1">
        DJ Voice
        <small>Choose the voice of the DJ.</small>
      </span>
      <select
        v-model="tentative_settings.dj_voice"
        :disabled="!tentative_settings.dj_enabled"
        style="grid-area: 2 / 1 / auto / span 2"
      >
        <option value="">System Default</option>
        <option
          v-for="voice in voices"
          :key="voice.voiceURI"
          :value="voice.voiceURI"
        >
          {{ voice.name }}
        </option>
      </select>
      <button
        type="button"
        @click="speakPreview"
        :class="{ active: speaking }"
        style="grid-area: 1 / 2"
      >
        <b-icon-play-fill />
        Preview
      </button>
    </label>
    <hr />
    <div class="settings-pane__controls">
      <button type="reset" @click="reset">Reset</button>
      <button type="submit" class="primary" @click="saveSettings">Save</button>
    </div>
  </div>
</template>
  
<script>
import { speak } from "../../utils/speech.js";
export default {
  name: "SettingsPane",
  props: {
    /** @type {import('./models/Settings.js').Settings} */
    settings: { type: Object },
  },
  data() {
    return {
      tentative_settings: JSON.parse(JSON.stringify(this.settings)),
      voices: window.speechSynthesis.getVoices(),
      speaking: false,
    };
  },

  computed: {
    hasChanges() {
      return (
        JSON.stringify(this.settings) !==
        JSON.stringify(this.tentative_settings)
      );
    },
  },

  methods: {
    updateVoices() {
      this.voices = window.speechSynthesis.getVoices();
    },
    saveSettings() {
      // NOTE: This assumes that the settings are flat and not nested
      Object.assign(this.settings, this.tentative_settings);
    },
    async speakPreview() {
      if (this.speaking) return;
      const utterance = new SpeechSynthesisUtterance(
        'That was "Seven Nation Army" by The Red Stripes.'
      );
      this.speaking = true;
      await speak(
        utterance,
        window.speechSynthesis
          .getVoices()
          .find((voice) => voice.voiceURI === this.tentative_settings.dj_voice)
      );
      this.speaking = false;
    },
    reset() {
      this.tentative_settings = JSON.parse(JSON.stringify(this.settings));
    },
  },

  mounted() {
    window.speechSynthesis.addEventListener("voiceschanged", this.updateVoices);
  },

  beforeDestroy() {
    window.speechSynthesis.removeEventListener(
      "voiceschanged",
      this.updateVoices
    );
  },

  watch: {
    settings: {
      handler(newVal) {
        this.tentative_settings = JSON.parse(JSON.stringify(newVal));
      },
      deep: true,
    },
  },
};
</script>
  
<style>
.settings-pane {
  display: flex;
  flex-direction: column;
}

.settings-pane > label:has(input[type="checkbox"]) {
  cursor: pointer;
  display: flex;
}

.settings-pane > label:has(input[type="checkbox"]) > .label-body {
  flex: 1;
}

.settings-pane .label-body > small {
  display: block;
  font-size: 0.8em;
  opacity: 0.6;
  line-height: 1em;
}

.settings-pane > label:has(input[type="checkbox"]) > input {
  width: 40px;
  scale: 0.4;
}

.settings-pane > label:has(select) {
  display: flex;
  flex-direction: column;
}

.settings-pane > label > select {
  padding: 6px;
  box-sizing: content-box;
}

.settings-pane > label {
  position: relative;
  padding: 10px;
  transition: opacity 0.2s, scale 0.2s, background-color 0.2s;
}

.settings-pane > label:hover {
  background-color: color-mix(in lch, var(--aq-main-weak), transparent);
}

.settings-pane > label.disabled {
  opacity: 0.6;
  pointer-events: none;
  scale: 0.94;
}

.settings-pane > label.voice-row {
  display: grid;
  grid-template: auto auto / 1fr auto;
  gap: 5px;
  align-items: center;
}

.settings-pane button {
  --aq-button-bg: var(--aq-main-weak);
  --aq-button-shadow: var(--aq-main-strong);
  background: var(--aq-button-bg);
  color: var(--aq-button-shadow);
  border: 0;
  border-radius: 8px;
  padding: 5px;

  box-shadow: 4px 4px 0 0 var(--aq-button-shadow);

  transform: translate(-4px, -4px);
  transition: transform 0.2s, box-shadow 0.2s;
}

.settings-pane button.primary {
  --aq-button-bg: var(--aq-main-strong);
  --aq-button-shadow: var(--aq-main-weak);
  color: white;
  box-shadow: 4px 4px 0 0 var(--aq-button-shadow);
  min-width: 100px;
}

.settings-pane button:hover {
  filter: brightness(1.1);
}

.settings-pane button:active,
.settings-pane button.active {
  filter: brightness(0.9);
  box-shadow: 0 0 0 1px var(--aq-button-shadow);
  transform: translate(0, 0) scale(0.9);
}

.settings-pane button:disabled {
  opacity: 0.6;
  box-shadow: none;
  transform: translate(0, 0);
  pointer-events: none;
}

.settings-pane__controls {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 0 10px;
}
</style>
  