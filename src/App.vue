<template>
  <PlayerShell id="app">
    <template v-slot:menus>
      <details>
        <summary>Import...</summary>
        <!-- <div class="spreadsheet-row">
            CSV:
            <input type="url" v-model="this.csvLink" />
            <button @click="loadSpreadsheet">Reload</button>
          </div> -->
        <div class="free-text-row">
          <select v-model="inputFormat">
            <option value="html">
              HTML (e.g. copy paste from Google docs)
            </option>
            <option value="text">List of URLs</option>
            <option value="csv">List of CSV song objects</option>
            <option value="url">Fetch from url</option>
          </select>
          <small v-if="inputFormat == 'csv'">
            Example: <code>"title","artist","link"</code>
          </small>
          <div v-if="inputFormat == 'url'">
            Supported URLs: Reddit
            <input type="url" v-model="inputUrl" />
          </div>
          <div v-else>
            <textarea v-model="freeText" @paste="transformFreeTextPaste" />
          </div>
          <button @click="loadFreeText">Reload</button>
        </div>
      </details>
      <details v-if="urlParams.get('debug') === 'true'">
        <summary>Share/Export</summary>
        <!-- <button @click="makeShareLink">Get Share Link</button> -->
        <!-- <a :href="this.shareLink">{{ this.shareLink }}</a> -->
        <button @click="saveToDropbox">Save to Dropbox</button>
      </details>
      <Playlist
        class="playlist"
        :songs="songs"
        :playerQueue="playerQueue"
        @song-clicked="(index) => playerQueue.playTrackAt(index)"
      />
    </template>
    <template v-slot:toolbar>
      <PlayToolbar :player-queue="playerQueue" />
    </template>
    <template v-slot:main>
      <component
        v-if="
          queueProviderComponent && (
            (playerQueue.activeSong.extra_links && playerQueue.activeSong.extra_links.find(l => l.includes('reddit.com')))
            || playerQueue.activeSong.link.includes('reddit.com')
          )"
        class="queue-provider-song-info"
        :is="queueProviderComponent"
        :url="playerQueue.activeSong.link.includes('reddit.com') ? playerQueue.activeSong.link : playerQueue.activeSong.extra_links.find(l => l.includes('reddit.com'))"
      />
      <component
        v-if="playerQueue.started && playerQueue.activeSong"
        :is="playerQueue.activeSong.player"
        ref="activeSongPlayer"
        :song="playerQueue.activeSong"
        :url="playerQueue.activeSong.link"
        :warning="humanReadableWarning(playerQueue.activeSong)"
        :autoplay="true"
        @ended="skipForward(true)"
      />
      <div class="player-placeholder" v-else @click="playerQueue.start()" />
    </template>
  </PlayerShell>
</template>

<script>
import { csvParse } from "d3-dsv";
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
import { HTMLQueueProvider, extractSongsFromHtml } from "./models/QueueProviders/HTMLQueueProvider.js";
import { RedditQueueProvider } from "./models/QueueProviders/RedditQueueProvider.js";
import ReddigtSongInfo from './components/QueueProviderSongInfo/RedditSongInfo.vue';

// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue);
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);

function speak(utterance) {
  const mainPromise = new Promise((res, rej) => {
    utterance.onend = res;
    utterance.onerror = rej;
    window.speechSynthesis.speak(utterance);
  });

  return Promise.race([
    mainPromise,
    // Because safari is... how do you say... complete garbage?
    // It sometimes doesn't fire the onend event -_-
    new Promise((res) => setTimeout(res, 3000)),
  ]);
}

const PROVIDERS = [
  { provider: new YouTubeProvider(), player: YouTubePlayer },
  { provider: new IAProvider(), player: IAPlayer },
  { provider: new SoundCloudProvider(), player: SoundCloudPlayer },
  { provider: new SpotifyProvider(), player: SpotifyPlayer },
  { provider: new GoogleDriveProvider(), player: GoogleDrivePlayer },
  { provider: new AudioMackProvider(), player: AudioMackPlayer },
  { provider: new RedditProvider(), player: RedditPlayer },
];

