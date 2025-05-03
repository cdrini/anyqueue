<template>
  <PlayerShell id="app">
    <template v-slot:menus>
      <div class="app-bar">
        <img src="@/assets/favicon.svg" class="app-bar__logo" />
        <h1>AnyQueue</h1>
        <button class="naked-button" @click="toggleSidebar('explore')" :class="{ active: openSidebar == 'explore' }">
          Explore
        </button>
        <button class="naked-button" title="Random" @click="chooseRandomSubreddit">
          <DiceIcon />
        </button>
        <div style="flex: 1" />
        <div>
          <button class="naked-button" title="Import... (alpha)" @click="togglePane('import')" :class="{ active: openPane == 'import' }">
            <b-icon-plus-square />
          </button>
          <button class="naked-button" title="Settings" @click="togglePane('settings')" :class="{ active: openPane == 'settings' }">
            <b-icon-gear-fill />
          </button>
        </div>
      </div>

      <ImportPane
        v-if="openPane == 'import'"
        class="aq-card"
        @import="reloadSongs"
        @close="openPane = null"
      />
      <SettingsPane
        v-else-if="openPane == 'settings'"
        class="aq-card"
        :settings="settings"
        @close="openPane = null"
      />

      <details v-if="urlParams.get('debug') === 'true'">
        <summary>Share/Export</summary>
        <!-- <button @click="makeShareLink">Get Share Link</button> -->
        <!-- <a :href="this.shareLink">{{ this.shareLink }}</a> -->
        <button @click="saveToDropbox">Save to Dropbox</button>
      </details>

      <TagExplorer
        v-if="openSidebar == 'explore'"
        :active-subreddit="queueProvider && queueProvider.name == 'reddit' && queueProvider.subreddit"
        @subreddit-selected="handleUrlChange"
      >
        <template v-slot:footer>
          <RedditQueueControls
            v-if="queueProvider && queueProvider.name == 'reddit'"
            :queueProvider="queueProvider"
            @urlChange="handleUrlChange"
          />
        </template>
      </TagExplorer>

      <Playlist
        class="playlist"
        v-else
        :songs="songs"
        :playerQueue="playerQueue"
        @song-clicked="(index) => playerQueue.playTrackAt(index)"
      >
        <template v-slot:header>
          <RedditQueueControls
            v-if="queueProvider && queueProvider.name == 'reddit'"
            :queueProvider="queueProvider"
            @urlChange="handleUrlChange"
          />
        </template>
      </Playlist>
    </template>
    <template v-slot:toolbar>
      <PlayToolbar :player-queue="playerQueue" />
    </template>
    <template v-slot:main>
      <!-- YouTube iframe has a bug where it won't auto-play if offscreen when the player is first rendered. -->
      <!-- To get around this, we render/keep the iframe "offscreen" and then render it onscreen when the player is ready. -->
      <YouTubePlayer
        ref="activeSongPlayer"
        :autoplay="true"
        :url="
          playerQueue.started &&
          playerQueue.activeSong &&
          playerQueue.activeSong.player.name == 'YouTubePlayer'
            ? playerQueue.activeSong.link
            : ''
        "
        :active="
          playerQueue.started &&
          playerQueue.activeSong &&
          playerQueue.activeSong.player.name == 'YouTubePlayer'
        "
        @ended="skipForward(settings.dj_enabled)"
      />
      <component
        v-if="
          playerQueue.started &&
          playerQueue.activeSong &&
          playerQueue.activeSong.player.name != 'YouTubePlayer'
        "
        :is="playerQueue.activeSong.player"
        ref="activeSongPlayer"
        :song="playerQueue.activeSong"
        :url="playerQueue.activeSong.link"
        :warning="humanReadableWarning(playerQueue.activeSong)"
        :autoplay="true"
        @ended="skipForward(true)"
      />
      <div
        v-if="!(playerQueue.started && playerQueue.activeSong)"
        class="player-placeholder"
        @click="start()"
      />
      <component
        v-if="
          activeSongInfoComponent &&
          playerQueue.activeSong &&
          ((playerQueue.activeSong.extra_links &&
            playerQueue.activeSong.extra_links.find((l) =>
              l.includes('reddit.com')
            )) ||
            playerQueue.activeSong.link?.includes?.('reddit.com'))
        "
        class="queue-provider-song-info"
        :is="activeSongInfoComponent"
        :url="
          playerQueue.activeSong.link?.includes?.('reddit.com')
            ? playerQueue.activeSong.link
            : playerQueue.activeSong.extra_links.find((l) =>
                l.includes('reddit.com')
              )
        "
      />
    </template>
  </PlayerShell>
