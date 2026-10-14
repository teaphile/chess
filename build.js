const fs = require("fs");
const path = require("path");
const dir = __dirname;
const css = fs.readFileSync(path.join(dir, "app.css"), "utf8");
const engine = fs.readFileSync(path.join(dir, "engine.js"), "utf8");
const pieces = fs.readFileSync(path.join(dir, "pieces.js"), "utf8");
const lessons = fs.readFileSync(path.join(dir, "lessons.js"), "utf8");
const app = fs.readFileSync(path.join(dir, "app.js"), "utf8");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#12100e">
<meta name="description" content="Meridian is a chess table for the browser: full rules, an adaptive computer, a score sheet, drills, and a methods course.">
<title>Meridian Chess</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='4' fill='%2312100e'/%3E%3Cpath fill='%23f0d8b8' d='M4 4h12v12H4zM16 16h12v12H16z'/%3E%3Cpath fill='%238a5434' d='M16 4h12v12H16zM4 16h12v12H4z'/%3E%3C/svg%3E">
<link rel="manifest" href="manifest.json">
<style>
${css}
</style>
</head>
<body>
<div class="app">
  <header class="top">
    <div class="brand">
      <svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="var(--frame-2)"/><path fill="var(--light)" d="M5 5h11v11H5zM16 16h11v11H16z"/><path fill="var(--dark)" d="M16 5h11v11H16zM5 16h11v11H5z"/></svg>
      <div>
        <p class="kicker">Meridian</p>
        <h1>Chess</h1>
      </div>
    </div>
    <div class="tools">
      <div class="swatches" role="group" aria-label="Theme">
        <button class="swatch" type="button" data-theme-pick="ink" aria-label="Ink" aria-pressed="true"><i></i><span>Ink</span></button>
        <button class="swatch" type="button" data-theme-pick="paper" aria-label="Paper"><i></i><span>Paper</span></button>
        <button class="swatch" type="button" data-theme-pick="night" aria-label="Night"><i></i><span>Night</span></button>
        <button class="swatch" type="button" data-theme-pick="club" aria-label="Club"><i></i><span>Club</span></button>
      </div>
      <button id="voice" class="icon-btn" type="button" aria-label="Spoken coach" aria-pressed="false" title="Spoken coach">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h9a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3H9l-4 3v-3H5a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3zM17 9a4 4 0 0 1 0 6"/></svg>
      </button>
      <button id="sound" class="icon-btn" type="button" aria-label="Sound" aria-pressed="true" title="Move sounds">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h4l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6"/></svg>
      </button>
    </div>
    <nav class="tabs" role="tablist" aria-label="Views">
      <button type="button" role="tab" data-view="play" aria-selected="true">Play</button>
      <button type="button" role="tab" data-view="learn">Learn</button>
      <button type="button" role="tab" data-view="score">Score</button>
    </nav>
  </header>

  <main class="stage" id="stage">
    <aside class="learn" id="learn" aria-label="Lessons"></aside>
    <section class="board-col" aria-label="Board">
      <div class="slot" id="slot">
        <div class="stack" id="stack">
        <div class="seat" id="seat-top"></div>
        <div class="frame" id="frame">
          <div class="ranks" id="ranks" aria-hidden="true"></div>
          <div class="board" id="board" role="application" aria-label="Chessboard. Tap or drag a piece.">
            <div class="squares" id="squares"></div>
            <div class="pieces" id="pieces"></div>
            <svg class="arrow" id="arrow" viewBox="0 0 8 8" preserveAspectRatio="none" aria-hidden="true"></svg>
            <div class="ribbon" id="ribbon" hidden>Review</div>
            <div class="promo" id="promo" hidden></div>
            <div class="ask" id="ask" hidden></div>
            <div class="end" id="end" hidden></div>
          </div>
          <div class="files" id="files" aria-hidden="true"></div>
        </div>
        <div class="seat" id="seat-bot"></div>
        </div>
      </div>
      <div class="readout" id="readout" aria-live="polite">
        <span class="eyebrow" id="read-kicker">Coach</span>
        <strong id="read-title">White to move</strong>
        <p id="read-body"></p>
      </div>
    </section>
    <aside class="folio" id="folio" aria-label="Score sheet">
      <header>
        <div>
          <h2 id="folio-title">Score</h2>
          <p class="sub" id="folio-sub"></p>
        </div>
        <span class="chip" id="folio-chip"></span>
      </header>
      <div class="folio-tools">
        <button class="mini-btn" id="copy-score" type="button">Copy score</button>
        <button class="mini-btn" id="copy-link" type="button">Copy link</button>
      </div>
      <div class="sheet" id="sheet"></div>
      <footer>Click a move to review it. Arrow keys step through. U undo · F flip · H hint · N new · M sound.</footer>
    </aside>
  </main>
  <nav class="dock" id="dock" aria-label="Controls"></nav>
</div>
<script>
${engine}
</script>
<script>
${pieces}
</script>
<script>
${lessons}
</script>
<script>
${app}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(dir, "index.html"), html);
console.log("wrote index.html", html.length);
