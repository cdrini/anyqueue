<template>
  <div class="tag-explorer">
    <div v-if="loading" style="text-align: center; padding: 20px;">
      <LoadingIcon style="width: 48px; height: 48px;" />
    </div>
    <div v-else>
      <div v-for="(subreddits, category) in groupedData" :key="category">
        <h3>{{ category }}</h3>
        <ul>
          <li
            v-for="subreddit in subreddits"
            :key="subreddit.Subreddit"
          >
            <a :href="`/?url=${ subreddit.Subreddit }`" :title="subreddit.Description || null">
              {{ subreddit.Subreddit.replace(/^\/r\//, "") }}
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { csvParse } from "d3-dsv";
import { groupBy } from "lodash";
import LoadingIcon from "./icons/LoadingIcon.vue";

/** @type {Array<{ Category: string, Subreddit: string, Description?: string }>} */
let TAG_DATA = null;

export default {
  name: "TagExplorer",
  components: {
    LoadingIcon,
  },

  data() {
    return {
      loading: false,
      groupedData: {}, // Holds the grouped data by category
    };
  },

  async mounted() {
    this.loading = true;

    // load csv from file
    if (!TAG_DATA) {
      const response = await fetch("Reddit Music Subreddits.csv");
      const text = await response.text();
      /** @type {Array<{ Category: string, Subreddit: string, Description?: string }>} */
      TAG_DATA = csvParse(text);
    }

    // Group data by Category
    this.groupedData = groupBy(TAG_DATA, "Category");

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
}

.tag-explorer li > a[title] {
  text-decoration: underline dotted;
}

.tag-explorer li:nth-child(3n) > a {
  color: #2563b1;
}

.tag-explorer li:nth-child(3n + 1) > a {
  color: #0cb8a0;
}

.tag-explorer li:nth-child(3n + 2) > a {
  color: #620cb8;
}

.tag-explorer li:hover a::before {
  position: absolute;
  background-color: currentColor;
  border-radius: 10px;
  content: "";
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0.15;
}
</style>