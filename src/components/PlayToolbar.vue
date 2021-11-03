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
  width: 50px;
  height: 100%;
  max-height: 60px;
  align-self: center;
}

.play-toolbar .chunky-button:hover {
  color: #2a77d4;
}

.play-toolbar .song-tile {
  flex: 1;
  padding: 0 8px;
}

.play-toolbar .song-tile__title {
  /** Limit to only 2 lines */
  -webkit-line-clamp: 2;
  display: -webkit-inline-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>