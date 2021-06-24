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
}

.player-shell__sidebar {
  display: flex;
  flex-direction: column;
}

.player-shell__main {
  flex: 1;
}

@media (min-width: 960px) {
  .player-shell {
    flex-direction: row;
  }
  .player-shell__sidebar {
    width: 500px;
    border-right: 1px solid #AAA;
  }
}

@media (min-width: 600px) and (max-width: 960px) {
  .player-shell {
    flex-direction: row;
  }
  .player-shell__sidebar {
    width: 400px;
    border-right: 1px solid #AAA;
  }
}

@media (max-width: 600px) {
  .player-shell {
    flex-direction: column;
  }
  .player-shell__sidebar {
    max-height: 66vh;
  }

  .player-shell__main {
    order: 1;
  }
  .player-shell__sidebar {
    order: 2;
  }
}
</style>