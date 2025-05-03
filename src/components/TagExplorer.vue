<template>
  <div class="tag-explorer">
    <div v-if="loading" style="text-align: center; padding: 20px;">
      <LoadingIcon style="width: 48px; height: 48px;" />
    </div>
    <div v-else @click="handleSubredditClick">
      <div
        v-for="(subreddits, category) in (display == 'grouped' ? groupedData : {'All': subredditsSorted})"
        :key="category"
      >
        <h3 v-if="display == 'grouped'">{{ category }}</h3>
        <ul>
          <li
            v-for="subreddit in subreddits"
            :key="subreddit.Subreddit"
          >
            <a
              :class="{ active: subreddit.Subreddit === activeSubreddit }"
              :href="`/?url=${ subreddit.Subreddit }`"
              :title="subreddit.Description || null"
            >
              {{ subreddit.Subreddit.replace(/^\/r\//, "") }}
            </a>
          </li>
        </ul>
      </div>
      <div class="tag-explorer__footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script>
import { sortBy, uniqBy } from "lodash";
import LoadingIcon from "./icons/LoadingIcon.vue";
import { loadMusicSubreddits } from "../utils/reddit.js";

export default {
  name: "TagExplorer",
  components: {
    LoadingIcon,
  },

  props: {
    activeSubreddit: {
      type: String,
      default: null,
    },
  },

  data() {
    return {
      loading: false,

      /** @type {'flat' | 'grouped'} */
      display: 'grouped',

      /** @type {Array<{ Category: string, Subreddit: string, Description: string }>} */
      subreddits: [],
    };
  },

  computed: {
    subredditsSorted() {
      return uniqBy(
        sortBy(this.subreddits, s => s.Subreddit.toLowerCase()),
        s => s.Subreddit.toLowerCase()
      );
    },
    groupedData() {
      const result = {
        'Popular': [],
        'Redditor-made music': [],
        'All': this.subredditsSorted,
      };
      for (const subreddit of this.subreddits) {
        if (subreddit.Category == 'Redditor-made music') {
          result['Redditor-made music'].push(subreddit);
        } else if ([
          '/r/Music',
          '/r/ListenToThis',
        ].includes(subreddit.Subreddit)) {
          result['Popular'].push(subreddit);
        }
      }
      //uniq Popular and Redditor-made music
      result['Popular'] = uniqBy(result['Popular'], s => s.Subreddit.toLowerCase());
      result['Redditor-made music'] = uniqBy(result['Redditor-made music'], s => s.Subreddit.toLowerCase());

      return result;
    },
  },

  watch: {
    async activeSubreddit(newValue) {
      if (!newValue) return;

      await this.$nextTick();
      this.$el.querySelector("a.active")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },
  },

  methods: {
    /**
     * @param {MouseEvent} event
     */
    handleSubredditClick(event) {
      if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
        return; // Do nothing if any modifier keys are pressed
      }
      const a = event.target.closest("a");
      if (a) {
        event.preventDefault();
        const subreddit = a.getAttribute("href").split("=")[1];
        this.$emit("subreddit-selected", subreddit);
      }
    },
  },

  async mounted() {
    this.loading = true;
    this.subreddits = await loadMusicSubreddits();
    this.loading = false;

    if (this.activeSubreddit) {
      await this.$nextTick();
      this.$el.querySelector("a.active")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  },
};
</script>

<style>
.tag-explorer {
  overflow-y: auto;
}
.tag-explorer h3 {
  font-size: 18px;
  position: sticky;
  top: 0;
  background: #f4f9fd;
  border-bottom: 1px solid #ccc;
  z-index: 1;
  padding: 10px;
}
.tag-explorer ul {
  padding: 0;
  margin: 0;
  text-align: center;
}
.tag-explorer li {
  display: inline-block;
  white-space: nowrap;
}
.tag-explorer li > a {
  padding: 5px;
  text-decoration: none;
  position: relative;
  display: inline-block;
  border-radius: 10px;
  color: var(--aq-pill-color, currentColor);
  line-height: 1em;
}

.tag-explorer li > a[title] {
  text-decoration: underline dotted;
}

.tag-explorer li:nth-child(3n) > a {
  --aq-pill-color: #2563b1;
}

.tag-explorer li:nth-child(3n + 1) > a {
  --aq-pill-color: #0cb8a0;
}

.tag-explorer li:nth-child(3n + 2) > a {
  --aq-pill-color: #620cb8;
}

.tag-explorer li a.active {
  background-color: var(--aq-pill-color, currentColor);
  color: #fff;
}

.tag-explorer li a:hover::before {
  position: absolute;
  background-color: currentColor;
  border-radius: 10px;
  content: "";
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0.15;
  pointer-events: none;
}

.tag-explorer__footer {
  position: sticky;
  bottom: 0px;
  z-index: 10;
  animation: slideUp 0.3s;
  background: #f4f9fd;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.tag-explorer__footer .reddit-header {
  margin: 0;
  border-radius: 0;
}
</style>