<template>
  <iframe
    :src="embedUrl"
    ref="iframe"
    width="100%"
    height="100%"
    allow="autoplay"
    frameborder="no"
  ></iframe>
</template>

<script>
import playerjs from "player.js";

export default {
  props: {
    url: {
      type: String,
    },
  },

  data() {
    return {
      /** @type {playerjs.Player} */
      player: null,
    };
  },

  computed: {
    embedUrl() {
      // eg: https://audiomack.com/4starview/song/good-stuff-happens
      // TO: https://audiomack.com/embed/song/4starview/good-stuff-happens
      return (
        this.url
          .replace("/song/", "/")
          .replace(".com", ".com/embed/song")
          .replace(/\?.*/, "") + "?autoplay=1"
      );
    },
  },

  mounted() {
    this.player = new playerjs.Player(this.$refs.iframe);
    this.player.on("ready", () => {
      this.$emit("load", { iframe: this.$refs.iframe });
      this.player.on("ended", () => this.$emit("ended"));
    });
  },

  beforeDestroy() {
    // This errors if done on destroy, becuase the iframe
    // has been removed.
    if (this.player) {
      this.player.off("ready");
      this.player.off("ended");
    }
  },
};
</script>