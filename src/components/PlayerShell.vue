<template>
  <div class="player-shell">
    <div class="player-shell__sidebar">
      <slot name="menus" />
      <slot name="toolbar" />
    </div>
    <div class="player-shell__main">
      <slot name="main" />
    </div>
  </div>
</template>

<style>
.player-shell {
  width: 100%;
  height: 100%;
  display: flex;
}

.player-shell__sidebar {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #aaa;
}

.player-shell__main {
  flex: 1;
}

@media (min-width: 960px) {
  .player-shell__sidebar {
    width: 500px;
  }
}

@media (min-width: 600px) and (max-width: 960px) {
  .player-shell__sidebar {
    width: 400px;
  }
}

@media (max-width: 600px) {
  .player-shell {
    /** Ensures there's a big of the main pane peaking as an affordance */
    width: calc(200vw - 80px);
  }
  .player-shell__sidebar {
    flex: 1;
  }
  .player-shell__main {
    flex: 1;
  }
}
</style>