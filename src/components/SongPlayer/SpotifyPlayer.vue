<template>
  <div class="song-player spotify-player">
    <b-alert show variant="warning" v-if="warning">
      {{ warning }}
    </b-alert>
    <iframe
      ref="iframe"
      scrolling="no"
      frameborder="no"
      allow="autoplay"
      :src="embedUrl"
      @load="$emit('load', $refs.iframe)"
    >
    </iframe>
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
    autoplay: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    embedUrl() {
      return this.url.replace(".com", ".com/embed");
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