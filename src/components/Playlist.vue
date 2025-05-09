<template>
  <div class="playlist" :class="{ started: playerQueue.started }">
    <slot name="header" />
    <ol>
      <li
        class="song-wrapper"
        v-for="(song, songIndex) in songs"
        :key="song.link"
        :class="{ active: song.active, unavailable: song.unavailable }"
      >
        <div class="song-listing" @click="$emit('song-clicked', songIndex)">
          <SongTile :song="song" style="flex: 1" />
          <div class="song-listing__actions">
            <button class="chunky-button naked-button song-listing__play">
              <b-icon-play-fill />
              <span class="chunky-button__label">Play</span>
            </button>
            <a
              v-for="link in [song.link, ...(song.extra_links || [])].filter(x => x)"
              :key="link"
              class="chunky-button naked-anchor naked-button song-listing__view"
              target="_blank"
              :href="link"
              @click.stop
            >
              <div>
                <b-icon-box-arrow-up-right />
                <img class="song-listing__favicon" :src="getFavIcon(link)" />
              </div>
              <span class="chunky-button__label">View</span>
            </a>
          </div>
        </div>
      </li>
    </ol>
    <div class="playlist__song-count">{{ songs.length }} songs</div>
  </div>
</template>

<script>
import SongTile from "./SongTile.vue";
import { BIconPlayFill, BIconBoxArrowUpRight } from "bootstrap-vue";

export default {
  components: { SongTile, BIconPlayFill, BIconBoxArrowUpRight },
  props: {
    songs: {
      type: Array,
    },
    /** @type {import('./models/PlayerQueue.js').PlayerQueue} */
    playerQueue: {
      type: Object,
      default: null,
    },
  },

  methods: {
    getFavIcon(url) {
      const parsedUrl = new URL(url);
      let host = parsedUrl.host;
      // Strip subdomains to get the favicon
      // Fixes on.soundcloud.com links
      const stripped_subdomains = parsedUrl.host.match(/\.?([^.]+\.[^.]+)$/);
      if (stripped_subdomains) {
        host = stripped_subdomains[1];
      }
      if (host === "bandcamp.com") {
        return 'https://s4.bcbits.com/img/favicon/favicon-32x32.png';
      }
      return `${parsedUrl.protocol}//${host}/favicon.ico`;
    },
  },
};
</script>

<style scoped>
.song-listing {
  position: relative;
  cursor: pointer;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.playlist > ol {
  margin: 0;
  list-style: none;
  padding-left: 0;
}

li.song-wrapper {
  border-radius: 4px;
  padding: 0;
  transition: background-color 0.2s;
  margin: 0 8px;
  margin-left: 10px;
}

@media (max-width: 400px) {
  li.song-wrapper {
    margin: 0px;
    border-radius: 0px;
    padding-left: 12px;
  }
}

li.song-wrapper:hover {
  background: rgba(0, 0, 255, 0.03);
}
li.song-wrapper.active {
  background: rgba(0, 0, 255, 0.1);
}

.song-listing__play,
.song-listing__view {
  margin: 0;
  position: relative;
}

.song-listing__view .b-icon {
  width: 14px;
  height: 25px;
}

.song-listing__actions {
  display: flex;
  position: relative;
}
.song-listing__play {
  position: absolute;
  right: 100%;
  height: 100%;
  opacity: 0;
  transition-property: opacity;
  transition-duration: 0.2s;
}

.playlist:not(.started) .song-wrapper:hover .song-listing__play,
.song-wrapper:not(.active):hover .song-listing__play {
  opacity: 1;
}

.song-tile:hover + .song-listing__actions .song-listing__play {
  background: linear-gradient(
    to left,
    rgba(0, 0, 255, 0.1),
    rgba(0, 0, 255, 0.1) 60%,
    transparent
  );
}
.song-wrapper:hover .song-listing__play:hover,
.song-wrapper.active .song-listing__play:hover {
  background: rgba(0, 0, 255, 0.1);
}

.song-listing {
  display: flex;
}

.song-listing__favicon {
  position: absolute;
  width: 16px;
  right: 12px;
  opacity: 0;
  transition-property: opacity, transform;
  transition-duration: 0.2s;
  transform: translateY(8px);
}

.chunky-button__label {
  opacity: 0;
}

.song-wrapper:hover .chunky-button__label,
.song-wrapper.active .chunky-button__label {
  opacity: 1;
}

.song-wrapper:hover .song-listing__favicon,
.song-wrapper.active .song-listing__favicon {
  opacity: 1;
  transform: translateY(6px);
}

.song-wrapper:hover .song-listing__view .b-icon,
.song-wrapper.active .song-listing__view .b-icon {
  transform: translateY(0);
  transition-property: opacity, transform;
  transition-duration: 0.2s;
}

.song-wrapper:hover .song-listing__view .b-icon,
.song-wrapper.active .song-listing__view .b-icon {
  opacity: 0;
  transform: translateY(-8px);
}

.song-wrapper.unavailable .song-tile {
  cursor: default;
  text-decoration: line-through;
  opacity: 0.6;
}

.song-wrapper.unavailable .song-listing__play {
  display: none;
}

.playlist__song-count {
  font-style: oblique;
  text-align: center;
  padding: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}
</style>