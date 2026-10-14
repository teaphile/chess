/* Chess rules engine. No DOM. Works in Node and the browser. */
(function (root) {
  "use strict";

  const KNIGHT = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];
  const KING = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const BISHOP = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  const ROOK = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const QUEEN = BISHOP.concat(ROOK);
  const PROMO = ["q", "r", "b", "n"];
  const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

  /* Piece-square tables, row 0 = 8th rank, from White's point of view. */
  const PST = {
    p: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [50, 50, 50, 50, 50, 50, 50, 50],
      [10, 10, 20, 30, 30, 20, 10, 10],
      [5, 5, 10, 27, 27, 10, 5, 5],
      [0, 0, 0, 25, 25, 0, 0, 0],
      [5, -5, -10, 0, 0, -10, -5, 5],
      [5, 10, 10, -20, -20, 10, 10, 5],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    n: [
      [-50, -40, -30, -30, -30, -30, -40, -50],
      [-40, -20, 0, 5, 5, 0, -20, -40],
      [-30, 5, 10, 15, 15, 10, 5, -30],
      [-30, 0, 15, 20, 20, 15, 0, -30],
      [-30, 5, 15, 20, 20, 15, 5, -30],
      [-30, 0, 10, 15, 15, 10, 0, -30],
      [-40, -20, 0, 0, 0, 0, -20, -40],
      [-50, -40, -30, -30, -30, -30, -40, -50],
    ],
    b: [
      [-20, -10, -10, -10, -10, -10, -10, -20],
      [-10, 5, 0, 0, 0, 0, 5, -10],
      [-10, 10, 10, 10, 10, 10, 10, -10],
      [-10, 0, 10, 10, 10, 10, 0, -10],
      [-10, 5, 5, 10, 10, 5, 5, -10],
      [-10, 0, 5, 10, 10, 5, 0, -10],
      [-10, 0, 0, 0, 0, 0, 0, -10],
      [-20, -10, -10, -10, -10, -10, -10, -20],
    ],
    r: [
      [0, 0, 0, 5, 5, 0, 0, 0],
      [5, 10, 10, 10, 10, 10, 10, 5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [-5, 0, 0, 0, 0, 0, 0, -5],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    q: [
      [-20, -10, -10, -5, -5, -10, -10, -20],
      [-10, 0, 0, 0, 0, 0, 0, -10],
      [-10, 0, 5, 5, 5, 5, 0, -10],
      [-5, 0, 5, 5, 5, 5, 0, -5],
      [0, 0, 5, 5, 5, 5, 0, -5],
      [-10, 5, 5, 5, 5, 5, 0, -10],
      [-10, 0, 5, 0, 0, 0, 0, -10],
      [-20, -10, -10, -5, -5, -10, -10, -20],
    ],
    k: [
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-30, -40, -40, -50, -50, -40, -40, -30],
      [-20, -30, -30, -40, -40, -30, -30, -20],
      [-10, -20, -20, -20, -20, -20, -20, -10],
      [20, 20, 0, 0, 0, 0, 20, 20],
      [20, 30, 10, 0, 0, 10, 30, 20],
    ],
  };

  const PST_END_KING = [
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10, 0, 0, -10, -20, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50],
  ];

  function opp(color) {
    return color === "w" ? "b" : "w";
  }

  function onBoard(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  function clone(state) {
    const board = new Array(8);
    for (let r = 0; r < 8; r++) {
      const row = new Array(8);
      for (let c = 0; c < 8; c++) {
        const p = state.board[r][c];
        row[c] = p ? { t: p.t, c: p.c } : null;
      }
      board[r] = row;
    }
    return {
      board,
      turn: state.turn,
      castling: {
        K: state.castling.K,
        Q: state.castling.Q,
        k: state.castling.k,
        q: state.castling.q,
      },
      ep: state.ep ? { r: state.ep.r, c: state.ep.c } : null,
      halfmove: state.halfmove,
      fullmove: state.fullmove,
    };
  }

  function initial() {
    const back = ["r", "n", "b", "q", "k", "b", "n", "r"];
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let c = 0; c < 8; c++) {
      board[0][c] = { t: back[c], c: "b" };
      board[1][c] = { t: "p", c: "b" };
      board[6][c] = { t: "p", c: "w" };
      board[7][c] = { t: back[c], c: "w" };
    }
    return {
      board,
      turn: "w",
      castling: { K: true, Q: true, k: true, q: true },
      ep: null,
      halfmove: 0,
      fullmove: 1,
    };
  }

  function findKing(board, color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.t === "k" && p.c === color) return { r, c };
      }
    }
    return null;
  }

  function isAttacked(board, r, c, byColor) {
    const pawnRow = byColor === "w" ? r + 1 : r - 1;
    if (onBoard(pawnRow, c - 1)) {
      const p = board[pawnRow][c - 1];
      if (p && p.t === "p" && p.c === byColor) return true;
    }
    if (onBoard(pawnRow, c + 1)) {
      const p = board[pawnRow][c + 1];
      if (p && p.t === "p" && p.c === byColor) return true;
    }
    for (let i = 0; i < KNIGHT.length; i++) {
      const rr = r + KNIGHT[i][0];
      const cc = c + KNIGHT[i][1];
      if (!onBoard(rr, cc)) continue;
      const p = board[rr][cc];
      if (p && p.t === "n" && p.c === byColor) return true;
    }
    for (let i = 0; i < KING.length; i++) {
      const rr = r + KING[i][0];
      const cc = c + KING[i][1];
      if (!onBoard(rr, cc)) continue;
      const p = board[rr][cc];
      if (p && p.t === "k" && p.c === byColor) return true;
    }
    for (let i = 0; i < BISHOP.length; i++) {
      const dr = BISHOP[i][0];
      const dc = BISHOP[i][1];
      let rr = r + dr;
      let cc = c + dc;
      while (onBoard(rr, cc)) {
        const p = board[rr][cc];
        if (p) {
          if (p.c === byColor && (p.t === "b" || p.t === "q")) return true;
          break;
        }
        rr += dr;
        cc += dc;
      }
    }
    for (let i = 0; i < ROOK.length; i++) {
      const dr = ROOK[i][0];
      const dc = ROOK[i][1];
      let rr = r + dr;
      let cc = c + dc;
      while (onBoard(rr, cc)) {
        const p = board[rr][cc];
        if (p) {
          if (p.c === byColor && (p.t === "r" || p.t === "q")) return true;
          break;
        }
        rr += dr;
        cc += dc;
      }
    }
    return false;
  }

  function pushPawn(moves, r, c, nr, nc, promote) {
    if (promote) {
      for (let i = 0; i < PROMO.length; i++) {
        moves.push({ fr: r, fc: c, tr: nr, tc: nc, promotion: PROMO[i] });
      }
    } else {
      moves.push({ fr: r, fc: c, tr: nr, tc: nc });
    }
  }

  function pseudoMoves(state, attacksOnly) {
    const moves = [];
    const board = state.board;
    const turn = state.turn;
    const fwd = turn === "w" ? -1 : 1;
    const startRank = turn === "w" ? 6 : 1;
    const lastRank = turn === "w" ? 0 : 7;
    const enemy = opp(turn);

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p || p.c !== turn) continue;

        if (p.t === "p") {
          const nr = r + fwd;
          if (onBoard(nr, c) && !board[nr][c]) {
            const promote = nr === lastRank;
            if (!attacksOnly || promote) {
              pushPawn(moves, r, c, nr, c, promote);
            }
            if (!attacksOnly && r === startRank) {
              const nr2 = r + fwd * 2;
              if (!board[nr2][c]) {
                moves.push({ fr: r, fc: c, tr: nr2, tc: c, epSetR: nr, epSetC: c });
              }
            }
          }
          for (let dc = -1; dc <= 1; dc += 2) {
            const nc = c + dc;
            if (!onBoard(nr, nc)) continue;
            const target = board[nr][nc];
            if (target && target.c === enemy) {
              pushPawn(moves, r, c, nr, nc, nr === lastRank);
            } else if (
              state.ep &&
              state.ep.r === nr &&
              state.ep.c === nc
            ) {
              const capR = turn === "w" ? nr + 1 : nr - 1;
              const cap = board[capR][nc];
              if (cap && cap.t === "p" && cap.c === enemy) {
                moves.push({ fr: r, fc: c, tr: nr, tc: nc, enPassant: true });
              }
            }
          }
          continue;
        }

        if (p.t === "n" || p.t === "k") {
          const dirs = p.t === "n" ? KNIGHT : KING;
          for (let i = 0; i < dirs.length; i++) {
            const rr = r + dirs[i][0];
            const cc = c + dirs[i][1];
            if (!onBoard(rr, cc)) continue;
            const target = board[rr][cc];
            if (target && target.c === turn) continue;
            if (attacksOnly && !target) continue;
            moves.push({ fr: r, fc: c, tr: rr, tc: cc });
          }
          continue;
        }

        const dirs = p.t === "b" ? BISHOP : p.t === "r" ? ROOK : QUEEN;
        for (let i = 0; i < dirs.length; i++) {
          const dr = dirs[i][0];
          const dc = dirs[i][1];
          let rr = r + dr;
          let cc = c + dc;
          while (onBoard(rr, cc)) {
            const target = board[rr][cc];
            if (!target) {
              if (!attacksOnly) moves.push({ fr: r, fc: c, tr: rr, tc: cc });
            } else {
              if (target.c !== turn) moves.push({ fr: r, fc: c, tr: rr, tc: cc });
              break;
            }
            rr += dr;
            cc += dc;
          }
        }
      }
    }

    if (!attacksOnly) addCastling(state, moves);
    return moves;
  }

  function addCastling(state, moves) {
    const board = state.board;
    const turn = state.turn;
    const rank = turn === "w" ? 7 : 0;
    const king = board[rank][4];
    if (!king || king.t !== "k" || king.c !== turn) return;
    if (isAttacked(board, rank, 4, opp(turn))) return;

    const ks = turn === "w" ? "K" : "k";
    const qs = turn === "w" ? "Q" : "q";
    const rookK = board[rank][7];
    const rookQ = board[rank][0];

    if (
      state.castling[ks] &&
      rookK &&
      rookK.t === "r" &&
      rookK.c === turn &&
      !board[rank][5] &&
      !board[rank][6] &&
      !isAttacked(board, rank, 5, opp(turn)) &&
      !isAttacked(board, rank, 6, opp(turn))
    ) {
      moves.push({ fr: rank, fc: 4, tr: rank, tc: 6, castle: "K" });
    }
    if (
      state.castling[qs] &&
      rookQ &&
      rookQ.t === "r" &&
      rookQ.c === turn &&
      !board[rank][1] &&
      !board[rank][2] &&
      !board[rank][3] &&
      !isAttacked(board, rank, 3, opp(turn)) &&
      !isAttacked(board, rank, 2, opp(turn))
    ) {
      moves.push({ fr: rank, fc: 4, tr: rank, tc: 2, castle: "Q" });
    }
  }

  function apply(state, move) {
    const next = clone(state);
    const board = next.board;
    const piece = board[move.fr][move.fc];
    const captured = board[move.tr][move.tc];
    board[move.fr][move.fc] = null;
    board[move.tr][move.tc] = move.promotion
      ? { t: move.promotion, c: piece.c }
      : { t: piece.t, c: piece.c };

    if (move.enPassant) {
      const capR = piece.c === "w" ? move.tr + 1 : move.tr - 1;
      board[capR][move.tc] = null;
    }
    if (move.castle === "K") {
      board[move.fr][5] = board[move.fr][7];
      board[move.fr][7] = null;
    } else if (move.castle === "Q") {
      board[move.fr][3] = board[move.fr][0];
      board[move.fr][0] = null;
    }

    const cr = next.castling;
    if (piece.t === "k") {
      if (piece.c === "w") {
        cr.K = false;
        cr.Q = false;
      } else {
        cr.k = false;
        cr.q = false;
      }
    }
    if (piece.t === "r") {
      if (move.fr === 7 && move.fc === 7) cr.K = false;
      if (move.fr === 7 && move.fc === 0) cr.Q = false;
      if (move.fr === 0 && move.fc === 7) cr.k = false;
      if (move.fr === 0 && move.fc === 0) cr.q = false;
    }
    if (captured && captured.t === "r") {
      if (move.tr === 7 && move.tc === 7) cr.K = false;
      if (move.tr === 7 && move.tc === 0) cr.Q = false;
      if (move.tr === 0 && move.tc === 7) cr.k = false;
      if (move.tr === 0 && move.tc === 0) cr.q = false;
    }
    if (move.enPassant) {
      /* captured pawn is not a rook */
    }

    next.ep = move.epSetR != null ? { r: move.epSetR, c: move.epSetC } : null;
    const quiet = piece.t !== "p" && !captured && !move.enPassant;
    next.halfmove = quiet ? state.halfmove + 1 : 0;
    if (state.turn === "b") next.fullmove = state.fullmove + 1;
    next.turn = opp(state.turn);
    return next;
  }

  function leavesKingSafe(state, move) {
    const next = apply(state, move);
    const king = findKing(next.board, state.turn);
    if (!king) return false;
    return !isAttacked(next.board, king.r, king.c, next.turn);
  }

  function legalMoves(state) {
    const pseudo = pseudoMoves(state, false);
    const legal = [];
    for (let i = 0; i < pseudo.length; i++) {
      if (leavesKingSafe(state, pseudo[i])) legal.push(pseudo[i]);
    }
    return legal;
  }

  function inCheck(state) {
    const king = findKing(state.board, state.turn);
    if (!king) return true;
    return isAttacked(state.board, king.r, king.c, opp(state.turn));
  }

  function insufficient(board) {
    const minors = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p || p.t === "k") continue;
        if (p.t === "p" || p.t === "r" || p.t === "q") return false;
        minors.push(p.t + ((r + c) & 1));
      }
    }
    if (minors.length === 0) return true;
    if (minors.length === 1) return true;
    if (minors.length === 2 && minors[0][0] === "b" && minors[1][0] === "b" && minors[0][1] === minors[1][1]) {
      return true;
    }
    return false;
  }

  function positionKey(state) {
    let s = "";
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = state.board[r][c];
        s += p ? p.c + p.t : ".";
      }
    }
    s += state.turn;
    s += state.castling.K ? "K" : "";
    s += state.castling.Q ? "Q" : "";
    s += state.castling.k ? "k" : "";
    s += state.castling.q ? "q" : "";
    s += state.ep ? state.ep.r + "x" + state.ep.c : "-";
    return s;
  }

  function status(state, historyKeys) {
    const moves = legalMoves(state);
    const check = inCheck(state);
    if (moves.length === 0) {
      return {
        over: true,
        check,
        checkmate: check,
        stalemate: !check,
        draw: !check,
        reason: check ? "checkmate" : "stalemate",
        moves,
      };
    }
    if (state.halfmove >= 100) {
      return {
        over: true,
        check,
        checkmate: false,
        stalemate: false,
        draw: true,
        reason: "fifty",
        moves,
      };
    }
    if (insufficient(state.board)) {
      return {
        over: true,
        check: false,
        checkmate: false,
        stalemate: false,
        draw: true,
        reason: "insufficient",
        moves,
      };
    }
    if (historyKeys) {
      const key = positionKey(state);
      let n = 0;
      for (let i = 0; i < historyKeys.length; i++) if (historyKeys[i] === key) n++;
      if (n >= 3) {
        return {
          over: true,
          check,
          checkmate: false,
          stalemate: false,
          draw: true,
          reason: "repetition",
          moves,
        };
      }
    }
    return {
      over: false,
      check,
      checkmate: false,
      stalemate: false,
      draw: false,
      reason: null,
      moves,
    };
  }

  function fileOf(c) {
    return "abcdefgh"[c];
  }
  function rankOf(r) {
    return String(8 - r);
  }
  function sqName(r, c) {
    return fileOf(c) + rankOf(r);
  }

  function sameMove(a, b) {
    return (
      a.fr === b.fr &&
      a.fc === b.fc &&
      a.tr === b.tr &&
      a.tc === b.tc &&
      (a.promotion || null) === (b.promotion || null)
    );
  }

  function toSAN(state, move, legal) {
    if (move.castle === "K") {
      const next = apply(state, move);
      return "O-O" + suffix(next);
    }
    if (move.castle === "Q") {
      const next = apply(state, move);
      return "O-O-O" + suffix(next);
    }
    const piece = state.board[move.fr][move.fc];
    const dest = sqName(move.tr, move.tc);
    const capture =
      !!state.board[move.tr][move.tc] || !!move.enPassant;
    let san = "";
    if (piece.t === "p") {
      san = (capture ? fileOf(move.fc) + "x" : "") + dest;
    } else {
      const letter = piece.t.toUpperCase();
      const others = [];
      for (let i = 0; i < legal.length; i++) {
        const m = legal[i];
        if (m.fr === move.fr && m.fc === move.fc) continue;
        if (m.tr !== move.tr || m.tc !== move.tc) continue;
        const op = state.board[m.fr][m.fc];
        if (op && op.t === piece.t && op.c === piece.c) others.push(m);
      }
      let dis = "";
      if (others.length) {
        const sameFile = others.some((m) => m.fc === move.fc);
        const sameRank = others.some((m) => m.fr === move.fr);
        if (!sameFile) dis = fileOf(move.fc);
        else if (!sameRank) dis = rankOf(move.fr);
        else dis = fileOf(move.fc) + rankOf(move.fr);
      }
      san = letter + dis + (capture ? "x" : "") + dest;
    }
    if (move.promotion) san += "=" + move.promotion.toUpperCase();
    const next = apply(state, move);
    san += suffix(next);
    return san;
  }

  function suffix(next) {
    const st = status(next);
    if (st.checkmate) return "#";
    if (st.check) return "+";
    return "";
  }

  function toFEN(state) {
    let fen = "";
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      for (let c = 0; c < 8; c++) {
        const p = state.board[r][c];
        if (!p) empty++;
        else {
          if (empty) {
            fen += empty;
            empty = 0;
          }
          fen += p.c === "w" ? p.t.toUpperCase() : p.t;
        }
      }
      if (empty) fen += empty;
      if (r < 7) fen += "/";
    }
    let cr = "";
    if (state.castling.K) cr += "K";
    if (state.castling.Q) cr += "Q";
    if (state.castling.k) cr += "k";
    if (state.castling.q) cr += "q";
    if (!cr) cr = "-";
    const ep = state.ep ? sqName(state.ep.r, state.ep.c) : "-";
    return fen + " " + state.turn + " " + cr + " " + ep + " " + state.halfmove + " " + state.fullmove;
  }

  function fromFEN(fen) {
    const parts = fen.trim().split(/\s+/);
    const ranks = parts[0].split("/");
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let r = 0; r < 8; r++) {
      let c = 0;
      for (const ch of ranks[r]) {
        if (ch >= "1" && ch <= "8") c += Number(ch);
        else {
          board[r][c] = {
            t: ch.toLowerCase(),
            c: ch === ch.toUpperCase() ? "w" : "b",
          };
          c++;
        }
      }
    }
    const castling = parts[2] || "-";
    let ep = null;
    if (parts[3] && parts[3] !== "-") {
      ep = {
        c: "abcdefgh".indexOf(parts[3][0]),
        r: 8 - Number(parts[3][1]),
      };
    }
    return {
      board,
      turn: parts[1] || "w",
      castling: {
        K: castling.includes("K"),
        Q: castling.includes("Q"),
        k: castling.includes("k"),
        q: castling.includes("q"),
      },
      ep,
      halfmove: Number(parts[4] || 0),
      fullmove: Number(parts[5] || 1),
    };
  }

  function perft(state, depth) {
    if (depth === 0) return 1;
    const moves = legalMoves(state);
    if (depth === 1) return moves.length;
    let n = 0;
    for (let i = 0; i < moves.length; i++) n += perft(apply(state, moves[i]), depth - 1);
    return n;
  }

  function pieceCount(board) {
    let n = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) if (board[r][c]) n++;
    }
    return n;
  }

  function pawnFileCounts(board) {
    const wp = [0, 0, 0, 0, 0, 0, 0, 0];
    const bp = [0, 0, 0, 0, 0, 0, 0, 0];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p || p.t !== "p") continue;
        if (p.c === "w") wp[c]++;
        else bp[c]++;
      }
    }
    return { wp, bp };
  }

  function isPassed(board, r, c, color, files) {
    const enemy = color === "w" ? files.bp : files.wp;
    for (let f = c - 1; f <= c + 1; f++) {
      if (f < 0 || f > 7) continue;
      if (!enemy[f]) continue;
      const dir = color === "w" ? -1 : 1;
      for (let rr = r + dir; rr >= 0 && rr < 8; rr += dir) {
        const p = board[rr][f];
        if (p && p.t === "p" && p.c !== color) return false;
      }
    }
    return true;
  }

  function structure(board, endgame) {
    let s = 0;
    const files = pawnFileCounts(board);
    let wb = 0;
    let bb = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p) continue;
        if (p.t === "b") {
          if (p.c === "w") wb++;
          else bb++;
        } else if (p.t === "r") {
          if (!files.wp[c] && !files.bp[c]) s += p.c === "w" ? 16 : -16;
          else if (p.c === "w" && !files.wp[c]) s += 8;
          else if (p.c === "b" && !files.bp[c]) s -= 8;
        } else if (p.t === "p" && isPassed(board, r, c, p.c, files)) {
          const adv = p.c === "w" ? 7 - r : r;
          s += (p.c === "w" ? 1 : -1) * (12 + adv * 6);
        }
      }
    }
    if (wb >= 2) s += 28;
    if (bb >= 2) s -= 28;
    for (let c = 0; c < 8; c++) {
      if (files.wp[c] > 1) s -= 14 * (files.wp[c] - 1);
      if (files.bp[c] > 1) s += 14 * (files.bp[c] - 1);
      if (files.wp[c] && !files.wp[c - 1] && !files.wp[c + 1]) s -= 12;
      if (files.bp[c] && !files.bp[c - 1] && !files.bp[c + 1]) s += 12;
    }
    if (!endgame) {
      const wk = findKing(board, "w");
      const bk = findKing(board, "b");
      if (wk) s += shield(board, wk, "w") * 8;
      if (bk) s -= shield(board, bk, "b") * 8;
    }
    return s;
  }

  function shield(board, king, color) {
    const dir = color === "w" ? -1 : 1;
    let n = 0;
    for (let dc = -1; dc <= 1; dc++) {
      const c = king.c + dc;
      const r = king.r + dir;
      if (c < 0 || c > 7 || r < 0 || r > 7) continue;
      const p = board[r][c];
      if (p && p.t === "p" && p.c === color) n++;
    }
    return n;
  }

  let table = null;
  let deadline = 0;
  let nodes = 0;

  function tick() {
    if (deadline && (nodes++ & 127) === 0 && Date.now() > deadline) {
      const err = new Error("time");
      err.time = true;
      throw err;
    }
  }

  function evaluate(state) {
    let score = 0;
    let queens = 0;
    let minors = 0;
    const board = state.board;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p) continue;
        if (p.t === "q") queens++;
        else if (p.t !== "k" && p.t !== "p") minors++;
      }
    }
    const endgame = queens === 0 || minors + queens <= 3;
    if (!endgame) {
      const wk = findKing(board, "w");
      const bk = findKing(board, "b");
      if (wk && wk.r === 7 && wk.c === 4 && !state.castling.K && !state.castling.Q) score -= 28;
      if (bk && bk.r === 0 && bk.c === 4 && !state.castling.k && !state.castling.q) score += 28;
    }
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (!p) continue;
        const rr = p.c === "w" ? r : 7 - r;
        const pst = p.t === "k" && endgame ? PST_END_KING[rr][c] : PST[p.t][rr][c];
        score += p.c === "w" ? VAL[p.t] + pst : -(VAL[p.t] + pst);
      }
    }
    score += structure(board, endgame);
    const turn = state.turn;
    const myMoves = pseudoMoves(state, false).length;
    const enemyState = clone(state);
    enemyState.turn = opp(turn);
    enemyState.ep = null;
    const theirMoves = pseudoMoves(enemyState, false).length;
    const mob = (myMoves - theirMoves) * 2;
    score += turn === "w" ? mob : -mob;
    return turn === "w" ? score : -score;
  }

  function moveScore(state, move) {
    let s = 0;
    const victim = state.board[move.tr][move.tc];
    const attacker = state.board[move.fr][move.fc];
    if (victim) s += VAL[victim.t] * 10 - VAL[attacker.t];
    if (move.enPassant) s += VAL.p * 10 - VAL.p;
    if (move.promotion) s += VAL[move.promotion] * 8;
    if (move.castle) s += 40;
    const rr = attacker.c === "w" ? move.tr : 7 - move.tr;
    s += PST[move.promotion || attacker.t][rr][move.tc] || 0;
    return s;
  }

  function quiescence(state, alpha, beta, depth) {
    tick();
    const stand = evaluate(state);
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    if (depth <= 0) return alpha;
    const moves = pseudoMoves(state, true).filter((m) => leavesKingSafe(state, m));
    moves.sort((a, b) => moveScore(state, b) - moveScore(state, a));
    for (let i = 0; i < moves.length; i++) {
      const sc = -quiescence(apply(state, moves[i]), -beta, -alpha, depth - 1);
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  }

  function search(state, depth, alpha, beta, ply) {
    tick();
    if (state.halfmove >= 100) return 0;
    const key = table ? depth + positionKey(state) : "";
    if (table && table.has(key)) return table.get(key);
    const moves = legalMoves(state);
    if (moves.length === 0) {
      if (inCheck(state)) return -29000 + ply;
      return 0;
    }
    if (insufficient(state.board)) return 0;
    if (depth <= 0) return quiescence(state, alpha, beta, 2);
    moves.sort((a, b) => moveScore(state, b) - moveScore(state, a));
    let best = -Infinity;
    let cut = false;
    for (let i = 0; i < moves.length; i++) {
      const sc = -search(apply(state, moves[i]), depth - 1, -beta, -alpha, ply + 1);
      if (sc > best) best = sc;
      if (sc > alpha) alpha = sc;
      if (alpha >= beta) {
        cut = true;
        break;
      }
    }
    if (table && !cut) table.set(key, best);
    return best;
  }

  function rootPick(state, depth) {
    const moves = legalMoves(state);
    moves.sort((a, b) => moveScore(state, b) - moveScore(state, a));
    let best = -Infinity;
    let move = moves[0];
    for (let i = 0; i < moves.length; i++) {
      const sc = -search(apply(state, moves[i]), depth - 1, -Infinity, Infinity, 1);
      if (sc > best) {
        best = sc;
        move = moves[i];
      }
    }
    return { move, sc: best };
  }

  /* learner, casual, club, expert, master. tournament is an alias of master. */
  function chooseMove(state, level, rng) {
    const moves = legalMoves(state);
    if (!moves.length) return null;
    const random = rng || Math.random;
    const name = level === "tournament" ? "master" : level || "club";
    const count = pieceCount(state.board);

    if (name === "learner") {
      moves.sort((a, b) => moveScore(state, b) - moveScore(state, a));
      if (random() < 0.3) return moves[Math.floor(random() * Math.min(moves.length, 8))];
      const pool = moves.slice(0, 8);
      const scored = [];
      for (let i = 0; i < pool.length; i++) {
        scored.push({
          move: pool[i],
          sc: -search(apply(state, pool[i]), 0, -Infinity, Infinity, 1) + Math.floor(random() * 90),
        });
      }
      scored.sort((a, b) => b.sc - a.sc);
      const band = scored.filter((s) => s.sc >= scored[0].sc - 80);
      return band[Math.floor(random() * Math.min(3, band.length))].move;
    }

    if (name === "master" || name === "expert") {
      table = new Map();
      const budget = name === "master" ? 160 : 80;
      const maxD = name === "master" ? (count <= 8 ? 5 : 4) : 3;
      deadline = Date.now() + budget;
      nodes = 0;
      let best = null;
      for (let d = 2; d <= maxD; d++) {
        if (Date.now() > deadline) break;
        try {
          best = rootPick(state, d);
        } catch (err) {
          if (!err.time) throw err;
          break;
        }
        if (best && best.sc > 24000) break;
      }
      deadline = 0;
      table = null;
      return best ? best.move : moves[0];
    }

    const depth = name === "casual" ? 2 : 3;
    const jitterN = name === "casual" ? 30 : 6;
    moves.sort((a, b) => moveScore(state, b) - moveScore(state, a));
    let bestScore = -Infinity;
    const scored = [];
    for (let i = 0; i < moves.length; i++) {
      const sc = -search(apply(state, moves[i]), depth - 1, -Infinity, Infinity, 1) + Math.floor(random() * jitterN);
      scored.push({ move: moves[i], sc });
      if (sc > bestScore) bestScore = sc;
    }
    scored.sort((a, b) => b.sc - a.sc);
    if (name === "casual") {
      const band = scored.filter((s) => s.sc >= bestScore - 45);
      return band[Math.floor(random() * Math.min(4, band.length))].move;
    }
    if (state.fullmove < 10) {
      const band = scored.filter((s) => s.sc >= bestScore - 14).slice(0, 3);
      return band[Math.floor(random() * band.length)].move;
    }
    return scored[0].move;
  }

  function moveEquals(a, b) {
    return sameMove(a, b);
  }

  const Chess = {
    initial,
    clone,
    legalMoves,
    apply,
    status,
    inCheck,
    toSAN,
    toFEN,
    fromFEN,
    perft,
    positionKey,
    chooseMove,
    evaluate,
    sqName,
    moveEquals,
    opp,
    VAL,
    attacked: isAttacked,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Chess;
  root.Chess = Chess;
})(typeof globalThis !== "undefined" ? globalThis : this);
