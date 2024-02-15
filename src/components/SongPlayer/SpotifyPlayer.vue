<template>
  <div class="song-player spotify-player">
    <b-alert show variant="warning" v-if="warning">
      {{ warning }}
    </b-alert>
    <div ref="iframeWrapper"></div>
  </div>
</template>

<script>
import { loadScript } from "@/utils/utils.js";

let loadingSpotifyAPI = false;
/** @type {import('./SpotifyIframeApi').IFrameAPI} */
let SpotifyIframeAPI = null;

export default {
  props: {
    url: {
      type: String,
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
      /** @type {import('./SpotifyIframeApi').EmbedController} */
      embedController: null,
      songEnded: false,
      songEndedTimeout: null,
    };
  },

  async mounted() {
    if (!SpotifyIframeAPI) {
      if (loadingSpotifyAPI) {
        await loadingSpotifyAPI;
      } else {
        // Trigger but don't wait for it; the other event will do the waiting
        loadScript("https://open.spotify.com/embed/iframe-api/v1");
        loadingSpotifyAPI = new Promise((res) => {
          window.onSpotifyIframeApiReady = (IFrameAPI) => res(IFrameAPI);
        });
        SpotifyIframeAPI = await loadingSpotifyAPI;
      }
    }

    this.embedController = await new Promise((res) => {
      SpotifyIframeAPI.createController(this.$refs.iframeWrapper, {
        uri: this.uri,
        width: 300,
        height: 300,
      },
      res);
    });

    if (this.autoplay) {
      this.embedController.play();
    }

    this.embedController.addListener("playback_update", (e) => {
      if (e.data.position == 0) {
        this.songEnded = false;
      }
      if (e.data.duration && e.data.position == e.data.duration) {
        console.log("SPOTIFY: Song ended", e.data);
        this.songEnded = true;
        // If it's an album/playlist, it'll go to the next song without
        // any real indication, so we'll wait a bit and see if it
        // resumes onto the next song.
        clearTimeout(this.songEndedTimeout);
        this.songEndedTimeout = setTimeout(() => {
          if (this.songEnded) this.$emit("ended");
        }, 200);
      }
    });    
  },

  unmounted() {
    if (this.embedController) {
      this.embedController.destroy();
    }
  },

  watch: {
    async url() {
      await loadingSpotifyAPI;
      this.embedController.loadUri(this.uri);
      if (this.autoplay) {
        this.embedController.play();
      }
    },
  },

  computed: {
    uri() {
      const m = this.url.match(/\.com\/([^/]+?)\/([^/?]+)/);
      return `spotify:${m[1]}:${m[2]}`;
    },
  },
};
</script>

<style>
.spotify-player {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.spotify-player iframe {
  width: 100%;
  height: 100%;
}

@media (max-width: 600px) {
  .spotify-player iframe {
    height: 80px;
  }
}

@media (min-width: 600px) {
  .spotify-player iframe {
    flex: 1;
  }
}
</style>