</template>

<script>
import { sample } from "lodash";
import jsonUrl from "json-url";
import Vue from "vue";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
// Import Bootstrap an BootstrapVue CSS files (order is important)
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import { PlayerQueue } from "./models/PlayerQueue";
import Playlist from "./components/Playlist";
import PlayToolbar from "./components/PlayToolbar";
import PlayerShell from "./components/PlayerShell";

// Players
import YouTubePlayer from "./components/SongPlayer/YouTubePlayer";
import IAPlayer from "./components/SongPlayer/IAPlayer";
import SoundCloudPlayer from "./components/SongPlayer/SoundCloudPlayer";
import GoogleDrivePlayer from "./components/SongPlayer/GoogleDrivePlayer";
import AudioMackPlayer from "./components/SongPlayer/AudioMackPlayer";
import SpotifyPlayer from "./components/SongPlayer/SpotifyPlayer.vue";
import RedditPlayer from "./components/SongPlayer/RedditPlayer.vue";

// Providers
import { YouTubeProvider } from "./models/SongProviders/YouTubeProvider.js";
import { IAProvider } from "./models/SongProviders/IAProvider.js";
import { SoundCloudProvider } from "./models/SongProviders/SoundCloudProvider.js";
import { SpotifyProvider } from "./models/SongProviders/SpotifyProvider.js";
import { GoogleDriveProvider } from "./models/SongProviders/GoogleDriveProvider.js";
import { AudioMackProvider } from "./models/SongProviders/AudioMackProvider.js";
import { RedditProvider } from "./models/SongProviders/RedditProvider.js";

// Queue Providers
import RedditQueueControls from "./components/QueueProviderSongInfo/RedditQueueControls.vue";

// Other
import { speak, getBestVoice } from "./utils/speech.js";
import { loadMusicSubreddits } from "./utils/reddit.js";
import { getSettings, saveSettings } from "./models/Settings.js";
import ImportPane, { importers } from "./components/ImportPane.vue";
import SettingsPane from "./components/Settings/SettingsPane.vue";
import TagExplorer from "./components/TagExplorer.vue";
import DiceIcon from "./components/icons/DiceIcon.vue";

// Types
/** @typedef {import('@/src/models/Types.ts').QueueProvider} QueueProvider */
/** @typedef {import('@/src/models/Types.ts').Song} Song */

// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue);
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);

const PROVIDERS = [
  { provider: new YouTubeProvider(), player: YouTubePlayer },
  { provider: new IAProvider(), player: IAPlayer },
  { provider: new SoundCloudProvider(), player: SoundCloudPlayer },
  { provider: new SpotifyProvider(), player: SpotifyPlayer },
  { provider: new GoogleDriveProvider(), player: GoogleDrivePlayer },
  { provider: new AudioMackProvider(), player: AudioMackPlayer },
  { provider: new RedditProvider(), player: RedditPlayer },
];

const SONGS = [
  {
    title: "Fairweather Friend",
    artist: "Kadhja Bonet",
    link: "https://www.youtube.com/watch?v=GeS6dnYyOT4",
    recommender: "Drini",
    notes: "I love this song!",
  },
  {
    title: "I Know You Rider",
    artist: "Joe Russo’s Almost Dead",
    link: "https://archive.org/details/sound247",
    recommender: "Jason",
  },
  {
    title: "On the Radio",
    artist: "Crash Crew",
    link: "https://www.youtube.com/watch?v=l7eUa2rK2xg",
    // recommender: "Drini",
  },
];

async function processSongs(songs, activeIndex) {
  await Promise.all(
    songs.map(async (s) => {
      s.active = false;
      const provider = PROVIDERS.find((p) => p.provider.testSong(s));
      if (provider) {
        s.provider = provider.provider;
        s.player = provider.player;
        s.warnings = s.warnings || [];

        if (s.player.supportsAutoplay === false) {
          s.warnings.push(`autostart`);
        }

        if (s.player.supportsEndEvent === false) {
          s.warnings.push(`end events`);
        }

        s.link = await s.provider.normalizeLink(s.link);
        try {
          await s.provider.augmentMetadata(s);
        } catch (err) {
          // Assume the song is no longer available
          s.unavailable = true;
          s.warnings.push("An error ocurred");
        }
      }
    })
  );

  if (activeIndex < songs.length) {
    songs[activeIndex].active = true;
  } else {
    songs[0].active = true;
  }
}

