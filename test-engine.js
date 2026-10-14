const Chess = require("./engine.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("ok:", msg);
  }
}

const start = Chess.initial();
assert(Chess.legalMoves(start).length === 20, "start has 20 legal moves");
assert(Chess.perft(start, 1) === 20, "perft 1 = 20");
assert(Chess.perft(start, 2) === 400, "perft 2 = 400");
console.time("perft3");
const p3 = Chess.perft(start, 3);
console.timeEnd("perft3");
assert(p3 === 8902, "perft 3 = 8902, got " + p3);

const kiwi = Chess.fromFEN("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1");
assert(Chess.perft(kiwi, 1) === 48, "kiwipete perft1 = 48, got " + Chess.perft(kiwi, 1));
console.time("kiwi2");
const k2 = Chess.perft(kiwi, 2);
console.timeEnd("kiwi2");
assert(k2 === 2039, "kiwipete perft2 = 2039, got " + k2);

/* en passant */
const ep = Chess.fromFEN("rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2");
const epMoves = Chess.legalMoves(ep).filter((m) => m.enPassant);
assert(epMoves.length === 1 && epMoves[0].tc === 3 && epMoves[0].tr === 2, "en passant available");
const afterEp = Chess.apply(ep, epMoves[0]);
assert(afterEp.board[3][3] === null, "captured pawn removed");
assert(afterEp.board[2][3] && afterEp.board[2][3].t === "p" && afterEp.board[2][3].c === "w", "pawn lands on ep square");

/* illegal ep when pinned */
const pin = Chess.fromFEN("4k3/8/8/3pP3/2K5/8/8/8 w - d6 0 1");
/* white king on c4, ep capture toward d6 might be fine. Different pin: */
const pin2 = Chess.fromFEN("8/8/8/2k1pP2/8/8/4K3/8 w - e6 0 1");
/* black king c5, white pawn f5, black pawn e5 just moved? ep e6. White pawn f5 capturing e6. Not pinned. */

