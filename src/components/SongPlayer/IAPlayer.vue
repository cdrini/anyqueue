<template>
  <div>
    <b-alert show variant="warning">
      IA doesn't post messages from its iframe, so we're relying on the length
      of the audio. If you pause/etc, it will likely behave incorrectly
    </b-alert>
    <details>
      <summary>Details</summary>
      <pre>{{ file }}</pre>
    </details>
    <iframe
      class="ia-iframe"
      :src="embedLink"
      frameborder="0"
      @load="onLoad"
      allow="autoplay"
    />
  </div>
</template>

<script>
import Vue from "vue";
import AsyncComputed from "vue-async-computed";
import { IAProvider } from "../../models/SongProviders/IAProvider.js";
import { BAlert } from "bootstrap-vue";

const IA_PROVIDER = new IAProvider();

Vue.use(AsyncComputed);
export default {
  name: "IAPlayer",
  components: { BAlert },
  props: {
    url: {
      type: String,
    },
    autoplay: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      endTimeout: null,
    };
  },

  computed: {
    embedLink() {
      const base = this.url.replace("/details", "/embed");
      const params = new URLSearchParams({
        autoplay: this.autoplay ? 1 : 0,
      });
      return `${base}?${params}`;
    },

    identifier() {
      return IA_PROVIDER.extractIdentifier(this.url);
    },

    songIdentifier() {
      return IA_PROVIDER.extractSubIdentifier(this.url);
    },
  },

  asyncComputed: {
    metadata() {
      return fetch(
        `https://archive.org/metadata/${this.identifier}`
      ).then((r) => r.json());
    },

    file() {
      if (!this.metadata) return null;
      if (this.songIdentifier)
        return this.metadata.files.find((f) => f.name == this.songIdentifier);
      else return this.metadata.files.find((f) => f.length);
    },
  },

  destroyed() {
    clearTimeout(this.endTimeout);
  },

  methods: {
    onLoad(ev) {
      this.startEndCountdown();
      this.$emit("load", { iframe: ev.target });
    },
    async startEndCountdown() {
      const file = await this.file;
      clearTimeout(this.endTimeout);
      this.endTimeout = setTimeout(
        () => this.$emit("ended"),
        file.length * 1000
      );
    },
  },
};
</script>

<style scoped>
.ia-iframe {
  width: 100%;
  height: 100%;
}
</style>