export default {
  name: "App",
  components: {
    DiceIcon,
    ImportPane,
    Playlist,
    PlayToolbar,
    PlayerShell,
    RedditQueueControls,
    SettingsPane,
    TagExplorer,
    YouTubePlayer,
  },
  data() {
    return {
      /** @type {'explore' | null} */
      openSidebar: null,
      /** @type {'import' | 'settings' | null} */
      openPane: null,

      /** @type {QueueProvider} */
      queueProvider: null,
      activeSongInfoComponent: null,
      /** @type {Song[]} */
      songs: [],

      shareLink: null,
      playerQueue: new PlayerQueue([]),

      speakingWarning: false,

      urlParams: new URLSearchParams(window.location.search),

      settings: getSettings(),
    };
  },

  computed: {
    selectedVoice() {
      return (
        speechSynthesis
          .getVoices()
          .find((v) => v.voiceURI === this.settings.dj_voice) || getBestVoice()
      );
    },
  },

  async mounted() {
    window.addEventListener("hashchange", () => {
      const hash = location.hash.replace("#", "");
      if (hash === "explore") {
        this.openSidebar = "explore";
      } else {
        this.openSidebar = null;
      }
    });

    window.addEventListener("popstate", async (ev) => {
      console.log("History::popstate", ev);
      const urlParams = new URLSearchParams(window.location.search);
      const url = urlParams.get("url");
      if (url) {
        await this.handleUrlChange(url, false);
      }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get("share-lzma");
    const shareObj = shareParam
      ? await jsonUrl("lzma").decompress(shareParam)
      : {};

    if (localStorage["App::activeSongIndex"] && localStorage["App::activeSongIndex"] !== "undefined")
      this.playerQueue.activeSongIndex = JSON.parse(
        localStorage["App::activeSongIndex"]
      );

    let songs = this.songs;

    if (location.hash == "#explore") {
      this.openSidebar = "explore";
    }

    if (urlParams.has("url")) {
      const {
        activeSongInfoComponent,
        provider = null,
        songs: urlSongs,
      } = await importers.url(
        urlParams.get("url")
      );
      document.title = `anyqueue | ${urlParams.get("url")}`;
      this.queueProvider = provider;
      this.activeSongInfoComponent = activeSongInfoComponent;
      songs = urlSongs;
    }

    if (!songs?.length) {
      songs =
        shareObj.songs ||
        (localStorage["App::songs"] &&
          JSON.parse(localStorage["App::songs"])) ||
        SONGS;
    }

    await processSongs(songs, this.playerQueue.activeSongIndex);
    this.songs = songs;
    this.playerQueue.load(this.songs);
  },
  watch: {
    openSidebar(val) {
      if (val) {
        location.hash = val;
      } else {
        location.hash = "";
      }
    },
    songs(val) {
      localStorage["App::songs"] = JSON.stringify(val);
    },
    "playerQueue.activeSongIndex"(val) {
      localStorage["App::activeSongIndex"] = val;
    },
    "playerQueue.activeSong"() {
      this.updateMediaSession();
      if (this.playerQueue.started && !this.speakingWarning) {
        this.speakAnyWarnings();
      }
    },
    "playerQueue.started"() {
      if (this.playerQueue.started && !this.speakingWarning) {
        this.speakAnyWarnings();
      }
    },
    settings: {
      handler(val) {
        saveSettings(val);
      },
      deep: true,
    },
  },

  methods: {
    async chooseRandomSubreddit() {
      const subreddits = await loadMusicSubreddits();
      const chosen = sample(subreddits);
      await this.handleUrlChange(chosen.Subreddit);
    },

    async handleUrlChange(url, pushState = true) {
      console.log("URL", url);
      let songs = this.songs;
      const {
        activeSongInfoComponent,
        provider = null,
        songs: urlSongs,
      } = await importers.url(url);

      document.title = `anyqueue | ${url}`;

      // push to history
      if (pushState) {
        const newAnyQueueUrl = `${window.location.pathname}?url=${encodeURIComponent(url).replace(/%2F/g, "/")}${location.hash}`;
        console.log("History::pushState", newAnyQueueUrl);
        history.pushState(null, "", newAnyQueueUrl);
      }

      this.queueProvider = provider;
      this.activeSongInfoComponent = activeSongInfoComponent;
      songs = urlSongs;

      await processSongs(songs, 0);
      this.songs = songs;
      this.playerQueue.load(this.songs);

      // Start playing!
      if (!this.playerQueue.started) {
        this.start();
      }
    },
    toggleSidebar(sidebar) {
      if (this.openSidebar === sidebar) {
        this.openSidebar = null;
      } else {
        this.openSidebar = sidebar;
      }
    },
    togglePane(pane) {
      if (this.openPane === pane) {
        this.openPane = null;
      } else {
        this.openPane = pane;
      }
    },
    async reloadSongs({ activeSongInfoComponent, songs }) {
      this.activeSongInfoComponent = activeSongInfoComponent;
      await processSongs(songs, 0);
      this.songs = songs.filter((s) => s.provider);
      this.playerQueue.load(this.songs);
    },
    humanReadableWarning(song) {
      if (!song.player) {
        return "We do not know how to play this type of song.";
      }
      
      const prefix = `Because this next song is from ${song.provider.name}`;
      const warnings = [
        [song.player.supportsFullSong === false, `only a preview is available`],
        [song.player.supportsAutoplay === false, `you'll need to manually click "play" to start the song`],
        [song.player.supportsEndEvent === false, `you'll need to manually click "skip" once the song is over`],
      ]

      const message = warnings
        .filter(([condition]) => condition)
        .map(([, message]) => message)
        .join(", ");
      
      if (message) {
        return `${prefix}, ${message}.`;
      }
    },
    async speakAnyWarnings() {
      this.speakingWarning = true;
      const song = this.playerQueue.activeSong;
      const warning = this.humanReadableWarning(song);
      if (warning) {
        const utterance = new SpeechSynthesisUtterance(warning);
        await speak(utterance, this.selectedVoice, this.settings.dj_rate);
      }

      this.speakingWarning = false;
    },

    async start() {
      this.playerQueue.start();
      this.updateMediaSession();
    },

    async makeShareLink() {
      const songsJson = this.songs.map((s) => Object.assign({}, s));
      songsJson.forEach((s) => {
        delete s.active;
        delete s.provider;
        delete s.player;
        delete s.warnings;
      });
      const shareJson = {
        songs: songsJson,
      };
      const location = window.location;
      this.shareLink =
        `${location.protocol}//${location.hostname}${location.pathname}?` +
        new URLSearchParams({
          "share-lzma": await jsonUrl("lzma").compress(shareJson),
        });
    },

    updateMediaSession() {
      if (!("mediaSession" in navigator)) return;

      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: this.playerQueue.activeSong.title,
        artist: this.playerQueue.activeSong.artist,
        album: this.playerQueue.activeSong.album,
        // artwork: [
        //   { src: br.options.thumbnail, type: 'image/jpg' },
        // ]
      });
      // navigator.mediaSession.setActionHandler('seekbackward', () => this.jumpBackward());
      // navigator.mediaSession.setActionHandler('seekforward', () => this.jumpForward());
      if (this.playerQueue.prevSong) {
        navigator.mediaSession.setActionHandler(
          "previoustrack",
          this.skipBackward
        );
      } else {
        navigator.mediaSession.setActionHandler("previoustrack", null);
      }
      if (this.playerQueue.nextSong) {
        navigator.mediaSession.setActionHandler(
          "nexttrack",
          this.skipForward.bind(this, false)
        );
      } else {
        navigator.mediaSession.setActionHandler("nexttrack", null);
      }
    },

    exportPlaylist() {
      return {
        title: "Unnamed Playlist",
        description: "No Description",
        songs: this.songs.map((s) => {
          const result = {
            artist: s.artist,
            title: s.title,
            link: s.link,
          };

          for (const key of ["album", "recommender", "notes"]) {
            if (s[key]) result[key] = s[key];
          }

          return result;
        }),
      };
    },

    saveToDropbox() {
      const playlist = this.exportPlaylist();
      const playlistString = JSON.stringify(playlist);
      const blob = new Blob([playlistString], { type: "application/json" });
      const blobUrl = URL.createObjectURL(blob);
      window.Dropbox.save(blobUrl, `${playlist.title}.anyq.json`);
    },

    resume() {
      this.$refs.activeSongPlayer.resume();
    },
    pause() {
      this.$refs.activeSongPlayer.pause();
    },

    async skipBackward() {
      if (this.playerQueue.prevSong) {
        this.playerQueue.skipBack();
      }
    },

    async skipForward(speakLastSong = false) {
      if (speakLastSong) {
        const song = this.playerQueue.activeSong;
        let text = `That was ${song.title || "an unknown song"}`;
        if (song.artist) text += ` by ${song.artist}`;
        if (song.album) {
          if (song.artist) text += ",";
          text += ` from the album "${song.album}"`;
        }
        text += ".";
        if (song.recommender) text += ` Recommended by ${song.recommender}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        await speak(utterance, this.selectedVoice, this.settings.dj_rate);
      }

      if (this.playerQueue.nextSong) {
        this.playerQueue.skip();
      }
    },
  },
};
</script>

<style>
#app {
  font-family: "Bahnschrift", -apple-system, BlinkMacSystemFont, "Segoe UI",
    "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji",
    "Segoe UI Emoji";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;

  --aq-main-strong: rgb(42, 119, 212);
  --aq-main-dark: rgba(11, 79, 163, 0.85);
  --aq-main-weak: #bed5ff;
}

html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  overflow-x: auto;
}

.playlist {
  flex: 1;
  overflow-y: auto;
}

.app-bar {
  display: flex;
  align-items: center;
  background: var(--aq-main-weak);
  overflow: hidden;
  overflow: clip;
  height: 40px;
  border-bottom: 2px solid var(--aq-main-strong);
  border-top: 2px solid var(--aq-main-strong);
}
.app-bar__logo {
  width: 40px;
  height: 40px;
  transform: scale(2);
  mix-blend-mode: multiply;
  opacity: 0.5;
  pointer-events: none;
}
.app-bar button {
  padding: 10px 8px;
  color: var(--aq-main-dark);
  position: relative;
}
.app-bar button.active::after {
  content: "";
  display: block;
  width: 100%;
  height: 8px;
  background: var(--aq-main-dark);
  position: absolute;
  bottom: 0;
  left: 0;
  border-radius: 4px;
  animation: scale-up 0.2s;
}

@keyframes scale-up {
  0% {
    transform: scaleY(0);
  }
  100% {
    transform: scaleY(1);
  }
}

.app-bar h1 {
  font-size: 24px;
  padding: 10px 0;
  font-weight: bold;
  margin: 0;
  color: var(--aq-main-strong);
  margin-left: -38px;
}

.play-toolbar {
  border-top: 2px solid var(--aq-main-strong);
  background: rgba(63, 138, 255, 0.22);
}

.naked-button {
  border: 0;
  background: transparent;
  transition: background-color 0.2s;
  border-radius: 4px;
  margin: 1px;
  cursor: pointer;
}

.naked-button:hover {
  background: var(--aq-hover-color, rgba(0, 0, 255, 0.1));
}

.naked-anchor {
  color: currentColor;
  text-decoration: none;
  display: inline-block;
}

.chunky-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.7em;
  padding: 0 8px;
}

.chunky-button > .b-icon {
  width: 25px;
  height: 25px;
}

.song-player .alert {
  margin: 0;
}

.player-shell__main {
  background: rgba(51, 104, 161, 0.15);
  overflow-y: scroll;
  position: relative;
}

.player-shell__main .song-player {
  height: 80%;
  width: 100%;
}
.player-shell__main .queue-provider-song-info {
  height: 80%;
}

.player-shell__sidebar {
  background: #f4f9fd;
  min-height: 0;
}

.player-placeholder {
  width: 100%;
  height: 100%;
  cursor: pointer;
  background: url("/src/assets/favicon.svg");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 250px;
}

.aq-card {
  border: 2px solid var(--aq-main-strong);
  border-radius: 8px;
  margin: 10px;
  padding: 10px 0;
  background: white;
}

.aq-pop-button {
  --aq-button-bg: var(--aq-main-weak);
  --aq-button-shadow: var(--aq-main-strong);
  background: var(--aq-button-bg);
  color: var(--aq-button-shadow);
  border: 0;
  border-radius: 8px;
  padding: 5px;

  box-shadow: 4px 4px 0 0 var(--aq-button-shadow);

  transform: translate(-4px, -4px);
  transition: transform 0.2s, box-shadow 0.2s;
}

.aq-pop-button.primary {
  --aq-button-bg: var(--aq-main-strong);
  --aq-button-shadow: var(--aq-main-weak);
  color: white;
  box-shadow: 4px 4px 0 0 var(--aq-button-shadow);
  min-width: 100px;
}

.aq-pop-button:hover {
  filter: brightness(1.1);
}

.aq-pop-button:active,
.aq-pop-button.active {
  filter: brightness(0.9);
  box-shadow: 0 0 0 1px var(--aq-button-shadow);
  transform: translate(0, 0) scale(0.9);
}

.aq-pop-button:disabled {
  opacity: 0.6;
  box-shadow: none;
  transform: translate(0, 0);
  pointer-events: none;
}

.aq-card__controls {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 0 10px;
}

.aq-dialog {
  z-index: 10000;
  bottom: 0;
  left: 0;
  padding-top: 0;
  overflow: clip;
}
.aq-dialog > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--aq-main-weak);
  color: var(--aq-main-strong);
}
.aq-dialog > header > h2 {
  font-size: 16px;
  margin: 0;
}
</style>
