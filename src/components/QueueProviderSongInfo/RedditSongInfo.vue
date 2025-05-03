<!--
  Specifying key forces the iframe to be fully destroyed/recreated. Otherwise
  changing the src of the iframe acts like a navigation, causing issues with
  back button navigation.
-->
<template>
  <iframe
    class="reddit-song-info"
    :key="url"
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