const QUEUE_PROVIDERS = [
  { provider: new RedditQueueProvider(), songInfo: ReddigtSongInfo },
  { provider: new HTMLQueueProvider() },
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
        s.warnings = [];

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
          s.warnings.push('An error ocurred');
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
    Playlist,
    PlayToolbar,
    PlayerShell,
  },
  data() {
    return {
      /** @type {'html' | 'text' | 'csv' | 'url'} */
      inputFormat: "html",
      queueProviderComponent: null,
      inputUrl: "",
      csvLink:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmmpv0faY2yRLDcmGb1kHobGwfdOazcpNcL1u9649-AZfiHqeeTDji0bElgvFFMa-tl7h1-kBpngwv/pub?gid=0&single=true&output=csv",
      freeText: "",
      songs: [],

      shareLink: null,
      playerQueue: new PlayerQueue([]),

      speakingWarning: false,

      urlParams: new URLSearchParams(window.location.search),
    };
  },

  async mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get("share-lzma");
    const shareObj = shareParam
      ? await jsonUrl("lzma").decompress(shareParam)
      : {};

    if (localStorage["App::csvLink"])
      this.csvLink = localStorage["App::csvLink"];
    if (localStorage["App::freeText"])
      this.freeText = localStorage["App::freeText"];
    if (localStorage["App::activeSongIndex"])
      this.playerQueue.activeSongIndex = JSON.parse(
        localStorage["App::activeSongIndex"]
      );

    if (urlParams.has("url")) {
      this.inputFormat = "url";
      this.inputUrl = urlParams.get("url");
      await this.loadFreeText();
    }

    const songs =
      shareObj.songs ||
      (localStorage["App::songs"] && JSON.parse(localStorage["App::songs"])) ||
      SONGS;
    await processSongs(songs, this.activeSongIndex);
    this.songs = songs;
    this.playerQueue.load(this.songs);
  },
  watch: {
    csvLink(val) {
      localStorage["App::csvLink"] = val;
    },
    freeText(val) {
      localStorage["App::freeText"] = val;
    },
    songs(val) {
      localStorage["App::songs"] = JSON.stringify(val);
    },
    "playerQueue.activeSongIndex"(val) {
      localStorage["App::activeSongIndex"] = val;
    },
    "playerQueue.activeSong"() {
      if (this.playerQueue.started && !this.speakingWarning) {
        this.speakAnyWarnings();
      }
    },
    "playerQueue.started"() {
      if (this.playerQueue.started && !this.speakingWarning) {
        this.speakAnyWarnings();
      }
    },
  },

  methods: {
    humanReadableWarning(song) {
      let warning = "";
      if (
        song.player.supportsAutoplay === false &&
        song.player.supportsEndEvent === false
      ) {
        warning = `Because this next song is from ${song.provider.name}, you'll need to manually click "play" to start the song, and manually click "skip" once the song is over.`;
      } else if (!song.player.supportsAutoplay === false) {
        warning = `Because this next song is from ${song.provider.name}, you'll need to manually click "play" to start the song.`;
      } else if (!song.player.supportsEndEvent === false) {
        warning = `Because this next song is from ${song.provider.name}, you'll need to manually click "skip" once the song is over.`;
      }

      return warning;
    },
    async speakAnyWarnings() {
      this.speakingWarning = true;
      const song = this.playerQueue.activeSong;
      const warning = this.humanReadableWarning(song);
      if (warning) {
        const utterance = new SpeechSynthesisUtterance(warning);
        await speak(utterance);
      }

      this.speakingWarning = false;
    },

    /**
     * @param {ClipboardEvent} ev
     */
    async transformFreeTextPaste(ev) {
      if (this.inputFormat === "html") {
        ev.preventDefault();
        const items = ev.clipboardData.items;
        let chosenItem = items[0];
        for (const item of items) {
          if (item.type === "text/html") chosenItem = item;
        }
        this.freeText = await new Promise((res) => chosenItem.getAsString(res));
      }
    },

    async start() {
      this.playerQueue.start();

      if ("mediaSession" in navigator) {
        // navigator.mediaSession.setActionHandler('seekbackward', () => this.jumpBackward());
        // navigator.mediaSession.setActionHandler('seekforward', () => this.jumpForward());
        // navigator.mediaSession.setActionHandler('previoustrack', () => this.jumpBackward());
        navigator.mediaSession.setActionHandler("nexttrack", this.skipForward);
      }
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

    async loadSpreadsheet() {
      let csvString = await fetch(this.csvLink).then((r) => r.text());
      // make the first line lowercase
      csvString = csvString.replace(/^.*/, ($0) => $0.toLowerCase());
      csvParse(csvString);
    },

    async loadFreeText() {
      let songs = [];
      this.queueProviderComponent = null;
      if (this.inputFormat == "url") {
        const {provider, songInfo = null} = QUEUE_PROVIDERS.find(({provider}) => provider.testUrl(this.inputUrl));
        this.queueProviderComponent = songInfo;
        songs = await provider.extract(this.inputUrl);
      }
      else if (this.inputFormat === "html") {
        songs = extractSongsFromHtml(this.freeText);
      }
      else if (this.inputFormat === "text") {
        songs = this.freeText
          .trim()
          .split("\n")
          .map((l) => l.trim())
          .map((link) => ({ title: "", artist: "", link }));
      }
      else if (this.inputFormat === "csv") {
        songs = csvParse("title,artist,link\n" + this.freeText)
      }

      console.log(this.inputFormat, songs);
      await processSongs(songs, 0);
      this.songs = songs.filter((s) => s.provider);
      this.playerQueue.load(this.songs);
    },

    resume() {
      this.$refs.activeSongPlayer.resume();
    },
    pause() {
      this.$refs.activeSongPlayer.pause();
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
        await speak(utterance);
      }

      if (this.playerQueue.nextSong) {
        if ("mediaSession" in window) {
          navigator.mediaSession.metadata = new window.MediaMetadata({
            title: this.nextSong.title,
            artist: this.nextSong.artist,
            album: this.nextSong.album,
            // artwork: [
            //   { src: br.options.thumbnail, type: 'image/jpg' },
            // ]
          });
        }
        this.playerQueue.skip();
      }
    },
  },
};
</script>

<style>
#app {
  font-family: "Roboto", "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  display: flex;
}

html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.free-text-row {
  padding: 4px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.free-text-row textarea {
  white-space: pre;
}

.spreadsheet-row {
  display: flex;
  margin: 4px;
  align-items: center;
}
.spreadsheet-row input {
  flex: 1;
  margin: 0 4px;
}

.playlist {
  flex: 1;
  overflow-y: auto;
}

.play-toolbar {
  border-top: 2px solid rgb(42, 119, 212);
  background: rgba(63, 138, 255, 0.22);
}

.naked-button {
  border: 0;
  background: transparent;
  transition: background-color 0.2s;
  border-radius: 4px;
  margin: 1px;
}

.naked-button:hover {
  background: rgba(0, 0, 255, 0.1);
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
  display: flex;
  flex-direction: column;
}

.player-shell__main .queue-provider-song-info {
  height: 33%;
}

.player-shell__sidebar {
  background: #F4F9FD;
  min-height: 0;
}

.player-placeholder {
  width: 100%;
  height: 100%;
  cursor: pointer;
  background: url("/favicon.ico");
  background-repeat: no-repeat;
  background-position: center;
}
</style>
