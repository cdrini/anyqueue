<template>
  <div ref="el"></div>
</template>

<script>
// Singleton — only one script tag and one onYouTubeIframeAPIReady across all instances.
let apiReady = null;

function loadYouTubeApi() {
  if (apiReady) return apiReady;
  apiReady = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.append(script);
  });
  return apiReady;
}

export default {
  name: "AqYouTubePlayer",

  props: {
    videoId: { type: String },
    playerVars: { type: Object, default: () => ({}) },
  },

  watch: {
    async videoId(newId) {
      if (!newId) return;
      if (this.player) {
        this.player.loadVideoById(newId);
      } else {
        await this._createPlayer(newId);
      }
    },
  },

  async mounted() {
    if (this.videoId) await this._createPlayer(this.videoId);
  },

  methods: {
    async _createPlayer(videoId) {
      const YT = await loadYouTubeApi();
      if (!this.$refs.el || this.player) return;
      // Stored as a plain instance property (not in data) so Vue 2 doesn't try
      // to make YT.Player's internals reactive, which would break them.
      this.player = new YT.Player(this.$refs.el, {
        videoId,
        playerVars: this.playerVars,
        events: {
          onReady: (event) => this.$emit("ready", event),
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              this.$emit("ended", event);
            }
          },
        },
      });
    },
  },

  destroyed() {
    this.player?.destroy();
  },
};
</script>
