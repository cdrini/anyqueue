<template>
  <div class="song-player youtube-provider">
    <youtube
      class="youtube-player"
      ref="youtube"
      :video-id="videoId"
      :player-vars="{ autoplay: autoplay ? 1 : 0 }"
      @ended="$emit('ended', $event)"
      @ready="onReady"
    ></youtube>
  </div>
</template>

<script>
import { getIdFromUrl } from "vue-youtube";
import Vue from "vue";
import VueYoutube from "vue-youtube";

Vue.use(VueYoutube);
export default {
  name: "YouTubePlayer",
  props: {
    url: {
      type: String,
    },
    autoplay: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    videoId() {
      return getIdFromUrl(this.url);
    },
  },

  methods: {
    pause() {
      this.$refs.youtube.player.pauseVideo();
    },
    resume() {
      this.$refs.youtube.player.playVideo();
    },

    async onReady() {
      const iframe = await this.$refs.youtube.player.getIframe();
      this.$emit("load", { iframe });

      // Get mobile auto play working
      this.$refs.youtube.player.playVideo();
    },

    async onWindowBlur() {
      // Keep playing while switching tabs
      for (let i = 0; i < 3; i++) {
        await new Promise((res) => setTimeout(res, 100));
        this.$refs.youtube.player.playVideo();
      }
    },
  },

  mounted() {
    window.addEventListener("blur", this.onWindowBlur);
  },

  destroyed() {
    window.removeEventListener("blur", this.onWindowBlur);
  },
};
</script>

<style>
.youtube-provider,
.youtube-player {
  width: 100%;
  height: 100%;
}
</style>