<template>
  <dialog class="aq-dialog settings-pane">
    <header>
      <h2>Settings</h2>
      <button class="naked-button" @click="$emit('close')">
        <b-icon-x-lg />
      </button>
    </header>
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
        <optgroup
          v-for="group in voiceGroups"
          :key="group[0]"
          :label="group[0]"
        >
          <option
            v-for="voice in group[1]"
            :key="voice.voiceURI"
            :value="voice.voiceURI"
          >
            {{ voice.lang.replace("_", "-") }} | {{ voice.name }}
          </option>
        </optgroup>
      </select>
      <button
        type="button"
        @click="speakPreview"
        class="aq-pop-button"
        :class="{ active: speaking }"
        style="grid-area: 1 / 2"
      >
        <b-icon-play-fill />
        Preview
      </button>
    </label>
    <label :class="{ disabled: !tentative_settings.dj_enabled }">
      <span class="label-body">
        DJ Voice Speed
        <small>Choose how quickly the DJ speaks.</small>
      </span>
      <input
        type="range"
        min="0.1"
        max="3"
        step="0.1"
        v-model.number="tentative_settings.dj_rate"
        :disabled="!tentative_settings.dj_enabled"
        list="dj-rate-ticks"
      />
      <datalist id="dj-rate-ticks">
        <option value="0.1" label="0.1x"></option>
        <option value="0.5" label="0.5x"></option>
        <option value="1" label="1x"></option>
        <option value="1.5" label="1.5x"></option>
        <option value="2" label="2x"></option>
        <option value="2.5" label="2.5x"></option>
        <option value="3" label="3x"></option>
      </datalist>
    </label>
    <hr />
    <div class="aq-card__controls">
      <button type="reset" class="aq-pop-button" @click="reset">Reset</button>
      <button type="submit" class="aq-pop-button primary" @click="saveSettings">
        Save
      </button>
    </div>
  </dialog>
</template>
  
<script>
import { speak } from "../../utils/speech.js";

/**
 * @param {SpeechSynthesisVoice[]} voices
 * @returns {Record<string, SpeechSynthesisVoice[]>}
 */
function groupVoicesByLanguage(voices) {
  const groupedVoices = {};
  for (const voice of voices) {
    const lang = voice.lang.slice(0, 2);
    if (!groupedVoices[lang]) groupedVoices[lang] = [];
    groupedVoices[lang].push(voice);
  }
  return groupedVoices;
}

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
    voiceGroups() {
      const groups = groupVoicesByLanguage(this.voices);
      const userLang = navigator.language.slice(0, 2);
      const result = [
        [`Browser Language: ${userLang}`, groups[userLang] || []],
      ];
      if (userLang !== "en") {
        result.push(["English", groups.en || []]);
      }
      result.push([
        "Other",
        Object.entries(groups)
          .filter(([lang]) => lang !== "en" && lang !== userLang)
          .flatMap(([, voices]) => voices),
      ]);
      return result
        .filter(([, voices]) => voices.length)
        .map(([label, voices]) => [
          label,
          voices.sort((a, b) => a.lang.localeCompare(b.lang)),
        ]);
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
          .find((voice) => voice.voiceURI === this.tentative_settings.dj_voice),
        this.tentative_settings.dj_rate
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
  /* Width doesn't work on Safari, but padding does and doesn't do anything on the other ones*/
  padding: 20px;
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

input[type="range"] {
  display: block;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  margin-top: 5px;
}

input[type="range"] + datalist {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  writing-mode: vertical-lr;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}

input[type="range"] + datalist > option {
  padding: 0;
  transform: rotate(-90deg);
  font-size: 0.8em;
}
</style>
  