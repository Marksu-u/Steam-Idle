function toMs(num) {
  return num * 3600000;
}

export function legacyLaunch(appids) {
  const games = appids.split(",").map(entry => entry.trim());
  window.api.legacyLaunch(games);
}

export function launch(games) {
  const payload = games.map(game => ({
    appid: game.appid,
    time: toMs(game.time),
    name: game.name
  }));
  window.api.launch(payload);
}
