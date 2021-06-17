<template>
  <div class="song-player google-drive-player">
    <b-alert show variant="warning" v-if="warning">
      {{ warning }}
    </b-alert>
    <iframe
      :src="embedUrl"
      allow="autoplay"
      frameborder="no"
      @load="$emit('load', { iframe: $event.target })"
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
      return this.url.replace("/view", "/preview");
    },
  },
};
</script>

<style>
.google-drive-player {
  display: flex;
  flex-direction: column;
}

@media (max-width: 600px) {
  .google-drive-player iframe {
    height: 80px;
  }
}

@media (min-width: 600px) {
  .google-drive-player iframe {
    flex: 1;
  }
}
</style>