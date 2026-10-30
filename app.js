// Sam Launcher — a plain, signed Tizen web app. It does NOT root the TV,
// replace Tizen, or disable Samsung services. It is an ordinary app you
// open instead of Smart Hub, with Samsung Home kept as a recovery tile.
//
// First test: Plex only, no Moonfin/Jellyfin tiles. Plex and Jellyfin
// monitor the same movie folder, so the library is the same either way.
const CONFIG = {
  columns: 4,
  // Samsung's own home app, used only as the recovery / settings escape hatch.
  samsungHomeAppId: "com.samsung.tv.csfs"
};

const STATIC_TILES = [
  { id: "plex", emoji: "🍿", title: "Plex", detail: "Your movie library via Plex", kind: "app", appId: "kIciSQlYEM.plex" },
  { id: "netflix", emoji: "🎬", title: "Netflix", detail: "Installed Netflix app", kind: "app", appId: "org.tizen.netflix-app" },
  { id: "freetube", emoji: "▶️", title: "FreeTube", detail: "Inside TizenBrewNextGeneration, not a Samsung app", kind: "app", appId: "xvvl3S1bvH.TizenBrewStandalone" },
  { id: "youtube", emoji: "📺", title: "YouTube", detail: "Backup video app", kind: "app", appId: "9Ur5IzDKqV.TizenYouTube" },
  { id: "disney", emoji: "✨", title: "Disney+", detail: "Installed Disney+ app", kind: "app", appId: "MCmYXNxgcu.DisneyPlus" },
  { id: "hulu", emoji: "🟢", title: "Hulu", detail: "Installed Hulu app", kind: "app", appId: "LBUAQX1exg.Hulu" },
  { id: "spotify", emoji: "🎵", title: "Spotify", detail: "Installed Spotify app", kind: "app", appId: "rJeHak5zRg.Spotify" },
  { id: "samsung-home", emoji: "🏠", title: "Samsung Home", detail: "Back to Samsung menus, settings and Sources", kind: "app", appId: CONFIG.samsungHomeAppId },
  { id: "hdmi1", emoji: "🔌", title: "HDMI 1", detail: "Show HDMI 1 full screen", kind: "hdmi", source: 0 },
  { id: "hdmi2", emoji: "🔌", title: "HDMI 2", detail: "Show HDMI 2 full screen", kind: "hdmi", source: 1 },
  { id: "hdmi3", emoji: "🔊", title: "HDMI 3 (ARC)", detail: "ARC soundbar port — audio stays on Receiver", kind: "hdmi", source: 2 },
  { id: "ports", emoji: "🧩", title: "All Ports", detail: "HDMI 1-3, USB 1-2, Antenna, Component, Optical", kind: "ports" }
];

let installedApps = [];

let tiles = [...STATIC_TILES];
let focusIndex = 0;

function isTizen() {
  return typeof window !== "undefined" && !!window.tizen;
}

function showOverlay(title, text) {
  document.getElementById("overlay-title").textContent = title;
  document.getElementById("overlay-text").textContent = text;
  document.getElementById("overlay").classList.remove("hidden");
  document.getElementById("overlay-close").focus();
}

function hideOverlay() {
  document.getElementById("overlay").classList.add("hidden");
  renderFocus();
}

function showNotice(text) {
  const el = document.getElementById("notice");
  el.textContent = text;
  el.classList.remove("hidden");
}

function render() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  tiles.forEach((tile, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile";
    btn.dataset.index = String(i);
    btn.innerHTML = `<span class="emoji">${tile.emoji}</span><span class="title">${tile.title}</span><span class="detail">${tile.detail}</span>`;
    btn.addEventListener("click", () => activate(tile));
    btn.addEventListener("focus", () => { focusIndex = i; renderFocus(); });
    grid.appendChild(btn);
  });
  renderFocus();
}

function renderFocus() {
  document.querySelectorAll(".tile").forEach((el, i) => {
    el.classList.toggle("focused", i === focusIndex);
    if (i === focusIndex && document.activeElement !== el && !document.getElementById("overlay").classList.contains("hidden") === false) {
      // Keep focus visible without stealing it from the overlay close button.
      el.focus({ preventScroll: false });
    }
  });
}

function launchApp(appId, fallbackTitle) {
  if (!isTizen()) {
    showOverlay("Preview mode", `Would launch app ${appId} on the TV. Tizen APIs are not available in a desktop browser.`);
    return;
  }
  try {
    window.tizen.application.launch(appId,
      () => {},
      (err) => showOverlay("Could not open app", `${fallbackTitle || appId}: ${err && err.message ? err.message : "launch failed"}`)
    );
  } catch (e) {
    showOverlay("Could not open app", String(e && e.message ? e.message : e));
  }
}

