<template>
  <div class="tag-explorer">
    <div v-if="loading" style="text-align: center; padding: 20px;">
      <LoadingIcon style="width: 48px; height: 48px;" />
    </div>
    <div v-else>
      <div v-for="(subreddits, category) in groupedData" :key="category" @click="handleSubredditClick">
        <h3>{{ category }}</h3>
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
import { groupBy } from "lodash";
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
      groupedData: {}, // Holds the grouped data by category
    };
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

    // Group data by Category
    this.groupedData = groupBy(await loadMusicSubreddits(), "Category");

    this.loading = false;
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