/* castling blocked by check */
const castle = Chess.fromFEN("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
const castles = Chess.legalMoves(castle).filter((m) => m.castle);
assert(castles.length === 2, "both castles available, got " + castles.length);
const inCheck = Chess.fromFEN("r3k2r/8/8/8/8/8/8/R3K1qR w KQkq - 0 1");
/* queen on g1 attacks king? queen g1 is adjacent to king e1 via... g1 is file 6, king e1 file 4. Not adjacent. Queen on g1 attacks along rank if f1 empty. f1 is empty, so queen attacks king. Can't castle. */
const noCastle = Chess.legalMoves(inCheck).filter((m) => m.castle);
assert(noCastle.length === 0, "cannot castle out of check");

/* promotion */
const promo = Chess.fromFEN("4k3/P7/8/8/8/8/8/4K3 w - - 0 1");
const promos = Chess.legalMoves(promo).filter((m) => m.promotion);
assert(promos.length === 4, "four promotions, got " + promos.length);
const queen = Chess.apply(promo, promos.find((m) => m.promotion === "q"));
assert(queen.board[0][0].t === "q" && queen.board[0][0].c === "w", "promotes to queen");

/* scholars mate */
function playSANSeq(state, sans) {
  /* play by generating moves and matching SAN roughly via coordinates encoded in test instead */
  return state;
}
let s = Chess.initial();
function play(state, fr, fc, tr, tc, promotion) {
  const moves = Chess.legalMoves(state);
  const m = moves.find((x) => x.fr === fr && x.fc === fc && x.tr === tr && x.tc === tc && (x.promotion || null) === (promotion || null));
  if (!m) throw new Error("illegal " + Chess.sqName(fr, fc) + Chess.sqName(tr, tc));
  return Chess.apply(state, m);
}
/* 1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# */
s = play(s, 6, 4, 4, 4);
s = play(s, 1, 4, 3, 4);
s = play(s, 7, 3, 3, 7);
s = play(s, 0, 1, 2, 2);
s = play(s, 7, 5, 4, 2);
s = play(s, 0, 6, 2, 5);
s = play(s, 3, 7, 1, 5);
const mate = Chess.status(s);
assert(mate.checkmate, "scholar's mate");
assert(Chess.toFEN(s).startsWith("r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b"), "scholar fen " + Chess.toFEN(s));

/* stalemate */
const stale = Chess.fromFEN("k7/8/1Q6/8/8/8/8/7K b - - 0 1");
const st = Chess.status(stale);
assert(st.stalemate && st.draw, "stalemate");

/* pin: black rook pins white knight to king? white knight on e2, king e1, black rook e8, knight cannot move off file */
const pinned = Chess.fromFEN("4r3/8/8/8/8/8/4N3/4K3 w - - 0 1");
const knightMoves = Chess.legalMoves(pinned).filter((m) => m.fr === 6 && m.fc === 4);
assert(knightMoves.length === 0, "pinned knight has no moves, got " + knightMoves.length);

/* SAN disambiguation */
const dis = Chess.fromFEN("3k4/8/8/8/8/2N1N3/8/3K4 w - - 0 1");
const moves = Chess.legalMoves(dis);
const nxd = moves.find((m) => m.fc === 2 && m.tc === 3 && m.tr === 3);
const san = Chess.toSAN(dis, nxd, moves);
assert(san === "Ncd5", "disambiguation san " + san);

/* castling SAN and rook placement */
const c2 = Chess.fromFEN("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
const oo = Chess.legalMoves(c2).find((m) => m.castle === "K");
const afterCastle = Chess.apply(c2, oo);
assert(afterCastle.board[7][6].t === "k", "king castled");
assert(afterCastle.board[7][5].t === "r", "rook castled");
assert(afterCastle.castling.K === false && afterCastle.castling.Q === false, "white castling rights gone");
assert(Chess.toSAN(c2, oo, Chess.legalMoves(c2)) === "O-O", "O-O san " + Chess.toSAN(c2, oo, Chess.legalMoves(c2)));

/* rook capture removes castling right */
const capRook = Chess.fromFEN("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
const take = Chess.legalMoves(capRook).find((m) => m.fr === 7 && m.fc === 0 && m.tr === 0 && m.tc === 0);
/* white rook a1 cannot reach a8 in one move if path blocked? path a-file is empty except a8 black rook. Yes capture. */
assert(take, "rook can capture other rook");
const afterTake = Chess.apply(capRook, take);
assert(afterTake.castling.q === false, "black queenside castling lost when rook captured");
assert(afterTake.castling.Q === false, "white queenside lost when rook moved");

/* fifty move */
const fifty = Chess.fromFEN("4k3/8/8/8/8/8/8/4K3 w - - 100 80");
assert(Chess.status(fifty).reason === "fifty", "fifty-move draw");

/* insufficient */
const kn = Chess.fromFEN("4k3/8/8/8/8/8/8/3NK3 w - - 0 1");
assert(Chess.status(kn).reason === "insufficient", "K+N vs K draw");

/* repetition keys */
const a = Chess.initial();
const keys = [Chess.positionKey(a)];
let b = a;
/* Nf3 Nf6 Ng1 Ng8 Nf3 Nf6 Ng1 Ng8 — threefold after returning */
function mv(state, fr, fc, tr, tc) {
  return Chess.apply(state, Chess.legalMoves(state).find((m) => m.fr === fr && m.fc === fc && m.tr === tr && m.tc === tc));
}
b = mv(b, 7, 6, 5, 5); keys.push(Chess.positionKey(b));
b = mv(b, 0, 6, 2, 5); keys.push(Chess.positionKey(b));
b = mv(b, 5, 5, 7, 6); keys.push(Chess.positionKey(b));
b = mv(b, 2, 5, 0, 6); keys.push(Chess.positionKey(b));
assert(Chess.positionKey(b) === Chess.positionKey(a), "returned to start");
/* count includes current. After 1 cycle, start appears twice (initial + now). Need another cycle for 3. */
b = mv(b, 7, 6, 5, 5); keys.push(Chess.positionKey(b));
b = mv(b, 0, 6, 2, 5); keys.push(Chess.positionKey(b));
b = mv(b, 5, 5, 7, 6); keys.push(Chess.positionKey(b));
b = mv(b, 2, 5, 0, 6); keys.push(Chess.positionKey(b));
const rep = Chess.status(b, keys);
assert(rep.reason === "repetition", "threefold, count of start key " + keys.filter((k) => k === Chess.positionKey(a)).length);

console.log(process.exitCode ? "SOME FAILURES" : "ALL PASSED");
