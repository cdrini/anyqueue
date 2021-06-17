<template>
  <div class="play-toolbar">
    <SongTile :song="playerQueue.activeSong" v-if="playerQueue.activeSong" />
    <button
      class="chunky-button naked-button"
      @click="playerQueue.start()"
      v-if="!playerQueue.started"
    >
      <b-icon-play-fill />
      Start
    </button>
    <button
      class="chunky-button naked-button"
      @click="playerQueue.skip()"
      v-if="playerQueue.started"
    >
      <b-icon-skip-end-fill />
      Skip
    </button>
  </div>
</template>

<script>
import SongTile from "./SongTile.vue";
import { BIconPlayFill, BIconSkipEndFill } from "bootstrap-vue";

export default {
  components: { SongTile, BIconPlayFill, BIconSkipEndFill },
  props: {
    /** @type {import('../models/PlayerQueue').PlayerQueue} */
    playerQueue: Object,
  },
};
</script>

<style>
.play-toolbar {
  display: flex;
}

.play-toolbar .chunky-button {
  aspect-ratio: 1/1;
}

.play-toolbar .song-tile {
  flex: 1;
  padding: 8px;
}
</style>