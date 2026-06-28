import { createApp } from "vue";
import AsyncComputed from "vue-async-computed";
import App from "./App.vue";

const app = createApp(App);
app.use(AsyncComputed);
app.mount("#app");
