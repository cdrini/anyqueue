<template>
  <iframe
    class="reddit-song-info"
    :src="embedUrl"
  />
</template>

<script>
export default {
  props: {
    url: {
      type: String,
    },
  },

  computed: {
    embedUrl() {
      const mainSlug = this.url.match(/r\/[^?.]+/)[0].replace(/\/+$/, '');
      return `https://www.redditmedia.com/${mainSlug}/?ref_source=embed&ref=share&embed=true&showmedia=false`;
    },
  },
};
</script>

<style>
.reddit-song-info {
  width: 100%;
  border: 0;
}
</style>
