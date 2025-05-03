<template>
  <div class="reddit-header">
    <header>
      <img src="https://reddit.com/favicon.ico">
      <a class="reddit-header__title naked-button" :href="queueProvider.fullUrl" target="_blank">
        {{ queueProvider.subreddit }}
        <b-icon-box-arrow-up-right />
      </a>
    </header>

    <select v-if="queueProvider.sort" v-model="queueProvider.sort" @change="$emit('urlChange', queueProvider.updateUrl())">
      <option disabled selected>Sort by</option>
      <option value="best">Best</option>
      <option value="hot">Hot</option>
      <option value="new">New</option>
      <option value="top">Top</option>
      <option value="rising">Rising</option>
    </select>
    <select v-if="queueProvider.time" v-model="queueProvider.time" @change="$emit('urlChange', queueProvider.updateUrl())">
      <option value="hour">Now</option>
      <option value="day">This Day</option>
      <option value="week">This Week</option>
      <option value="month">This Month</option>
      <option value="year">This Year</option>
      <option value="all">All Time</option>
    </select>
  </div>
</template>

<script>
import { BIconBoxArrowUpRight } from "bootstrap-vue";
/** @typedef {import('@/src/models/QueueProviders/RedditQueueProvider.js').RedditQueueProvider} */

export default {
  name: "RedditQueueControls",
  components: { BIconBoxArrowUpRight },
  props: {
    /** @type {RedditQueueProvider} */
    queueProvider: Object,
  },
};
</script>

<style>
.reddit-header {
  background: #ff440047;
  margin: 10px;
  border-radius: 10px;
  padding: 10px;
  overflow: hidden;
  overflow: clip;
}

.reddit-header > header {
  display: flex;
  align-items: center;
}

.reddit-header > header > img {
  pointer-events: none;
  transform: scale(2);
  mix-blend-mode: multiply;
  opacity: 0.4;
}

.reddit-header__title {
  color: inherit;
  text-decoration: none;
}
</style>
