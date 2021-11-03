<template>
  <div class="song-player reddit-player">
    <video ref="videoPlayer" class="video-js"></video>
  </div>
</template>

<script>
import videojs from "video.js";
import "video.js/dist/video-js.css";

export default {
  props: {
    song: {
      type: Object,
    },
    warning: {
      type: String,
      default: "",
    },
    autoplay: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      /** @type {videojs.Player} */
      player: null,
    };
  },
  mounted() {
    this.player = videojs(this.$refs.videoPlayer, this.options, () => {
      this.$emit("load");
      this.player.on("ended", () => this.$emit("ended"));
    });
  },
  beforeDestroy() {
    if (this.player) {
      this.player.dispose();
    }
  },

  watch: {
    source(newSource) {
      if (this.player) {
        this.player.src(newSource);
      }
    }
  },

  computed: {
    source() {
      return {
        src: this.song.embed_link,
        type: "application/x-mpegURL",
      };
    },
    options() {
      return {
        autoplay: this.autoplay,
        controls: true,
        sources: [this.source],
      };
    },
  },
};
</script>

<style scoped>
.reddit-player {
  flex: 1;
}
.video-js {
  width: 100%;
  height: 100%;
}
</style>