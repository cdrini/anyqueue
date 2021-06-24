<template>
  <div class="song-tile">
    <div class="song-tile__thumb" v-b-popover.hover.v-warning="warningsHover">
      <img v-if="song.thumbnail_url" :src="song.thumbnail_url" />
      <b-icon-x-square
        class="song-tile__unavailable"
        v-if="song.unavailable"
        @click.stop
      />
      <b-icon-exclamation-square
        class="song-tile__warning"
        v-else-if="song.warnings && song.warnings.length"
        @click.stop
      />
    </div>
    <div class="song-tile__details">
      <div class="song-tile__title">
        <template v-if="song.title">{{ song.title }}</template>
        <em v-else>Title Unknown</em>
      </div>
      <div class="song-tile__byline">
        {{ song.artist }}
        <template v-if="song.recommender"
          >Recommended by {{ song.recommender }}</template
        >
        {{ song.notes ? " — " : "" }}
        <q v-if="song.notes">{{ song.notes }}</q>
      </div>
    </div>
  </div>
</template>

<script>
import { BIconExclamationSquare, BIconXSquare } from "bootstrap-vue";
export default {
  components: { BIconExclamationSquare, BIconXSquare },
  props: {
    song: Object,
  },

  computed: {
    warningsHover() {
      if (!this.song) return "";

      if (this.song.unavailable) {
        return `Unable to find song; perhaps it was deleted from ${this.song.provider.name}?`;
      }
      if (this.song.warnings && this.song.warnings.length) {
        return `${
          this.song.provider.name
        } does not support: ${this.song.warnings.join(", ")}`;
      }
      return "";
    },
  },
};
</script>

<style>
.song-tile {
  display: flex;
}

.song-tile__thumb:not(:empty) {
  position: relative;
  width: 48px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
.song-tile__thumb > img {
  width: 48px;
  border-radius: 4px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
  object-fit: cover;
  aspect-ratio: 1 / 1;
  margin: 4px;
  margin-left: 0;
}

.song-tile__thumb > .song-tile__warning,
.song-tile__thumb > .song-tile__unavailable {
  align-self: center;
  color: #c1572e;
}

.song-tile__details {
  padding: 8px;
}
.song-tile__title {
  font-weight: bold;
  line-height: 1em;
}

.song-tile__byline {
  font-size: 0.9em;
}
</style>