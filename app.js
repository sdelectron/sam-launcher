// Sam Launcher v3 - Glassmorphism style, single-screen, no page scroll.
// Fix for v2 freeze: no extra tiles, no tvwindow HDMI switch, no self-launch.
// - Grid is 4 columns x 3 rows, fits one screen, body overflow hidden.
// - Arrows always move focus (preventDefault), OK activates focused tile.
// - Launch errors show an overlay instead of freezing.
// - HDMI tiles do NOT call tvwindow.show (that hid the launcher in v2). They
//   explain to use Samsung Home > Source, which is reliable from a module.
// - FreeTube tile does NOT launch TizenBrew itself (already inside it).
//   It launches YouTube, where TizenTube (ad-free YouTube mod) applies,
//   and explains FreeTube/TizenTube lives inside TizenBrew.
const CONFIG = { columns: 4, samsungHomeAppId: "com.samsung.tv.csfs" };
const TILES = [
  { id: "plex", emoji: "🍿", title: "Plex", detail: "Movies", kind: "app", appId: "kIciSQlYEM.plex" },
  { id: "netflix", emoji: "N", title: "Netflix", detail: "", kind: "app", appId: "org.tizen.netflix-app" },
  { id: "youtube", emoji: "▶", title: "YouTube", detail: "TizenTube", kind: "app", appId: "9Ur5IzDKqV.TizenYouTube" },
  { id: "disney", emoji: "✦", title: "Disney+", detail: "", kind: "app", appId: "MCmYXNxgcu.DisneyPlus" },
  { id: "hulu", emoji: "h", title: "Hulu", detail: "", kind: "app", appId: "LBUAQX1exg.Hulu" },
  { id: "spotify", emoji: "♪", title: "Spotify", detail: "", kind: "app", appId: "rJeHak5zRg.Spotify" },
  { id: "freetube", emoji: "▶", title: "FreeTube", detail: "In TizenBrew", kind: "freetube" },
  { id: "hdmi1", emoji: "1", title: "HDMI 1", detail: "", kind: "hdmi", source: "HDMI 1" },
  { id: "hdmi2", emoji: "2", title: "HDMI 2", detail: "", kind: "hdmi", source: "HDMI 2" },
  { id: "hdmi3", emoji: "🔊", title: "HDMI 3", detail: "ARC soundbar", kind: "hdmi", source: "HDMI 3 (ARC)" },
  { id: "ports", emoji: "▦", title: "All Ports", detail: "", kind: "ports" },
  { id: "samsung-home", emoji: "⌂", title: "Samsung Home", detail: "Settings & Sources", kind: "app", appId: CONFIG.samsungHomeAppId }
];
let focusIndex = 0;
function isTizen() { return typeof window !== "undefined" && !!window.tizen; }
function showOverlay(title, text) {
  document.getElementById("overlay-title").textContent = title;
  document.getElementById("overlay-text").textContent = text;
  document.getElementById("overlay").classList.remove("hidden");
  document.getElementById("overlay-close").focus();
}
function hideOverlay() {
  document.getElementById("overlay").classList.add("hidden");
  const el = document.querySelectorAll(".tile")[focusIndex];
  if (el) el.focus();
}
function render() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  TILES.forEach((tile, i) => {
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "tile"; btn.dataset.id = tile.id;
    btn.innerHTML = `<span class="icon">${tile.emoji}</span><span class="title">${tile.title}</span><span class="detail">${tile.detail || ""}</span>`;
    btn.addEventListener("click", (e) => { e.preventDefault(); focusIndex = i; renderFocus(); activate(tile); });
    btn.addEventListener("focus", () => { focusIndex = i; renderFocus(); });
    grid.appendChild(btn);
  });
  const first = document.querySelectorAll(".tile")[0];
  if (first) first.focus();
  renderFocus();
}
function renderFocus() {
  document.querySelectorAll(".tile").forEach((el, i) => el.classList.toggle("focused", i === focusIndex));
}
function launchApp(appId, title) {
  if (!isTizen()) { showOverlay("Preview mode", `Would launch ${title} on the TV. Tizen APIs are not available in a desktop browser.`); return; }
  try {
    window.tizen.application.launch(appId, function(){}, function(err){
      showOverlay("Could not open " + title, (err && err.message ? err.message : "launch failed") + ". Try opening it from Samsung Home once, then back here.");
    });
  } catch (e) { showOverlay("Could not open " + title, String(e && e.message ? e.message : e)); }
}
function activate(tile) {
  if (tile.kind === "ports") { showOverlay("All Ports — RU7100", "HDMI 1, HDMI 2, HDMI 3 (ARC, soundbar), USB 1, USB 2, Antenna, Component/Composite shared, Optical, Ethernet. Use Samsung Home > Source for USB / Antenna / Component. Audio stays on Receiver (HDMI ARC)."); return; }
  if (tile.kind === "hdmi") { showOverlay(tile.source, "HDMI switching from inside TizenBrew is not reliable, so this tile does not hide the launcher. Use Samsung Home > Source, then choose " + tile.source + ". Soundbar audio stays on Receiver (HDMI ARC)."); return; }
  if (tile.kind === "freetube") { showOverlay("FreeTube / TizenTube", "FreeTube is a module inside TizenBrew, not a separate Samsung app, so there is no app to launch from here. Press Back to return to TizenBrew's module list, where TizenTube (1.15.2) is listed. For ad-free YouTube now, use the YouTube tile here — TizenTube applies to it."); return; }
  if (tile.kind === "app") { launchApp(tile.appId, tile.title); return; }
}
function move(dir) {
  const cols = CONFIG.columns; let next = focusIndex;
  if (dir === "left") next = focusIndex - 1;
  if (dir === "right") next = focusIndex + 1;
  if (dir === "up") next = focusIndex - cols;
  if (dir === "down") next = focusIndex + cols;
  if (next >= 0 && next < TILES.length) { focusIndex = next; const el = document.querySelectorAll(".tile")[focusIndex]; if (el) el.focus(); renderFocus(); }
}
function tickClock() { const n = new Date(); document.getElementById("clock").textContent = n.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}); }
document.addEventListener("keydown", (e) => {
  const overlayOpen = !document.getElementById("overlay").classList.contains("hidden");
  if (overlayOpen) { if (e.keyCode === 13 || e.keyCode === 23) { e.preventDefault(); hideOverlay(); } return; }
  switch (e.keyCode) {
    case 37: move("left"); e.preventDefault(); break;
    case 39: move("right"); e.preventDefault(); break;
    case 38: move("up"); e.preventDefault(); break;
    case 40: move("down"); e.preventDefault(); break;
    case 13: case 23: e.preventDefault(); activate(TILES[focusIndex]); break;
    case 10009: case 461: break;
    default: break;
  }
});
document.getElementById("overlay-close").addEventListener("click", hideOverlay);
tickClock(); setInterval(tickClock, 10000); render();
