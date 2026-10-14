/* Meridian — play, review, and a short original course. No network. */
(function () {
  "use strict";

  const FILES = "abcdefgh";
  const VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const NAMES = Study.NAMES;
  const LEVELS = { match: "match", gentle: "casual", club: "club", sharp: "expert", master: "master" };
  const LEVEL_NAME = { match: "Match", gentle: "Easy", club: "Club", sharp: "Expert", master: "Master" };
  const THEME_COLOR = { ink: "#12100e", paper: "#e7e1d4", night: "#0c0e12", club: "#1a1612" };
  const KEY = "meridian-chess-v1";
  const DRILL = ["e4", "d5", "a1", "h8", "c7", "f2", "b6", "g3"];
  const BOOK = {
    "": ["e2e4", "d2d4", "g1f3", "c2c4"],
    e2e4: ["e7e5", "c7c5", "e7e6", "c7c6"],
    "e2e4,e7e5": ["g1f3", "f1c4"],
    "e2e4,e7e5,g1f3": ["b8c6", "g8f6"],
    "e2e4,e7e5,g1f3,b8c6": ["f1b5", "f1c4"],
    "e2e4,c7c5": ["g1f3", "b1c3"],
    "e2e4,e7e6": ["d2d4"],
    "e2e4,c7c6": ["d2d4"],
    d2d4: ["d7d5", "g8f6"],
    "d2d4,d7d5": ["c2c4", "g1f3"],
    "d2d4,g8f6": ["c2c4", "g1f3"],
    "g1f3": ["d7d5", "g8f6"],
    c2c4: ["e7e5", "g8f6"],
    "e2e4,e7e5,g1f3,b8c6,f1b5": ["a7a6", "g8f6"],
    "e2e4,e7e5,g1f3,b8c6,f1c4": ["g8f6", "f8c5"],
    "e2e4,c7c5,g1f3": ["d7d6", "b8c6", "e7e6"],
    "d2d4,d7d5,c2c4": ["e7e6", "c7c6"],
    "d2d4,g8f6,c2c4": ["e7e6", "g7g6"],
  };

  const $ = (s) => document.querySelector(s);
  const els = {};

  let theme = "ink";
  let soundOn = true;
  let voiceOn = false;
  let coachOn = true;
  let view = "play";
  let mode = "ai";
  let human = "w";
  let level = "gentle";
  let flipped = false;
  let state = null;
  let root = null;
  let history = [];
  let keys = [];
  let book = [];
  let cursor = null;
  let selected = null;
  let legal = [];
  let drag = null;
  let promo = null;
  let ask = null;
  let arrow = null;
  let busy = false;
  let token = 0;
  let coachTitle = "White to move";
  let coachText = "Pick up a piece. Legal squares are marked.";
  let lessonId = null;
  let lessonLock = false;
  let drill = null;
  let done = {};
  let playSnap = null;
  let endDismissed = false;
  let pieces = [];
  let nextPid = 1;
  let audio = null;
  let learnSig = "";
  let rating = 1000;
  let notes = [];
  let seat = 1000;
  let rated = false;
  let noteMode = false;

  function uci(m) {
    return FILES[m.fc] + (8 - m.fr) + FILES[m.tc] + (8 - m.tr) + (m.promotion || "");
  }

  function lesson() {
    return Study.LESSONS.find((l) => l.id === lessonId) || null;
  }

  function shown() {
    if (cursor == null) return state;
    if (cursor === 0) return root;
    return history[cursor - 1].state;
  }

  function currentMove() {
    if (cursor == null) return history.length ? history[history.length - 1].move : null;
    if (cursor === 0) return null;
    return history[cursor - 1].move;
  }

  function sideName(c) {
    if (lessonId) return c === "w" ? "White" : "Black";
    if (mode === "two") return c === "w" ? "White" : "Black";
    return c === human ? "You" : "Computer";
  }

  function isNarrow() {
    return window.innerWidth < 720 || window.innerHeight < 500;
  }

  function canMove(color) {
    if (!state || busy || lessonLock || cursor != null || promo || ask || state.over || drill) return false;
    if (view === "learn") return color === state.turn;
    if (mode === "two") return color === state.turn;
    return color === human && color === state.turn;
  }

  function save() {
    const src = playSnap || { book, flipped, mode, human, level };
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          theme,
          sound: soundOn,
          voice: voiceOn,
          coach: coachOn,
          mode: src.mode || mode,
          human: src.human || human,
          level: src.level || level,
          flipped: src.flipped,
          ucis: src.book || [],
          done,
          rating,
          notes,
        })
      );
    } catch (e) {
      /* private mode */
    }
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function applyTheme(name) {
    theme = THEME_COLOR[name] ? name : "ink";
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
    if (window.Pieces) Pieces.setPalette(theme);
    pieces.forEach((p) => {
      if (!p.gone) p.el.innerHTML = Pieces.pieceSVG(p.t, p.color, p.color === "w" ? "right" : "left");
    });
    document.querySelectorAll(".swatch").forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.themePick === theme ? "true" : "false");
    });
  }

  function tone(freq, dur, type) {
    if (!soundOn) return;
    try {
      audio = audio || new AudioContext();
      if (audio.state === "suspended") audio.resume();
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = type || "sine";
      o.frequency.value = freq;
      g.gain.value = 0.045;
      o.connect(g);
      g.connect(audio.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
      o.stop(audio.currentTime + dur);
    } catch (e) {
      /* audio unavailable */
    }
  }

  function speak(text) {
    if (!voiceOn || !text || !window.speechSynthesis) return;
    try {
      const line = String(text).replace(/\s+/g, " ").trim();
      if (!line) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(line.slice(0, 280));
      u.lang = "en-US";
      u.rate = 1;
      speechSynthesis.speak(u);
    } catch (e) {
      /* speech unavailable */
    }
  }

  function sound(kind) {
    if (kind === "move") tone(523, 0.07);
    else if (kind === "cap") tone(196, 0.09, "triangle");
    else if (kind === "check") tone(740, 0.1);
    else if (kind === "ok") tone(660, 0.09);
    else if (kind === "no") tone(164, 0.12, "square");
    else if (kind === "end") {
      tone(494, 0.1);
      setTimeout(() => tone(370, 0.16), 110);
    }
  }

  function fitBoard() {
    const col = els.boardCol;
    const frame = els.frame;
    if (!col || !frame || col.clientWidth < 8 || col.clientHeight < 8) return;
    const compact = window.innerHeight < 520;
    const tiny = window.innerHeight < 380;
    document.documentElement.classList.toggle("compact", compact);
    const lessonText = view === "learn" && (!!lessonId || noteMode);
    const showRead = !tiny || lessonText;
    const readH = showRead ? Math.max(els.readout.offsetHeight || 28, lessonText ? 52 : 24) + 8 : 0;
    const seatH = (els.seatTop.offsetHeight || 20) + (els.seatBot.offsetHeight || 20) + 8;
    const size = Math.floor(Math.min(col.clientWidth - 2, col.clientHeight - readH - seatH));
    if (size < 48) return;
    frame.style.width = size + "px";
    frame.style.height = size + "px";
    if (els.stack) els.stack.style.width = size + "px";
    if (showRead) els.readout.style.width = size + "px";
  }

  function syncLayout() {
    const narrow = isNarrow();
    els.stage.classList.toggle("learn-open", view === "learn");
    els.stage.classList.toggle("score-open", view === "score" && narrow);
    els.stage.classList.toggle("list-open", view === "learn" && narrow && !lessonId && !noteMode);
    document.querySelectorAll(".tabs button").forEach((b) => {
      b.setAttribute("aria-selected", b.dataset.view === view ? "true" : "false");
    });
  }

  function emptyBoard() {
    return Array.from({ length: 8 }, () => Array(8).fill(null));
  }

  function rebuildPieces(board) {
    els.pieces.replaceChildren();
    pieces = [];
    nextPid = 1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) addPiece(p.t, p.c, r, c);
      }
    }
    placePieces(false);
  }

  function addPiece(t, color, r, c) {
    const el = document.createElement("div");
    el.className = "piece";
    el.innerHTML = Pieces.pieceSVG(t, color, color === "w" ? "right" : "left");
    els.pieces.appendChild(el);
    const obj = { id: nextPid++, t, color, r, c, el, gone: false };
    pieces.push(obj);
    return obj;
  }

  function placePieces(animate) {
    pieces.forEach((p) => {
      if (p.gone) return;
      const vr = flipped ? 7 - p.r : p.r;
      const vc = flipped ? 7 - p.c : p.c;
      p.el.style.transition = animate ? "" : "none";
      p.el.style.width = "";
      p.el.style.height = "";
      p.el.style.left = vc * 12.5 + "%";
      p.el.style.top = vr * 12.5 + "%";
    });
  }

  function removePiece(p) {
    if (!p || p.gone) return;
    p.gone = true;
    p.el.remove();
  }

  function animateMove(move) {
    const mover = pieces.find((p) => !p.gone && p.r === move.fr && p.c === move.fc);
    if (!mover) {
      rebuildPieces(state.board);
      return;
    }
    if (move.enPassant) {
      removePiece(pieces.find((p) => !p.gone && p.r === move.fr && p.c === move.tc));
    } else {
      removePiece(pieces.find((p) => !p.gone && p.r === move.tr && p.c === move.tc && p !== mover));
    }
    mover.r = move.tr;
    mover.c = move.tc;
    if (move.promotion) {
      mover.t = move.promotion;
      mover.el.innerHTML = Pieces.pieceSVG(mover.t, mover.color, mover.color === "w" ? "right" : "left");
    }
    if (move.castle) {
      const fromC = move.castle === "K" ? 7 : 0;
      const toC = move.castle === "K" ? 5 : 3;
      const rook = pieces.find((p) => !p.gone && p.r === move.fr && p.c === fromC);
      if (rook) rook.c = toC;
    }
    placePieces(true);
  }

  function hangs(board, color) {
    const enemy = Chess.opp(color);
    const out = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p || p.c !== color || p.t === "k") continue;
        if (Chess.attacked(board, r, c, enemy) && !Chess.attacked(board, r, c, color)) {
          out.push(p.t + FILES[c] + (8 - r));
        }
      }
    }
    return out;
  }

  function freshHangs(prev, move) {
    const next = Chess.apply(prev, move);
    const before = new Set(hangs(prev.board, prev.turn));
    return hangs(next.board, prev.turn).filter((h) => !before.has(h) && VAL[h[0]] >= 3);
  }

  function shouldWarn(prev, move) {
    if (!coachOn || view === "learn") return null;
    const fresh = freshHangs(prev, move);
    if (!fresh.length) return null;
    const all = Chess.legalMoves(prev);
    const forced = all.every((m) => freshHangs(prev, m).length);
    if (forced) return null;
    return fresh;
  }

  function statusOf(st, keyList) {
    return Chess.status(st, keyList);
  }

  function statusTitle(st) {
    if (!st) return "";
    if (st.over) {
      if (st.reason === "checkmate") return "Checkmate";
      if (st.reason === "stalemate") return "Stalemate";
      if (st.reason === "resign") return "Resigned";
      if (st.reason === "fifty") return "Fifty-move draw";
      if (st.reason === "repetition") return "Threefold repetition";
      if (st.reason === "insufficient") return "Insufficient material";
      return "Game over";
    }
    if (Chess.inCheck(st)) return "Check";
    if (view !== "learn" && mode === "ai" && st.turn === human) return "Your move";
    return (st.turn === "w" ? "White" : "Black") + " to move";
  }

  function resultLine(st) {
    if (!st || !st.over) return "";
    if (st.reason === "checkmate" || st.reason === "resign") {
      const winner = st.winner;
      if (st.reason === "resign") return sideName(winner) + " wins by resignation.";
      return sideName(winner) + " wins.";
    }
    if (st.reason === "stalemate") return "Stalemate. The side to move is not in check, and has no legal move.";
    if (st.reason === "fifty") return "Fifty moves without a pawn move or a capture. Drawn.";
    if (st.reason === "repetition") return "The same position has appeared three times. Drawn.";
    if (st.reason === "insufficient") return "Not enough material to force mate. Drawn.";
    return "Draw.";
  }

  function finish(next, prevTurn, keyList) {
    const st = statusOf(next, keyList);
    next.over = st.over;
    next.reason = st.reason;
    next.check = st.check;
    next.winner = st.checkmate ? prevTurn : null;
    return st;
  }

  function goalMet(les, move, prev) {
    const g = les.goal;
    const u = uci(move);
    if (g.kind === "uci") return u === g.uci || (g.alts || []).indexOf(u) !== -1;
    if (g.kind === "promo") return u === g.uci + "q";
    if (g.kind === "king") return prev.board[move.fr][move.fc] && prev.board[move.fr][move.fc].t === "k";
    if (g.kind === "escape") {
      const p = prev.board[move.fr][move.fc];
      return p && p.t === "k" && move.tr === 6;
    }
    if (g.kind === "castle") return !!move.castle;
    if (g.kind === "mate") {
      const next = Chess.apply(prev, move);
      const st = Chess.status(next);
      return st.checkmate;
    }
    return false;
  }

  function apply(move) {
    const prev = state;
    const next = Chess.apply(prev, move);
    const san = Chess.toSAN(prev, move, Chess.legalMoves(prev));
    const key = Chess.positionKey(next);
    const nextKeys = keys.concat([key]);
    const st = finish(next, prev.turn, nextKeys);
    history.push({ move, san, state: next });
    keys = nextKeys;
    book.push(uci(move));
    state = next;
    cursor = null;
    selected = null;
    legal = [];
    arrow = null;
    promo = null;
    endDismissed = false;
    animateMove(move);
    if (st.checkmate || st.over) sound("end");
    else if (st.check) sound("check");
    else if (prev.board[move.tr][move.tc] || move.enPassant) sound("cap");
    else sound("move");

    const les = lesson();
    if (les) {
      lessonLock = true;
      done[les.id] = true;
      learnSig = "";
      coachTitle = "That's the idea";
      coachText = les.success;
      save();
      speak(coachText);
      render();
      return;
    }
    coachTitle = busy ? "Computer is thinking" : statusTitle(next);
    if (coachOn) {
      let line = Study.explainMove(prev, move, san);
      const extra = coachNote(next, st);
      if (extra) line += " " + extra;
      coachText = line;
    } else coachText = resultLine(next) || statusTitle(next);
    rateIfOver();
    save();
    render();
    maybeHouse();
  }

  function coachNote(next, st) {
    if (st.checkmate) return "That is checkmate.";
    if (st.stalemate) return "Stalemate. No legal move, and the king is not in check.";
    if (st.reason === "fifty") return "Fifty moves without a pawn move or a capture.";
    if (st.reason === "repetition") return "This position has appeared three times.";
    if (st.reason === "insufficient") return "Neither side can force mate from here.";
    if (st.check) return "The king is in check and must be seen to.";
    const loose = hangs(next.board, next.turn).filter((h) => VAL[h[0]] >= 3);
    if (loose.length) return "The " + NAMES[loose[0][0]] + " on " + loose[0].slice(1) + " is loose.";
    return "";
  }

  function commit(move) {
    const les = lesson();
    if (les && les.goal && !goalMet(les, move, state)) {
      promo = null;
      selected = null;
      legal = [];
      placePieces(true);
      coachTitle = "Not that one";
      coachText = les.hint;
      sound("no");
      render();
      return;
    }
    const warn = shouldWarn(state, move);
    if (warn) {
      const names = warn.map((h) => NAMES[h[0]] + " on " + h.slice(1));
      ask = {
        body: "That leaves the " + names.join(" and the ") + " hanging. Play it anyway?",
        yes: "Play it",
        no: "Take back",
        onYes: function () {
          ask = null;
          remember(state, names);
          apply(move);
        },
      };
      placePieces(true);
      render();
      return;
    }
    apply(move);
  }

  function tryMove(fr, fc, tr, tc) {
    if (!canMove(state.turn) && !(view === "learn" && !lessonLock && !busy && cursor == null && !state.over)) return false;
    if (view !== "learn" && !canMove(state.board[fr][fc] ? state.board[fr][fc].c : state.turn)) return false;
    const moves = Chess.legalMoves(state).filter((m) => m.fr === fr && m.fc === fc && m.tr === tr && m.tc === tc);
    if (!moves.length) return false;
    if (moves.some((m) => m.promotion)) {
      promo = moves;
      selected = null;
      legal = [];
      render();
      return true;
    }
    commit(moves[0]);
    return true;
  }

  function engineLevel() {
    let key = level;
    if (key === "match") {
      if (rating < 950) key = "learner";
      else if (rating < 1200) key = "gentle";
      else if (rating < 1500) key = "club";
      else if (rating < 1800) key = "sharp";
      else key = "master";
    }
    if (key === "learner") return "learner";
    let mapped = LEVELS[key] || "club";
    if (mapped === "match") mapped = "club";
    if (window.innerWidth < 720 && (mapped === "master" || mapped === "expert")) return "expert";
    return mapped;
  }

  function benchRating() {
    const e = engineLevel();
    return { learner: 750, casual: 1050, club: 1400, expert: 1700, master: 2000 }[e] || 1200;
  }

  function strengthLabel() {
    if (level === "match") return "Match " + rating;
    return LEVEL_NAME[level] || "Club";
  }

  function rateIfOver() {
    if (rated || lessonId || noteMode || mode !== "ai" || level !== "match" || !state || !state.over) return;
    rated = true;
    const score = !state.winner ? 0.5 : state.winner === human ? 1 : 0;
    const exp = 1 / (1 + Math.pow(10, (seat - rating) / 400));
    rating = Math.max(400, Math.min(2400, Math.round(rating + 22 * (score - exp))));
  }

  function remember(prev, names) {
    notes.unshift({
      fen: Chess.toFEN(prev),
      text: "You left the " + names.join(" and the ") + " hanging.",
    });
    if (notes.length > 8) notes.length = 8;
    learnSig = "";
  }

  function bookReply(seq) {
    const opts = BOOK[seq.join(",")];
    if (!opts) return null;
    return opts[Math.floor(Math.random() * opts.length)];
  }

  function pickAi(st) {
    const moves = Chess.legalMoves(st);
    if (!moves.length) return null;
    const eng = engineLevel();
    if (eng !== "learner" && book.length < 10) {
      const u = bookReply(book);
      if (u) {
        const m = moves.find((x) => uci(x) === u);
        if (m) return m;
      }
    }
    return Chess.chooseMove(st, eng);
  }

  function maybeHouse() {
    if (lessonId || view === "learn" || mode !== "ai" || !state || state.over || state.turn === human) return;
    const my = ++token;
    busy = true;
    coachTitle = "Computer is thinking";
    render();
    setTimeout(function () {
      if (my !== token) return;
      let mv = null;
      try {
        mv = pickAi(state);
      } catch (e) {
        mv = null;
      }
      busy = false;
      if (my !== token) return;
      if (mv) apply(mv);
      else render();
    }, 280);
  }

  function resetPosition(st, keepView) {
    token++;
    busy = false;
    state = st;
    root = Chess.clone(st);
    history = [];
    keys = [Chess.positionKey(st)];
    book = [];
    cursor = null;
    selected = null;
    legal = [];
    promo = null;
    ask = null;
    arrow = null;
    endDismissed = false;
    lessonLock = false;
    rated = false;
    seat = benchRating();
    rebuildPieces(drill && drill.blank ? emptyBoard() : st.board);
    if (!keepView) view = "play";
  }

  function startGame(opts) {
    opts = opts || {};
    playSnap = null;
    lessonId = null;
    drill = null;
    if (opts.mode) mode = opts.mode;
    if (opts.human) human = opts.human;
    if (opts.level) level = opts.level;
    if (mode === "two") human = "w";
    flipped = mode === "ai" && human === "b";
    resetPosition(Chess.initial(), false);
    view = "play";
    coachTitle = "White to move";
    coachText = coachOn
      ? "Pick up a piece. Legal squares are marked. Match follows how you play. Easy, Club, and Master stay fixed."
      : "White to move.";
    save();
    render();
    maybeHouse();
  }

  function replay(ucis) {
    let st = Chess.initial();
    const hist = [];
    const ks = [Chess.positionKey(st)];
    const b = [];
    for (let i = 0; i < ucis.length; i++) {
      const m = Chess.legalMoves(st).find((x) => uci(x) === ucis[i]);
      if (!m) break;
      const next = Chess.apply(st, m);
      const san = Chess.toSAN(st, m, Chess.legalMoves(st));
      const key = Chess.positionKey(next);
      ks.push(key);
      finish(next, st.turn, ks);
      hist.push({ move: m, san, state: next });
      b.push(ucis[i]);
      st = next;
      if (next.over) break;
    }
    state = st;
    root = Chess.initial();
    history = hist;
    keys = ks;
    book = b;
    cursor = null;
    rebuildPieces(st.board);
  }

  function undo() {
    if (busy || lessonId || !history.length) return;
    let n = 1;
    if (mode === "ai" && state.turn === human && history.length >= 2) n = 2;
    if (mode === "ai" && state.turn !== human) n = 1;
    token++;
    busy = false;
    history.splice(history.length - n, n);
    book.splice(book.length - n, n);
    keys = [Chess.positionKey(root)];
    history.forEach((h) => keys.push(Chess.positionKey(h.state)));
    state = history.length ? history[history.length - 1].state : Chess.clone(root);
    cursor = null;
    selected = null;
    legal = [];
    arrow = null;
    endDismissed = false;
    rebuildPieces(state.board);
    coachTitle = "Taken back";
    coachText = history.length ? "The position is restored. Your move." : "Back at the start.";
    save();
    render();
  }

  function resign() {
    if (!state || state.over || lessonId || busy) return;
    state = Object.assign({}, state, { over: true, reason: "resign", winner: Chess.opp(state.turn) });
    endDismissed = false;
    coachTitle = "Resigned";
    coachText = sideName(state.winner) + " wins by resignation.";
    sound("end");
    rateIfOver();
    save();
    render();
  }

  function setCursor(n) {
    if (lessonId) return;
    if (n < 0) n = 0;
    if (n >= history.length) {
      cursor = null;
      coachTitle = statusTitle(state);
      coachText = history.length ? "Back at the live position." : coachText;
    } else {
      cursor = n;
      if (n === 0) {
        coachTitle = "Starting position";
        coachText = "The pieces are in their starting squares.";
      } else {
        const prev = n === 1 ? root : history[n - 2].state;
        const rec = history[n - 1];
        coachTitle = "Move " + Math.ceil(n / 2) + (n % 2 ? "" : "…");
        coachText = coachOn ? Study.explainMove(prev, rec.move, rec.san) : rec.san;
      }
    }
    selected = null;
    legal = [];
    arrow = null;
    rebuildPieces(shown().board);
    render();
  }

  function showArrow(m) {
    arrow = m;
    paintArrow();
  }

  function hint() {
    const les = lesson();
    if (les) {
      coachTitle = "Hint";
      coachText = les.hint;
      if (les.kind === "squares" && drill) {
        flash(drill.targets[drill.i], "good");
        render();
        return;
      }
      const g = les.goal || {};
      let m = null;
      const moves = Chess.legalMoves(state);
      if (g.kind === "uci" || g.kind === "promo") {
        const want = g.kind === "promo" ? g.uci + "q" : g.uci;
        m = moves.find((x) => uci(x) === want || (g.alts || []).indexOf(uci(x)) !== -1);
      } else if (g.kind === "king" || g.kind === "escape") {
        m = moves.find((x) => state.board[x.fr][x.fc].t === "k" && (g.kind !== "escape" || x.tr === 6));
      } else if (g.kind === "castle") m = moves.find((x) => x.castle);
      else if (g.kind === "mate") {
        m = moves.find((x) => Chess.status(Chess.apply(state, x)).checkmate);
      }
      if (m) showArrow(m);
      render();
      return;
    }
    if (cursor != null || !state || state.over || busy) return;
    if (mode === "ai" && state.turn !== human) return;
    const hintLevel = engineLevel() === "learner" ? "casual" : engineLevel();
    const m = Chess.chooseMove(state, hintLevel);
    if (!m) return;
    showArrow(m);
    coachTitle = "A suggestion";
    const p = state.board[m.fr][m.fc];
    coachText = "This is a reasonable move, not the only one. " + Study.pieceBlurb(p.t);
    render();
  }

  function snapshotPlay() {
    if (playSnap) return;
    playSnap = {
      state,
      root,
      history,
      keys: keys.slice(),
      book: book.slice(),
      flipped,
      mode,
      human,
      level,
      coachTitle,
      coachText,
    };
  }

  function restorePlay() {
    if (!playSnap) return;
    const s = playSnap;
    playSnap = null;
    state = s.state;
    root = s.root;
    history = s.history;
    keys = s.keys;
    book = s.book;
    flipped = s.flipped;
    mode = s.mode;
    human = s.human;
    level = s.level;
    cursor = null;
    selected = null;
    legal = [];
    lessonId = null;
    lessonLock = false;
    drill = null;
    noteMode = false;
    arrow = null;
    busy = false;
    token++;
    rebuildPieces(state.board);
    coachTitle = s.coachTitle || statusTitle(state);
    coachText = s.coachText || "";
  }

  function openNote(i) {
    const n = notes[Number(i)];
    if (!n || !n.fen) return;
    snapshotPlay();
    noteMode = true;
    token++;
    busy = false;
    view = "learn";
    lessonId = null;
    lessonLock = false;
    drill = null;
    promo = null;
    ask = null;
    arrow = null;
    selected = null;
    cursor = null;
    endDismissed = true;
    try {
      state = Chess.fromFEN(n.fen);
    } catch (err) {
      noteMode = false;
      restorePlay();
      view = "play";
      render();
      return;
    }
    root = Chess.clone(state);
    history = [];
    keys = [Chess.positionKey(state)];
    book = [];
    flipped = state.turn === "b";
    rebuildPieces(state.board);
    coachTitle = "From your games";
    coachText = n.text + " This is the position before that move. Look for a move that keeps the piece.";
    speak(coachText);
    render();
  }

  function openLesson(id) {
    const les = Study.LESSONS.find((l) => l.id === id);
    if (!les) return;
    noteMode = false;
    snapshotPlay();
    token++;
    busy = false;
    view = "learn";
    lessonId = id;
    lessonLock = !!done[id] && false;
    lessonLock = false;
    drill = null;
    promo = null;
    ask = null;
    arrow = null;
    selected = null;
    cursor = null;
    endDismissed = true;
    if (les.kind === "squares") {
      drill = { targets: DRILL.slice(), i: 0, blank: true };
      state = Chess.fromFEN("8/8/8/8/8/8/8/8 w - - 0 1");
      root = state;
      history = [];
      keys = [];
      book = [];
      flipped = false;
      rebuildPieces(emptyBoard());
      coachTitle = "Find " + drill.targets[0];
      coachText = les.text;
      speak(coachText);
    } else {
      state = Chess.fromFEN(les.fen);
      root = Chess.clone(state);
      history = [];
      keys = [Chess.positionKey(state)];
      book = [];
      flipped = state.turn === "b";
      rebuildPieces(state.board);
      coachTitle = les.title;
      coachText = les.text;
      speak(coachText);
    }
    render();
  }

  function nextLesson() {
    const i = Study.LESSONS.findIndex((l) => l.id === lessonId);
    for (let k = 1; k <= Study.LESSONS.length; k++) {
      const les = Study.LESSONS[(i + k) % Study.LESSONS.length];
      if (!done[les.id] || k === Study.LESSONS.length) {
        openLesson(les.id);
        return;
      }
    }
  }

  function resetLesson() {
    if (lessonId) openLesson(lessonId);
  }

  function onDrill(name) {
    if (!drill || lessonLock) return;
    const want = drill.targets[drill.i];
    if (name === want) {
      flash(name, "good");
      sound("ok");
      drill.i++;
      if (drill.i >= drill.targets.length) {
        lessonLock = true;
        done.squares = true;
        learnSig = "";
        coachTitle = "That's the map";
        coachText = lesson().success;
        save();
      } else {
        coachTitle = "Find " + drill.targets[drill.i];
        coachText = "Good. Next is " + drill.targets[drill.i] + ".";
      }
    } else {
      flash(name, "bad");
      sound("no");
      coachTitle = "Not " + name;
      coachText = "Look again for " + want + ". " + lesson().hint;
    }
    render();
  }

  function flash(name, kind) {
    const c = FILES.indexOf(name[0]);
    const r = 8 - Number(name[1]);
    if (c < 0 || r < 0 || r > 7) return;
    const vr = flipped ? 7 - r : r;
    const vc = flipped ? 7 - c : c;
    const el = els.squares.children[vr * 8 + vc];
    if (!el) return;
    el.classList.add(kind === "good" ? "flash-good" : "flash-bad");
    setTimeout(() => el.classList.remove("flash-good", "flash-bad"), 500);
  }

  function setView(v) {
    if (v === "learn") {
      if (noteMode) {
        noteMode = false;
        restorePlay();
      }
      if (lessonId) {
        restorePlay();
        lessonId = null;
        drill = null;
        lessonLock = false;
      }
      if (!playSnap) snapshotPlay();
      view = "learn";
      if (!lessonId) {
        coachTitle = "Lessons";
        coachText = progressText() + ". Open a lesson, then make the move it asks for. Hints are there if you want them.";
      }
    } else {
      noteMode = false;
      if (playSnap) restorePlay();
      view = v;
      if (v === "score") {
        coachTitle = coachTitle || statusTitle(state);
      }
    }
    save();
    render();
    if (v === "play") maybeHouse();
  }

  function progressText() {
    const n = Study.LESSONS.filter((l) => done[l.id]).length;
    return n + " of " + Study.LESSONS.length + " complete";
  }

  function hit(e) {
    const rect = els.board.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || y < 0 || x >= 1 || y >= 1) return null;
    let c = Math.min(7, Math.floor(x * 8));
    let r = Math.min(7, Math.floor(y * 8));
    if (flipped) {
      r = 7 - r;
      c = 7 - c;
    }
    return { r, c, name: FILES[c] + (8 - r) };
  }

  function select(r, c) {
    selected = { r, c };
    legal = Chess.legalMoves(state).filter((m) => m.fr === r && m.fc === c);
    arrow = null;
    if (!legal.length) {
      coachTitle = "No move";
      coachText = "That piece has no legal move. It may be pinned, or blocked.";
    }
    render();
  }

  function clearDrag() {
    if (!drag) return;
    if (drag.el) drag.el.classList.remove("dragging");
    drag = null;
  }

  function onDown(e) {
    if (e.button && e.button !== 0) return;
    if (promo || ask) return;
    try {
      els.board.setPointerCapture(e.pointerId);
    } catch (err) {
      /* already released */
    }
    const sq = hit(e);
    if (!sq || drill || cursor != null || busy || lessonLock || state.over) return;
    const p = state.board[sq.r][sq.c];
    if (!p || !canMove(p.c)) return;
    const obj = pieces.find((x) => !x.gone && x.r === sq.r && x.c === sq.c);
    drag = { r: sq.r, c: sq.c, x: e.clientX, y: e.clientY, moved: false, el: obj && obj.el, pid: e.pointerId };
    selected = { r: sq.r, c: sq.c };
    legal = Chess.legalMoves(state).filter((m) => m.fr === sq.r && m.fc === sq.c);
    arrow = null;
    if (drag.el) drag.el.classList.add("dragging");
    paintSquares();
  }

  function onMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) drag.moved = true;
    if (drag.moved && drag.el) {
      const rect = els.board.getBoundingClientRect();
      const size = rect.width / 8;
      drag.el.style.width = size + "px";
      drag.el.style.height = size + "px";
      drag.el.style.left = e.clientX - rect.left - size / 2 + "px";
      drag.el.style.top = e.clientY - rect.top - size / 2 + "px";
    }
  }

  function onUp(e) {
    const sq = hit(e);
    if (drill && !promo && !ask && cursor == null) {
      if (sq && !lessonLock) onDrill(sq.name);
      return;
    }
    const from = drag ? { r: drag.r, c: drag.c } : selected;
    const moved = !!(drag && drag.moved);
    clearDrag();
    if (promo || ask || busy || lessonLock || cursor != null || state.over) {
      placePieces(true);
      return;
    }
    if (!sq) {
      selected = null;
      legal = [];
      placePieces(true);
      render();
      return;
    }
    if (from && (moved || sq.r !== from.r || sq.c !== from.c)) {
      const ok = tryMove(from.r, from.c, sq.r, sq.c);
      if (!ok) {
        const p = state.board[sq.r][sq.c];
        placePieces(true);
        if (!moved && p && canMove(p.c)) select(sq.r, sq.c);
        else {
          selected = null;
          legal = [];
          if (moved) {
            const piece = state.board[from.r][from.c];
            if (piece && !Chess.legalMoves(state).some((m) => m.fr === from.r && m.fc === from.c)) {
              coachTitle = "No move";
              coachText = "That piece has no legal move. It may be pinned, or blocked.";
            }
          }
          render();
        }
      }
      return;
    }
    const p = state.board[sq.r][sq.c];
    if (p && canMove(p.c)) select(sq.r, sq.c);
    else {
      selected = null;
      legal = [];
      render();
    }
  }

  function paintSquares() {
    const pos = shown();
    const last = currentMove();
    const turn = pos.turn;
    const checking = !drill && Chess.inCheck(pos);
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const br = flipped ? 7 - r : r;
        const bc = flipped ? 7 - c : c;
        const el = els.squares.children[r * 8 + c];
        el.className = "sq " + ((br + bc) % 2 === 0 ? "light" : "dark");
        if (last && last.fr === br && last.fc === bc) el.classList.add("last");
        if (last && last.tr === br && last.tc === bc) el.classList.add("last");
        if (selected && selected.r === br && selected.c === bc) el.classList.add("sel");
        const occ = pos.board[br][bc];
        if (checking && occ && occ.t === "k" && occ.c === turn) el.classList.add("check");
        const hits = legal.filter((m) => m.tr === br && m.tc === bc);
        if (hits.length) el.classList.add(occ || hits.some((m) => m.enPassant) ? "cap" : "dot");
      }
    }
    const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
    const files = flipped ? FILES.split("").reverse() : FILES.split("");
    els.ranks.textContent = "";
    ranks.forEach((n) => {
      const s = document.createElement("span");
      s.textContent = n;
      els.ranks.appendChild(s);
    });
    els.files.textContent = "";
    files.forEach((f) => {
      const s = document.createElement("span");
      s.textContent = f;
      els.files.appendChild(s);
    });
    els.ribbon.hidden = cursor == null;
  }

  function paintArrow() {
    if (!arrow) {
      els.arrow.innerHTML = "";
      return;
    }
    const m = arrow;
    const x1 = (flipped ? 7 - m.fc : m.fc) + 0.5;
    const y1 = (flipped ? 7 - m.fr : m.fr) + 0.5;
    const x2 = (flipped ? 7 - m.tc : m.tc) + 0.5;
    const y2 = (flipped ? 7 - m.tr : m.tr) + 0.5;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const tip = 0.38;
    const bx = x2 - ux * tip;
    const by = y2 - uy * tip;
    const ox = x1 + ux * 0.22;
    const oy = y1 + uy * 0.22;
    els.arrow.innerHTML =
      '<line x1="' + ox + '" y1="' + oy + '" x2="' + bx + '" y2="' + by +
      '" stroke="rgba(0,0,0,.45)" stroke-width="0.2" stroke-linecap="round"/>' +
      '<line x1="' + ox + '" y1="' + oy + '" x2="' + bx + '" y2="' + by +
      '" stroke="currentColor" stroke-width="0.11" stroke-linecap="round"/>' +
      '<polygon points="' + x2 + "," + y2 + " " + (bx + px * 0.22) + "," + (by + py * 0.22) + " " +
      (bx - px * 0.22) + "," + (by - py * 0.22) + '" fill="rgba(0,0,0,.45)"/>' +
      '<polygon points="' + (x2 - ux * 0.04) + "," + (y2 - uy * 0.04) + " " + (bx + px * 0.16) + "," + (by + py * 0.16) + " " +
      (bx - px * 0.16) + "," + (by - py * 0.16) + '" fill="currentColor"/>' +
      '<circle cx="' + x1 + '" cy="' + y1 + '" r="0.13" fill="currentColor" stroke="rgba(0,0,0,.4)" stroke-width="0.04"/>';
  }

  function taken(color, upto) {
    const list = [];
    for (let i = 0; i < upto; i++) {
      const rec = history[i];
      const prev = i === 0 ? root : history[i - 1].state;
      const mover = prev.board[rec.move.fr][rec.move.fc];
      if (!mover || mover.c !== color) continue;
      if (prev.board[rec.move.tr][rec.move.tc]) list.push(prev.board[rec.move.tr][rec.move.tc].t);
      else if (rec.move.enPassant) list.push("p");
    }
    const order = { q: 0, r: 1, b: 2, n: 3, p: 4 };
    list.sort((a, b) => order[a] - order[b]);
    return list;
  }

  function material(board, color) {
    let n = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.c === color) n += VAL[p.t] || 0;
      }
    }
    return n;
  }

  function paintSeat(el, color) {
    const pos = shown();
    const upto = cursor == null ? history.length : cursor;
    const who = sideName(color);
    const side = color === "w" ? "White" : "Black";
    const label = view === "learn" ? side : who === side ? side : who + " · " + side;
    const caps = drill ? [] : taken(color, upto);
    const mine = material(pos.board, color);
    const opp = material(pos.board, Chess.opp(color));
    const delta = lessonId ? 0 : mine - opp;
    el.classList.toggle("turn", !pos.over && !drill && pos.turn === color && cursor == null);
    el.classList.toggle("thinking", busy && mode === "ai" && color !== human && view !== "learn");
    const figs = caps.map((t) => Pieces.pieceSVG(t, Chess.opp(color), "right")).join("");
    el.innerHTML =
      '<span class="who"><i class="pip" data-side="' + color + '"></i><b>' + label + "</b></span>" +
      '<span class="mat"><span class="taken">' + figs + "</span>" +
      (delta > 0 && !drill ? '<span class="delta">+' + delta + "</span>" : "") +
      "</span>";
  }

  function paintReadout() {
    els.title.textContent = coachTitle;
    els.body.textContent = coachText;
    els.readout.classList.toggle("rich", (view === "learn" && (!!lessonId || noteMode)));
  }

  function pgn() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
    const white = mode === "two" ? "White" : human === "w" ? "You" : "Computer";
    const black = mode === "two" ? "Black" : human === "b" ? "You" : "Computer";
    let res = "*";
    if (state && state.over) {
      if (!state.winner) res = "1/2-1/2";
      else res = state.winner === "w" ? "1-0" : "0-1";
    }
    let body = "";
    for (let i = 0; i < history.length; i++) {
      if (i % 2 === 0) body += i / 2 + 1 + ". ";
      body += history[i].san + " ";
    }
    body += res;
    return (
      '[Event "Meridian"]\n[Site "GitHub Pages"]\n[Date "' + date + '"]\n[White "' + white +
      '"]\n[Black "' + black + '"]\n[Result "' + res + '"]\n\n' + body.trim() + "\n"
    );
  }

  function paintSheet() {
    const op = lessonId ? "" : Study.openingName(book);
    els.folioTitle.textContent = noteMode ? "Note" : lessonId ? "Lesson" : "Score";
    els.folioSub.textContent = noteMode
      ? "From your games"
      : lessonId
      ? lesson().chapter
      : op || (mode === "two" ? "Two seats · pass the device" : "You vs Computer · " + strengthLabel());
    if (els.chip) {
      els.chip.textContent = lessonId || noteMode ? "Study" : state && state.over ? (state.winner ? (state.winner === "w" ? "1-0" : "0-1") : "1/2") : strengthLabel();
    }
    if (!history.length) {
      els.sheet.innerHTML = '<div class="empty"><strong>No moves yet</strong><p>The score fills as you play. Click a move later to step through the game.</p></div>';
      return;
    }
    const top = els.sheet.scrollTop;
    let html = '<table><thead><tr><th></th><th>White</th><th>Black</th></tr></thead><tbody>';
    for (let i = 0; i < history.length; i += 2) {
      const on = cursor == null ? history.length - 1 : cursor - 1;
      const w = history[i];
      const b = history[i + 1];
      html +=
        "<tr><td>" + (i / 2 + 1) + "</td><td>" + moveBtn(i, w, on) + "</td><td>" +
        (b ? moveBtn(i + 1, b, on) : "") + "</td></tr>";
    }
    if (state && state.over && !lessonId) html += '<tr><td></td><td colspan="2">' + resultLine(state) + "</td></tr>";
    html += "</tbody></table>";
    els.sheet.innerHTML = html;
    if (cursor == null) els.sheet.scrollTop = els.sheet.scrollHeight;
    else els.sheet.scrollTop = top;
  }

  function moveBtn(i, rec, on) {
    return (
      '<button type="button" class="move' + (on === i ? " on" : "") + '" data-ply="' + (i + 1) + '">' +
      rec.san + "</button>"
    );
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  }

  function paintLearn() {
    const sig =
      Study.LESSONS.map((l) => l.id + (done[l.id] ? "1" : "0")).join(",") +
      "|" + (lessonId || "") +
      "|" + notes.map((n) => n.fen).join(";");
    if (sig === learnSig && els.learn.childElementCount) return;
    learnSig = sig;
    const doneN = Study.LESSONS.filter((l) => done[l.id]).length;
    const pct = Math.round((100 * doneN) / Study.LESSONS.length);
    const intro =
      '<article class="learn-card"><h2>How to get better</h2><p>' + Study.LESSONS.length +
      ' drills and ' + Study.METHODS.length +
      ' methods. Open a method to read the idea. Open a drill and make the move it asks for.</p><p class="progress">' +
      progressText() + '</p><div class="meter" aria-hidden="true"><span style="width:' + pct + '%"></span></div></article>';
    const chapters = [];
    Study.LESSONS.forEach((l) => {
      let ch = chapters.find((c) => c.name === l.chapter);
      if (!ch) {
        ch = { name: l.chapter, items: [] };
        chapters.push(ch);
      }
      ch.items.push(l);
    });
    const body = chapters
      .map((ch) => {
        const items = ch.items
          .map((l) => {
            return (
              '<button type="button" class="lesson' + (done[l.id] ? " done" : "") + (l.id === lessonId ? " active" : "") +
              '" data-lesson="' + l.id + '"><strong>' + l.title + "</strong><em>" +
              (done[l.id] ? "Done" : l.minutes + " min") + "</em></button>"
            );
          })
          .join("");
        return '<section class="chapter"><h3>' + ch.name + "</h3>" + items + "</section>";
      })
      .join("");
    const methods =
      '<section class="chapter"><h3>Methods</h3>' +
      (Study.METHODS || [])
        .map((m) => '<details class="method"><summary>' + esc(m.title) + "</summary><p>" + esc(m.text) + "</p></details>")
        .join("") +
      "</section>";
    const noteHtml = notes.length
      ? '<section class="chapter"><h3>Your notes</h3>' +
        notes
          .map(
            (n, i) =>
              '<button type="button" class="lesson" data-note="' + i + '"><strong>' + esc(n.text) + '</strong><em>See</em></button>'
          )
          .join("") +
        "</section>"
      : "";
    els.learn.innerHTML = intro + methods + body + noteHtml;
  }

  function btn(act, label, short, on, disabled) {
    return (
      '<button type="button" class="btn' + (on ? " on" : "") + '" data-act="' + act + '"' +
      (disabled ? " disabled" : "") + '><span class="full">' + label + '</span><span class="short">' +
      (short || label) + "</span></button>"
    );
  }

  function paintDock() {
    let html = "";
    if (noteMode) {
      html = '<div class="tray">' + btn("back", "Lessons", "Back") + btn("flip", "Flip", "Flip") + "</div>";
    } else if (view === "learn" && !lessonId && isNarrow()) {
      html = '<span class="progress">' + progressText() + "</span>";
    } else if (lessonId) {
      html =
        '<div class="tray">' +
        btn("back", "Lessons", "Back") +
        btn("reset-lesson", "Reset", "Reset") +
        btn("hint", "Hint", "Hint") +
        btn("next", "Next", "Next", lessonLock, false) +
        btn("flip", "Flip", "Flip") +
        "</div>";
    } else if (cursor != null) {
      html =
        btn("rev-back", "Back", "Back", false, cursor === 0) +
        btn("rev-forward", "Forward", "Forward") +
        btn("live", "Live", "Live", true) +
        btn("flip", "Flip", "Flip");
    } else {
      const over = state && state.over;
      html =
        '<div class="tray">' +
        btn("undo", "Undo", "Undo", false, busy || !history.length) +
        btn("flip", "Flip", "Flip") +
        btn("hint", "Hint", "Hint", false, over || busy) +
        btn("coach", "Coach", "Coach", coachOn) +
        btn("resign", "Resign", "Resign", false, over || busy) +
        btn("new", "New game", "New", true) +
        "</div><div class=\"tray\">" +
        btn("mode-two", "Two seats", "Two", mode === "two") +
        btn("mode-w", "As White", "White", mode === "ai" && human === "w") +
        btn("mode-b", "As Black", "Black", mode === "ai" && human === "b") +
        "</div><div class=\"tray\">" +
        btn("lv-match", "Match", "Match", level === "match") +
        btn("lv-gentle", "Easy", "Easy", level === "gentle") +
        btn("lv-club", "Club", "Club", level === "club") +
        btn("lv-master", "Master", "Master", level === "master") +
        "</div>";
    }
    els.dock.innerHTML = html;
  }

  function paintOverlays() {
    if (promo) {
      const color = state.turn;
      els.promo.hidden = false;
      const promoName = { q: "Queen", r: "Rook", b: "Bishop", n: "Knight" };
      els.promo.innerHTML =
        '<div class="promo-box" role="dialog" aria-label="Choose a piece"><p>Choose a piece</p><div class="choices">' +
        ["q", "r", "b", "n"]
          .map((t) => '<button type="button" data-promo="' + t + '" aria-label="' + promoName[t] + '">' + Pieces.pieceSVG(t, color, "right") + "</button>")
          .join("") +
        "</div></div>";
    } else els.promo.hidden = true;

    if (ask) {
      els.ask.hidden = false;
      els.ask.innerHTML =
        '<div class="ask-box" role="dialog"><p>' + ask.body + '</p><div class="row">' +
        '<button type="button" data-ask="no">' + ask.no + "</button>" +
        '<button type="button" class="btn primary" data-ask="yes">' + ask.yes + "</button></div></div>";
    } else els.ask.hidden = true;

    const showEnd =
      state &&
      state.over &&
      cursor == null &&
      !endDismissed &&
      !drill &&
      !ask &&
      !promo &&
      ((view !== "learn" && !lessonId) || (lessonId && lessonLock));
    if (showEnd) {
      els.end.hidden = false;
      const next = lessonId
        ? '<button type="button" data-act="next">Next lesson</button>'
        : '<button type="button" data-act="new">New game</button><button type="button" data-act="review">Review</button>';
      els.end.innerHTML =
        '<div class="end-box" role="dialog"><p><strong>' + statusTitle(state) + "</strong><br>" +
        (lessonId ? lesson().success : resultLine(state)) + '</p><div class="row">' + next + "</div></div>";
    } else els.end.hidden = true;
  }

  function render() {
    if (busy && !lessonId) coachTitle = coachTitle || "Computer is thinking";
    syncLayout();
    paintSquares();
    paintArrow();
    const pos = shown();
    const top = flipped ? "w" : "b";
    const bot = flipped ? "b" : "w";
    paintSeat(els.seatTop, top);
    paintSeat(els.seatBot, bot);
    paintReadout();
    paintSheet();
    try { paintLearn(); } catch (err) { console.error(err); }
    paintDock();
    paintOverlays();
    const soundBtn = $("#sound");
    if (soundBtn) soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
    const voiceBtn = $("#voice");
    if (voiceBtn) voiceBtn.setAttribute("aria-pressed", voiceOn ? "true" : "false");
    requestAnimationFrame(fitBoard);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => flashCopy("Copied"),
        () => fallbackCopy(text)
      );
    } else fallbackCopy(text);
  }

  function fallbackCopy(text) {
    const t = document.createElement("textarea");
    t.value = text;
    document.body.appendChild(t);
    t.select();
    try {
      document.execCommand("copy");
      flashCopy("Copied");
    } catch (e) {
      flashCopy("Copy failed");
    }
    t.remove();
  }

  function flashCopy(msg) {
    const prev = coachTitle;
    coachTitle = msg;
    paintReadout();
    setTimeout(() => {
      coachTitle = prev;
      paintReadout();
    }, 900);
  }

  function gameLink() {
    const u = new URL(location.href);
    u.hash = book.length ? "g=" + book.join(",") : "";
    return u.toString();
  }

  function requestNew(opts) {
    if (history.length && state && !state.over && !lessonId) {
      ask = {
        body: "Start a new game? This one will be cleared.",
        yes: "New game",
        no: "Keep playing",
        onYes: function () {
          ask = null;
          startGame(opts);
        },
      };
      render();
      return;
    }
    startGame(opts);
  }

  function onAct(act) {
    if (act === "undo") undo();
    else if (act === "flip") {
      flipped = !flipped;
      if (drag) clearDrag();
      placePieces(true);
      save();
      render();
    } else if (act === "hint") hint();
    else if (act === "coach") {
      coachOn = !coachOn;
      save();
      render();
    } else if (act === "resign") resign();
    else if (act === "new") requestNew();
    else if (act === "mode-two") requestNew({ mode: "two", human: "w" });
    else if (act === "mode-w") requestNew({ mode: "ai", human: "w" });
    else if (act === "mode-b") requestNew({ mode: "ai", human: "b" });
    else if (act === "lv-match" || act === "lv-gentle" || act === "lv-club" || act === "lv-master" || act === "lv-sharp") {
      level = act === "lv-sharp" ? "master" : act.slice(3);
      seat = benchRating();
      save();
      render();
    } else if (act === "back") {
      if (noteMode) {
        noteMode = false;
        restorePlay();
        view = "learn";
        coachTitle = "Lessons";
        coachText = progressText() + ". Open a drill, or read a method.";
        render();
        return;
      }
      setView("learn");
    }
    else if (act === "reset-lesson") resetLesson();
    else if (act === "next") nextLesson();
    else if (act === "rev-back") setCursor(cursor == null ? Math.max(0, history.length - 1) : cursor - 1);
    else if (act === "rev-forward") setCursor(cursor == null ? history.length : cursor + 1);
    else if (act === "live") setCursor(history.length);
    else if (act === "review") {
      endDismissed = true;
      view = isNarrow() ? "score" : "play";
      render();
    } else if (act === "sound") {
      soundOn = !soundOn;
      save();
      render();
    } else if (act === "voice") {
      voiceOn = !voiceOn;
      save();
      if (voiceOn) speak(coachText);
      else if (window.speechSynthesis) speechSynthesis.cancel();
      render();
    }
  }

  function hashMoves() {
    const h = location.hash || "";
    if (h.indexOf("g=") === -1) return null;
    const raw = h.split("g=")[1] || "";
    const ucis = decodeURIComponent(raw).split(",").filter((s) => /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(s));
    return ucis.length ? ucis : null;
  }

  function boot() {
    els.stage = $("#stage");
    els.learn = $("#learn");
    els.boardCol = document.querySelector(".board-col");
    els.slot = $("#slot");
    els.stack = $("#stack");
    els.frame = $("#frame");
    els.board = $("#board");
    els.squares = $("#squares");
    els.pieces = $("#pieces");
    els.arrow = $("#arrow");
    els.promo = $("#promo");
    els.ask = $("#ask");
    els.end = $("#end");
    els.ranks = $("#ranks");
    els.files = $("#files");
    els.seatTop = $("#seat-top");
    els.seatBot = $("#seat-bot");
    els.readout = $("#readout");
    els.title = $("#read-title");
    els.body = $("#read-body");
    els.kicker = $("#read-kicker");
    els.folioTitle = $("#folio-title");
    els.folioSub = $("#folio-sub");
    els.chip = $("#folio-chip");
    els.sheet = $("#sheet");
    els.dock = $("#dock");
    els.ribbon = $("#ribbon");

    for (let i = 0; i < 64; i++) {
      const d = document.createElement("div");
      d.className = "sq";
      els.squares.appendChild(d);
    }

    const prefs = loadPrefs() || {};
    soundOn = prefs.sound !== false;
    voiceOn = !!prefs.voice;
    coachOn = prefs.coach !== false;
    mode = prefs.mode === "two" ? "two" : "ai";
    human = prefs.human === "b" ? "b" : "w";
    level = prefs.level === "sharp" || prefs.level === "master" ? "master" : prefs.level === "club" || prefs.level === "match" ? prefs.level : "match";
    rating = typeof prefs.rating === "number" ? prefs.rating : 1000;
    notes = Array.isArray(prefs.notes) ? prefs.notes.filter((n) => n && n.fen && n.text).slice(0, 8) : [];
    flipped = !!prefs.flipped;
    done = prefs.done || {};
    const q = new URLSearchParams(location.search);
    applyTheme(q.get("theme") || prefs.theme || "ink");

    const fromHash = hashMoves();
    resetPosition(Chess.initial(), true);
    view = "play";
    if (fromHash) replay(fromHash);
    else if (prefs.ucis && prefs.ucis.length) replay(prefs.ucis);
    if (mode === "ai" && human === "b" && !history.length) flipped = true;
    if (history.length) {
      const last = history[history.length - 1];
      const prev = history.length > 1 ? history[history.length - 2].state : root;
      coachTitle = statusTitle(state);
      coachText = coachOn ? Study.explainMove(prev, last.move, last.san) : statusTitle(state);
    } else {
      coachTitle = "White to move";
      coachText = coachOn
        ? "Pick up a piece. Legal squares are marked. Match follows how you play. Easy, Club, and Master stay fixed."
        : "White to move.";
    }
    if (q.get("view") === "learn" || q.get("view") === "score") view = q.get("view");
    render();
    if (q.get("lesson")) openLesson(q.get("lesson"));
    else maybeHouse();

    els.board.addEventListener("pointerdown", onDown);
    els.board.addEventListener("pointermove", onMove);
    els.board.addEventListener("pointerup", onUp);
    els.board.addEventListener("pointercancel", function () {
      clearDrag();
      placePieces(true);
    });
    els.board.addEventListener("contextmenu", (e) => e.preventDefault());

    document.addEventListener("click", function (e) {
      const noteBtn = e.target.closest("[data-note]");
      if (noteBtn) {
        openNote(noteBtn.dataset.note);
        return;
      }
      const lessonBtn = e.target.closest("[data-lesson]");
      if (lessonBtn) {
        openLesson(lessonBtn.dataset.lesson);
        return;
      }
      const tab = e.target.closest(".tabs button");
      if (tab) {
        setView(tab.dataset.view);
        return;
      }
      const sw = e.target.closest("[data-theme-pick]");
      if (sw) {
        applyTheme(sw.dataset.themePick);
        save();
        return;
      }
      const promoBtn = e.target.closest("[data-promo]");
      if (promoBtn && promo) {
        const t = promoBtn.dataset.promo;
        const m = promo.find((x) => x.promotion === t);
        promo = null;
        if (m) commit(m);
        else render();
        return;
      }
      const askBtn = e.target.closest("[data-ask]");
      if (askBtn && ask) {
        const yes = askBtn.dataset.ask === "yes";
        const fn = yes ? ask.onYes : null;
        ask = null;
        if (fn) fn();
        else {
          placePieces(true);
          render();
        }
        return;
      }
      const ply = e.target.closest("[data-ply]");
      if (ply) {
        setCursor(Number(ply.dataset.ply));
        return;
      }
      const act = e.target.closest("[data-act]");
      if (act && !act.disabled) onAct(act.dataset.act);
    });

    $("#copy-score").addEventListener("click", () => copyText(pgn()));
    $("#copy-link").addEventListener("click", () => copyText(gameLink()));
    $("#sound").addEventListener("click", () => onAct("sound"));
    $("#voice").addEventListener("click", () => onAct("voice"));

    window.addEventListener("keydown", function (e) {
      const k = e.key;
      if (k === "ArrowLeft") {
        e.preventDefault();
        onAct("rev-back");
      } else if (k === "ArrowRight") {
        e.preventDefault();
        onAct("rev-forward");
      } else if (k === "Escape") {
        selected = null;
        legal = [];
        arrow = null;
        if (ask) ask = null;
        if (promo) promo = null;
        placePieces(true);
        render();
      } else if ((k === "n" || k === "N") && !lessonId) requestNew();
      else if (k === "u" || k === "U") undo();
      else if (k === "f" || k === "F") onAct("flip");
      else if (k === "h" || k === "H") hint();
      else if (k === "m" || k === "M") onAct("sound");
    });

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => fitBoard());
      ro.observe(els.slot);
      ro.observe(document.body);
    }
    window.addEventListener("resize", function () {
      syncLayout();
      fitBoard();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
