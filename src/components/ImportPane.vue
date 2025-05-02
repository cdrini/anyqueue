<template>
  <dialog class="aq-dialog import-pane">
    <header>
      <h2>Import Songs</h2>
      <button class="naked-button" @click="$emit('close')">
        <b-icon-x-lg />
      </button>
    </header>
    <form @submit.prevent="processImport">
      <select v-model="inputFormat">
        <option value="html">HTML (e.g. copy paste from Google docs)</option>
        <option value="text">List of Song URLs</option>
        <option value="csv">List of CSV song objects</option>
        <option value="url">Fetch from url</option>
      </select>
      <small v-if="inputFormat == 'csv'">
        Example: <code>"title","artist","link"</code>
      </small>
      <div v-if="inputFormat == 'url'">
        <small>
          Supported URLs: Reddit. Examples:
          <ul>
            <li v-for="url in urlSamples" :key="url">
              <a :href="url" target="_blank" @click.prevent="inputUrl = url">{{
                url
              }}</a>
            </li>
          </ul>
        </small>
        <input type="url" v-model="inputUrl" placeholder="https://..." />
      </div>
      <div v-if="inputFormat == 'html'">
        <textarea v-model="freeText" @paste="transformFreeTextPaste" />
      </div>
      <div v-if="inputFormat == 'text'">
        <textarea v-model="freeText" />
      </div>
      <hr />
      <div class="aq-card__controls">
        <button class="aq-pop-button primary" type="submit" :disabled="importing">
          Import
        </button>
      </div>
    </form>
  </dialog>
</template>

<script>
import { csvParse } from "d3-dsv";
import { extractSongsFromHtml } from "../models/QueueProviders/HTMLQueueProvider.js";
// Queue Providers
import { HTMLQueueProvider } from "../models/QueueProviders/HTMLQueueProvider.js";
import { RedditQueueProvider } from "../models/QueueProviders/RedditQueueProvider.js";
import ReddigtSongInfo from "./QueueProviderSongInfo/RedditSongInfo.vue";

const QUEUE_PROVIDERS = [
  { provider: new RedditQueueProvider(), songInfo: ReddigtSongInfo },
  { provider: new HTMLQueueProvider() },
];

/**
 * @type {Record<'html' | 'text' | 'csv' | 'url', (data: string) => Promise<{ format: string, data: string, queueProviderComponent: any, songs: import('../models/Song').Song[] }>>}
 */
export const importers = {
  async url(url) {
    const { provider, songInfo = null } = QUEUE_PROVIDERS.find(({ provider }) =>
      provider.testUrl(url)
    );
    return {
      format: "url",
      data: url,
      queueProviderComponent: songInfo,
      songs: await provider.extract(url),
    };
  },
  html(html) {
    return {
      format: "html",
      data: html,
      queueProviderComponent: null,
      songs: extractSongsFromHtml(html),
    };
  },
  text(text) {
    return {
      format: "text",
      data: text,
      queueProviderComponent: null,
      songs: text
        .trim()
        .split("\n")
        .map((l) => l.trim())
        .map((link) => ({ title: "", artist: "", link })),
    };
  },
  csv(csv) {
    return {
      format: "csv",
      data: csv,
      queueProviderComponent: null,
      songs: csvParse("title,artist,link\n" + csv),
    };
  },
};

export default {
  name: "ImportPane",
  props: {},
  data() {
    return {
      /** @type {'html' | 'text' | 'csv' | 'url'} */
      inputFormat: "html",
      inputUrl: "",
      freeText: "",
      importing: false,
      urlSamples: [
        "https://www.reddit.com/r/listentothis",
        "https://www.reddit.com/r/listentothis/top/?t=week",
        "https://www.reddit.com/r/SongWriting",
        "https://www.reddit.com/r/SongWriting/top/?t=week",
      ],
    };
  },
  methods: {
    /**
     * @param {ClipboardEvent} ev
     */
    async transformFreeTextPaste(ev) {
      if (this.inputFormat === "html") {
        ev.preventDefault();
        const items = ev.clipboardData.items;
        let chosenItem = items[0];
        for (const item of items) {
          if (item.type === "text/html") chosenItem = item;
        }
        this.freeText = await new Promise((res) => chosenItem.getAsString(res));
      }
    },

    async processImport() {
      if (this.importing) return;
      this.importing = true;
      try {
        if (this.inputFormat == "url") {
          this.$emit("import", await importers.url(this.inputUrl));
        } else if (this.inputFormat == "html") {
          this.$emit("import", await importers.html(this.freeText));
        } else if (this.inputFormat == "text") {
          this.$emit("import", await importers.text(this.freeText));
        } else if (this.inputFormat == "csv") {
          this.$emit("import", await importers.csv(this.freeText));
        } else {
          alert("Unknown format");
        }
      } catch (error) {
        console.error(error);
        alert("Error importing");
      } finally {
        this.importing = false;
      }
    },
  },
};
</script>

<style>
.import-pane {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.import-pane input,
.import-pane textarea {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #ccc;
}
</style>