<template>
  <div class="song-player band-camp-player">
    <b-alert show variant="warning" v-if="warning">
      {{ warning }}
    </b-alert>
    <iframe
      :src="embedUrl"
      ref="iframe"
      width="100%"
      height="100%"
      allow="autoplay"
      seamless
      frameborder="no"
    ></iframe>
  </div>
</template>

<script>
export default {
  supportsAutoplay: false,
  supportsEndEvent: false,

  props: {
    url: {
      type: String,
    },
    warning: {
      type: String,
      default: "",
    },
  },

  computed: {
    embedUrl() {
      const params = Object.fromEntries(
        this.url.split('/EmbeddedPlayer/')[1].split('/').map(kvp => kvp.split('='))
      );
      const album = params.album;
      const track = params.track;
      const options = {
        v: 2,
        track: track,
        album: album,
        autoplay: this.autoplay,
        size: 'large',
        artwork: 'small'
      };
      return 'https://bandcamp.com/EmbeddedPlayer/' + Object.entries(options)
        .filter(([key, value]) => value !== undefined)  // eslint-disable-line no-unused-vars
        .map(([key, value]) => `${key}=${value}`).join('/');
    },
  },
};
</script>

<style>
.band-camp-player {
  display: flex;
  flex-direction: column;
}

@media (max-width: 600px) {
  .band-camp-player iframe {
    height: 80px;
  }
}

@media (min-width: 600px) {
  .band-camp-player iframe {
    flex: 1;
  }
}
</style>