function activate(tile) {
  if (tile.kind === "ports") {
    showOverlay("All ports on this TV (RU7100)", "HDMI 1, HDMI 2, HDMI 3 (ARC, soundbar), USB 1, USB 2, Antenna/RF, Component/Composite shared, Optical audio out, Ethernet. HDMI 1-3 are launchable tiles here. USB, Antenna and Component are in Samsung Home > Source, not switchable from a launcher tile.");
    return;
  }
  if (tile.kind === "namedApp") {
    const found = installedApps.find((a) => a && a.name && a.name.toLowerCase().includes(tile.match));
    if (found) { launchApp(found.id, tile.title); return; }
    if (!isTizen()) { showOverlay("Preview mode", `Would launch ${tile.title} on the TV if installed.`); return; }
    showOverlay(`${tile.title} not found`, `${tile.title} is not installed on this TV yet. Install it from Smart Hub / Samsung Apps first, then it will open from this tile.`);
    return;
  }
  if (tile.kind === "app") {
    launchApp(tile.appId, tile.title);
    return;
  }
  if (tile.kind === "hdmi") {
    if (!isTizen() || !window.tizen.tvwindow) {
      showOverlay("HDMI switching needs the TV", "On the TV this tile uses the tvwindow privilege to show that HDMI source full screen. In preview mode it cannot switch inputs.");
      return;
    }
    try {
      // API shapes vary slightly by Tizen version; this is guarded so a
      // missing method shows a message instead of crashing the launcher.
      if (typeof window.tizen.tvwindow.show === "function") {
        window.tizen.tvwindow.show(() => {}, (err) => showOverlay("HDMI", String(err && err.message ? err.message : err)));
      } else {
        showOverlay("HDMI", "tvwindow.show is not available on this firmware. Use the Source button on the remote for this input.");
      }
    } catch (e) {
      showOverlay("HDMI", String(e && e.message ? e.message : e));
    }
    return;
  }
}

function move(delta) {
  const cols = CONFIG.columns;
  let next = focusIndex;
  if (delta === "left") next = focusIndex - 1;
  if (delta === "right") next = focusIndex + 1;
  if (delta === "up") next = focusIndex - cols;
  if (delta === "down") next = focusIndex + cols;
  if (next >= 0 && next < tiles.length) {
    focusIndex = next;
    const el = document.querySelectorAll(".tile")[focusIndex];
    if (el) el.focus();
  }
}

function loadInstalledApps() {
  if (!isTizen()) {
    document.getElementById("preview-note").classList.remove("hidden");
    return;
  }
  try {
    window.tizen.application.getAppsInfo((apps) => {
      installedApps = apps || [];
      const covered = ["netflix", "youtube", "disney", "hulu", "spotify", "plex", "tizenbrew", "freetube"];
      const extra = (apps || [])
        .filter((a) => a && a.id && a.id !== "com.sam.tvlauncher" && a.id !== CONFIG.samsungHomeAppId && a.id !== "xvvl3S1bvH.TizenBrewStandalone" && !covered.some((c) => (a.name || "").toLowerCase().includes(c)))
        .slice(0, 12)
        .map((a) => ({ id: a.id, emoji: "📺", title: a.name || a.id, detail: "Installed app", kind: "app", appId: a.id }));
      if (extra.length) {
        tiles = [...STATIC_TILES, ...extra];
        render();
      }
    }, () => {});
  } catch (e) {
    // Stay with the static tiles; installed-app discovery is a bonus, not required.
  }
}

function tickClock() {
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

document.addEventListener("keydown", (e) => {
  if (!document.getElementById("overlay").classList.contains("hidden")) {
    if (e.keyCode === 13 || e.keyCode === 23) hideOverlay();
    return;
  }
  switch (e.keyCode) {
    case 37: move("left"); e.preventDefault(); break; // Left
    case 39: move("right"); e.preventDefault(); break; // Right
    case 38: move("up"); e.preventDefault(); break; // Up
    case 40: move("down"); e.preventDefault(); break; // Down
    case 13: case 23: activate(tiles[focusIndex]); e.preventDefault(); break; // OK / Enter
    case 10009: case 461: break; // Back: stay on the launcher on purpose
    default: break;
  }
});

document.getElementById("overlay-close").addEventListener("click", hideOverlay);
tickClock();
setInterval(tickClock, 10000);
render();
loadInstalledApps();
