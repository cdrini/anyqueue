<template>
  <iframe
    ref="iframe"
    width="100%"
    height="100%"
    scrolling="no"
    frameborder="no"
    allow="autoplay"
    :src="src"
    @load="initSoundcloudListeners"
  >
  </iframe>
</template>

<script>
async function loadScript(url) {
  return new Promise((res, rej) => {
    const script = document.createElement("script");
    script.onload = res;
    script.onerror = rej;
    script.src = url;
    document.head.append(script);
  });
}

// Doesn't seem to be synchronizing correctly, so just
// do it here once.
loadScript("https://w.soundcloud.com/player/api.js");

export default {
  name: "SoundCloudPlayer",
  props: {
    url: {
      type: String,
    },
    song: {
      type: Object,
    },
    autoplay: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      duration: null,

      interval: null,
    };
  },

  computed: {
    widget() {
      return window.SC.Widget(this.$refs.iframe);
    },

    urlParams() {
      return {
        url: this.apiURL,
        auto_play: this.autoplay,
        visual: true,
        secret_token: this.apiSecret,
        show_teaser: false,
      };
    },

    src() {
      return `https://w.soundcloud.com/player/?${new URLSearchParams(
        this.urlParams
      )}`;
    },

    oembedIFrameURL() {
      const iframeHtml = new DOMParser().parseFromString(
        this.song.oembed.html,
        "text/html"
      );
      return new URL(iframeHtml.querySelector("iframe").getAttribute("src"));
    },

    apiURL() {
      return this.oembedIFrameURL.searchParams.get("url");
    },

    apiSecret() {
      return this.oembedIFrameURL.searchParams.get("secret_token");
    },
  },

  methods: {
    /**
     * @returns {Promise<number>}
     */
    async getPosition() {
      return new Promise((res, rej) => {
        if (!this.widget) rej();
        this.widget.getPosition((position) => res(position));
      });
    },

    /**
     * @returns {Promise<boolean>}
     */
    async isPaused() {
      return new Promise((res, rej) => {
        if (!this.widget) rej();
        this.widget.isPaused((paused) => res(paused));
      });
    },

    onFinish(ev) {
      console.log("FINISH");
      clearInterval(this.interval);
      this.$emit("ended", ev);
    },

    async initSoundcloudListeners() {
      const SC = window.SC;

      this.widget.unbind(SC.Widget.Events.READY);
      this.widget.bind(SC.Widget.Events.READY, async (ev) => {
        this.$emit("ready", ev);
        this.$emit("load", { iframe: this.$refs.iframe });

        // Again, I think widget is for some reason not up-to-date!
        // So if we're stuck at the beginning, first play.
        for (let i = 0; i < 3; i++) {
          await new Promise((res) => setTimeout(res, 100));
          if ((await this.getPosition()) === 0 && (await this.isPaused())) {
            // Sometimes mobile doesn'tautoplay (mobile device)
            this.widget.play();
          }
        }
      });

      // I think widget isn't up-to-date; so loop and just attach
      // this repeatedly
      clearInterval(this.interval);
      this.interval = setInterval(() => {
        this.widget.unbind(SC.Widget.Events.FINISH);
        this.widget.bind(SC.Widget.Events.FINISH, this.onFinish);
      }, 1000);
    },
  },

  destroyed() {
    clearInterval(this.interval);
  },
};
</script>