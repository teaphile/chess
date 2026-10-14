/* Original study course. Not affiliated with any commercial coach. */
(function (root) {
  "use strict";

  const NAMES = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };

  const LESSONS = [
    {
      id: "squares",
      chapter: "Board",
      title: "Name the squares",
      minutes: 2,
      kind: "squares",
      text: "Files run a to h, left to right for White. Ranks run 1 to 8, from White’s side upward. Tap the square that is named.",
      hint: "The file is the letter. The rank is the number. a1 is White’s left corner.",
      success: "You can find a square when it is named. That is the whole map of the board.",
      term: { word: "Square", def: "A square is a file plus a rank, such as e4." },
    },
    {
      id: "pawn-step",
      chapter: "Pieces",
      title: "The pawn steps",
      minutes: 1,
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      goal: { kind: "uci", uci: "e2e4" },
      text: "A pawn moves one square forward, and may move two squares on its first move. It does not capture straight ahead. Advance the e-pawn two squares.",
      hint: "The pawn in front of your king starts on e2. Push it to e4.",
      success: "e4 claims space in the center and opens lines for the queen and the light-squared bishop.",
      term: { word: "Center", def: "The center is the four squares e4, d4, e5, and d5." },
    },
    {
      id: "pawn-capture",
      chapter: "Pieces",
      title: "The pawn captures",
      minutes: 1,
      fen: "4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1",
      goal: { kind: "uci", uci: "e4d5" },
      text: "Pawns capture one square diagonally forward, never straight ahead. Take the black pawn.",
      hint: "Your pawn on e4 captures on d5.",
      success: "Diagonal capture is the pawn’s only way to take a piece.",
    },
    {
      id: "knight",
      chapter: "Pieces",
      title: "The knight",
      minutes: 1,
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      goal: { kind: "uci", uci: "g1f3", alts: ["b1c3"] },
      text: "A knight leaps in an L: two squares one way and one to the side. It jumps over pieces. Develop a knight.",
      hint: "From g1 the knight can leap to f3. From b1 it can leap to c3.",
      success: "A developed knight eyes the center and is ready for the middlegame.",
      term: { word: "Develop", def: "To develop is to bring a knight or bishop off the back rank into the game." },
    },
    {
      id: "bishop",
      chapter: "Pieces",
      title: "The bishop",
      minutes: 1,
      fen: "4k3/p7/8/8/8/8/P7/4KB2 w - - 0 1",
      goal: { kind: "uci", uci: "f1c4", alts: ["f1b5", "f1a6"] },
      text: "A bishop slides any number of squares diagonally, and stays on one color for the whole game. Move the light-squared bishop.",
      hint: "The bishop on f1 can go to c4, b5, or a6.",
      success: "Each side has a light-squared bishop and a dark-squared bishop. They never switch colors.",
    },
    {
      id: "rook",
      chapter: "Pieces",
      title: "The rook",
      minutes: 1,
      fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1",
      goal: { kind: "uci", uci: "a1a8" },
      text: "A rook slides any distance along a rank or a file, if the way is clear. Send the rook to the eighth rank and give check.",
      hint: "The a-file is open. a1 to a8.",
      success: "An open file is a rook’s natural road. This one reaches the king.",
      term: { word: "Check", def: "Check means the king is attacked. The check must be answered at once." },
    },
    {
      id: "queen",
      chapter: "Pieces",
      title: "The queen",
      minutes: 1,
      fen: "4k3/8/8/8/8/8/8/3QK3 w - - 0 1",
      goal: { kind: "uci", uci: "d1d8" },
      text: "The queen combines rook and bishop: ranks, files, and diagonals. She is the strongest piece, and she needs open lines. Check along the d-file.",
      hint: "d1 to d8.",
      success: "The queen is powerful because she can change direction. She is also a target if left loose.",
    },
    {
      id: "king",
      chapter: "Pieces",
      title: "The king",
      minutes: 1,
      fen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1",
      goal: { kind: "king" },
      text: "The king steps one square in any direction. You may not move him onto an attacked square. Step the king.",
      hint: "Any one-square king move is enough.",
      success: "The king is slow. Safety matters more than activity until most pieces have left the board.",
    },
    {
      id: "escape",
      chapter: "Rules",
      title: "Answer a check",
      minutes: 2,
      fen: "4k3/8/8/8/8/8/8/r3K3 w Q - 0 1",
      goal: { kind: "escape" },
      text: "Your king is in check from the rook on a1. You must get out of check: step off the line, block it, or capture the attacker. Step the king off the first rank.",
      hint: "d2, e2, and f2 all leave the rook’s line.",
      success: "Three answers to check: move the king, block the line, or take the checking piece. Here, stepping off is enough.",
    },
    {
      id: "mate",
      chapter: "Rules",
      title: "Checkmate",
      minutes: 2,
      fen: "6k1/5Q2/6K1/8/8/8/8/8 w - - 0 1",
      goal: { kind: "mate" },
      text: "The queen can mate the king on g8. Find the move.",
      hint: "The queen can step beside the king, onto g7, where your own king protects her.",
      success: "Mate, not just check. The king is attacked, and every flight square fails.",
      term: { word: "Checkmate", def: "Checkmate ends the game. The king is in check and has no legal answer." },
    },
    {
      id: "scholar",
      chapter: "Puzzles",
      title: "A short mate",
      minutes: 2,
      fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4",
      goal: { kind: "uci", uci: "h5f7" },
      text: "The f7-pawn is only defended by the king. Your queen and bishop both look at it. End the game.",
      hint: "Queen takes on f7.",
      success: "f7 and f2 are tender in the opening. A queen and a bishop can finish the game there.",
    },
    {
      id: "back-rank",
      chapter: "Puzzles",
      title: "The back rank",
      minutes: 2,
      fen: "6k1/6pp/6p1/8/8/8/8/4Q1K1 w - - 0 1",
      goal: { kind: "uci", uci: "e1e8" },
      text: "The black king is boxed in by his own pawns. A queen on the eighth rank can mate if the file is clear.",
      hint: "Queen to e8.",
      success: "A king on the back rank, blocked by his own pawns, needs a flight square. This one has none.",
      term: { word: "Back rank", def: "The rank the king starts on. A back-rank mate traps the king there." },
    },
    {
      id: "castle",
      chapter: "Rules",
      title: "Castle",
      minutes: 2,
      fen: "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1",
      goal: { kind: "castle" },
      text: "Castling moves the king two squares toward a rook, and that rook jumps to the other side of the king. The king must not be in check, and the squares he crosses must be safe. Castle.",
      hint: "King from e1 toward the h-file, or toward the a-file.",
      success: "Castling tucks the king away and brings a rook toward the center in one move.",
      term: { word: "Castle", def: "The only move that relocates two pieces. King two squares, rook to the square he crossed." },
    },
    {
      id: "passant",
      chapter: "Rules",
      title: "En passant",
      minutes: 2,
      fen: "rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2",
      goal: { kind: "uci", uci: "e5d6" },
      text: "If a pawn jumps two squares and lands beside an enemy pawn, that pawn may capture it as if it had moved only one. The chance lasts one move. Take en passant.",
      hint: "Your pawn on e5 captures on d6, and the pawn on d5 disappears.",
      success: "En passant stops a pawn from sneaking past with a double step.",
      term: { word: "En passant", def: "A special pawn capture, only on the move immediately after a two-square pawn jump." },
    },
    {
      id: "promotion",
      chapter: "Rules",
      title: "Promotion",
      minutes: 1,
      fen: "8/P7/8/8/8/4k3/8/4K3 w - - 0 1",
      goal: { kind: "promo", uci: "a7a8" },
      text: "A pawn that reaches the last rank becomes a queen, rook, bishop, or knight. Almost always, choose the queen. Promote.",
      hint: "Push the pawn to a8 and take a queen.",
      success: "Promotion is how a quiet pawn becomes the strongest piece on the board.",
      term: { word: "Promotion", def: "Replacing a pawn on the last rank with a queen, rook, bishop, or knight." },
    },
    {
      id: "pin",
      chapter: "Ideas",
      title: "The pin",
      minutes: 2,
      fen: "4r1k1/8/8/8/4N3/8/8/4K3 w - - 0 1",
      goal: { kind: "king" },
      text: "The knight on e4 stands between your king and the black rook. It is pinned: moving it would expose the king, so the move is illegal. Try the knight if you like, then step the king off the file.",
      hint: "The knight cannot move. Move the king.",
      success: "A pin ties a piece to a more valuable one behind it. An absolute pin, against the king, freezes the piece.",
      term: { word: "Pin", def: "A piece that cannot move without exposing a more valuable piece behind it." },
    },
    {
      id: "fork",
      chapter: "Ideas",
      title: "The fork",
      minutes: 2,
      fen: "r3k3/8/N7/8/8/8/8/4K3 w - - 0 1",
      goal: { kind: "uci", uci: "a6c7" },
      text: "A fork is one piece attacking two things at once. The knight on a6 can attack the king and the rook together.",
      hint: "Knight to c7.",
      success: "Knights fork well because the leap is hard to see. One move, two targets.",
      term: { word: "Fork", def: "One piece attacking two pieces at the same time." },
    },
    {
      id: "loose",
      chapter: "Puzzles",
      title: "A loose queen",
      minutes: 1,
      fen: "4k3/8/8/8/4q2R/8/8/4K3 w - - 0 1",
      goal: { kind: "uci", uci: "h4e4" },
      text: "Before you attack, look for what is unprotected. The queen on e4 has no defender. Take her.",
      hint: "The rook on h4 shares a rank with the queen.",
      success: "An unprotected piece is a gift. Look for them before you look for combinations.",
      term: { word: "Loose", def: "A loose piece is attacked, or simply undefended and easy to take." },
    },
    {
      id: "develop",
      chapter: "Principles",
      title: "Develop a piece",
      minutes: 1,
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1",
      goal: { kind: "uci", uci: "g1f3", alts: ["b1c3"] },
      text: "After a pawn claims the center, bring a knight out. Knights belong toward the middle, not on the rim. Develop the king’s knight or the queen’s knight.",
      hint: "Knight from g1 to f3, or from b1 to c3.",
      success: "A developed knight attacks the center and makes room to castle.",
      term: { word: "Development", def: "Development is bringing pieces off the back rank into the game." },
    },
    {
      id: "skewer",
      chapter: "Tactics",
      title: "The skewer",
      minutes: 2,
      fen: "7q/8/8/4k3/8/8/8/B3K3 w - - 0 1",
      goal: { kind: "uci", uci: "a1b2" },
      text: "A skewer is a pin in reverse. The more valuable piece is in front. Put the bishop on the diagonal so the king must move, and the queen behind it falls.",
      hint: "Bishop from a1 to b2.",
      success: "The king is in check and must step off the line. Then the bishop takes the queen.",
      term: { word: "Skewer", def: "An attack on a line where a valuable piece stands in front of a lesser one." },
    },
    {
      id: "discover",
      chapter: "Tactics",
      title: "A discovered check",
      minutes: 2,
      fen: "4k3/8/8/8/4B3/8/8/4R1K1 w - - 0 1",
      goal: { kind: "uci", uci: "e4c6", alts: ["e4d5", "e4d3", "e4f5", "e4f3", "e4b7", "e4a8", "e4g6", "e4h7", "e4c2", "e4b1", "e4g2"] },
      text: "The bishop on e4 is standing in the way of your rook. Move the bishop off the e-file. The rook checks the king, and the bishop can land on a useful square.",
      hint: "Any bishop move that leaves the e-file. c6 is a strong square.",
      success: "A discovered check moves one piece and uncovers an attack from another. Both can be threats.",
      term: { word: "Discovery", def: "A discovered attack appears when one piece moves off the line of another." },
    },
    {
      id: "passed",
      chapter: "Endings",
      title: "Push the passed pawn",
      minutes: 1,
      fen: "8/8/4P3/8/8/8/8/k3K3 w - - 0 1",
      goal: { kind: "uci", uci: "e6e7" },
      text: "A passed pawn has no enemy pawn that can stop it. It is a candidate for a new queen. Push it.",
      hint: "The pawn on e6 steps to e7.",
      success: "Passed pawns must be pushed. The further they go, the more the other side has to drop everything to stop them.",
      term: { word: "Passed pawn", def: "A pawn with no enemy pawn on its file or either neighboring file ahead of it." },
    },
    {
      id: "rook-mate",
      chapter: "Endings",
      title: "Rook mate",
      minutes: 2,
      fen: "k7/7R/K7/8/8/8/8/8 w - - 0 1",
      goal: { kind: "uci", uci: "h7h8" },
      text: "King and rook mate by cutting the king to the edge. Your king on a6 already covers a7 and b7. Slide the rook to the eighth rank.",
      hint: "Rook from h7 to h8.",
      success: "The rook checks along the rank. The king’s own edge, and your king, take away the flights.",
      term: { word: "Rook mate", def: "The rook checks along the edge while its own king covers the escape squares." },
    },
    {
      id: "opposition",
      chapter: "Endings",
      title: "Take the opposition",
      minutes: 2,
      fen: "8/8/8/4k3/8/8/4K3/4P3 w - - 0 1",
      goal: { kind: "uci", uci: "e2e3" },
      text: "When only kings and pawns remain, the king who faces the other with one square between them has the opposition. Step straight toward the enemy king.",
      hint: "King from e2 to e3.",
      success: "The black king must give way. Opposition is how a king walks into the other side’s position.",
      term: { word: "Opposition", def: "Kings stand on the same line with one square between them. The side not to move has the opposition." },
    },
  ];

  const METHODS = [
    { title: "Fight for the center", text: "The center is e4, d4, e5, and d5. A pawn or a piece there controls more of the board than the same piece on the rim. Claim a center square, or attack one, before you start a side attack." },
    { title: "Develop before you attack", text: "Knights and bishops should leave the back rank in the first few moves. A queen raid with pieces still at home usually walks into a fork. Bring two or three pieces out, then look for a target." },
    { title: "Castle early", text: "Castling does two jobs: the king leaves the center, and a rook steps toward an open file. Do it before the center opens. A king left on e1 in an open position is a tactic waiting to happen." },
    { title: "Do not lead with the queen", text: "The queen is easy to attack with developing moves. If she comes out on move two, the other side develops with tempo. Save her until a knight or bishop has a home." },
    { title: "Checks, captures, threats", text: "When you calculate, look in that order. Checks first, because they force a reply. Then captures, because they change the material. Then threats, such as a fork or a pin. Quiet moves come last." },
    { title: "Trade when you are ahead", text: "If you have an extra piece, exchanges help you. Each trade removes a defender and brings the position closer to an ending you can win by counting. Do not trade when you are behind, unless it is the only way out of a bad attack." },
    { title: "Keep pieces when you are behind", text: "A pawn down with queens on the board still has counterplay. A pawn down with only kings left is usually lost. Avoid trades, create a threat, and look for the other side to misplace a piece." },
    { title: "Rooks want open files", text: "A file with no pawns is an open file. Put a rook on it, and if you can, double the rooks. A half-open file, where only the opponent has a pawn, is the next best home." },
    { title: "Passed pawns must be pushed", text: "A passed pawn has no enemy pawn that can block it. Advance it. The other side will have to use a piece to stop it, and that piece is then not attacking you." },
    { title: "The pin", text: "A pin attacks a piece that cannot move without exposing something more valuable, often the king. Do not break a pin by moving the pinned piece if the king is behind it. Attack the pinned piece again." },
    { title: "The fork", text: "One piece, two targets. Knights fork well because they leap. Look for a square that attacks the king and something else. The king must move, and the other piece falls." },
    { title: "The skewer", text: "A skewer is a pin with the valuable piece in front. Check the king along a line, and a queen or rook behind it is lost when the king steps aside." },
    { title: "The discovered attack", text: "Move a piece off a line, and the piece behind it attacks. If that attack is check, the opponent must answer the check, and your moving piece can take something for free." },
    { title: "Watch the back rank", text: "A king on the back rank, boxed in by its own pawns, can be mated by a rook or queen that lands on that rank. Give the king a flight square, or keep a piece guarding the rank." },
    { title: "King and queen mate", text: "Use the queen to cut the king to the edge, one rank or file at a time. Do not stalemate. Bring your own king up to cover the escape squares, then check from a distance." },
    { title: "King and rook mate", text: "The rook cuts a rank or a file. Your king stands opposite the enemy king and takes the flights. Check only when the king is already on the edge and your king covers the next rank." },
    { title: "Opposition", text: "In a king ending, step so that the kings face each other with one square between them, and it is the opponent’s turn. They must give way. That is how you walk your king in front of a passed pawn." },
    { title: "Two weaknesses", text: "One weakness can be defended. Two cannot, if they are far apart. Attack on the queenside until a piece is tied down, then switch to the kingside. The defender cannot be in both places." },
    { title: "Do not grab in the opening", text: "A pawn offered in the first ten moves is often bait. Ask what you are leaving behind: a piece undeveloped, a king in the center, or a file opening onto you. Count the pawn only after your king is safe." },
    { title: "Activity over material in an attack", text: "A piece that attacks the king is worth more than its points for a few moves. If every piece is aimed at the king, do not stop to take a pawn on the other wing. Finish the attack, or defend it, first." },
  ];

  const OPENINGS = [
    { moves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6"], name: "Ruy Lopez, Morphy" },
    { moves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "g8f6"], name: "Ruy Lopez, Berlin" },
    { moves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"], name: "Ruy Lopez" },
    { moves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4"], name: "Italian Game" },
    { moves: ["e2e4", "e7e5", "g1f3", "b8c6"], name: "Open Game" },
    { moves: ["e2e4", "c7c5", "g1f3", "d7d6", "d2d4"], name: "Sicilian, Open" },
    { moves: ["e2e4", "c7c5"], name: "Sicilian Defence" },
    { moves: ["e2e4", "e7e6", "d2d4", "d7d5"], name: "French Defence" },
    { moves: ["e2e4", "e7e6"], name: "French Defence" },
    { moves: ["e2e4", "c7c6", "d2d4", "d7d5"], name: "Caro-Kann Defence" },
    { moves: ["e2e4", "c7c6"], name: "Caro-Kann Defence" },
    { moves: ["e2e4", "d7d5"], name: "Scandinavian Defence" },
    { moves: ["d2d4", "d7d5", "c2c4", "e7e6"], name: "Queen’s Gambit Declined" },
    { moves: ["d2d4", "d7d5", "c2c4"], name: "Queen’s Gambit" },
    { moves: ["d2d4", "g8f6", "c2c4", "g7g6"], name: "King’s Indian" },
    { moves: ["d2d4", "g8f6", "c2c4", "e7e6"], name: "Indian Defence" },
    { moves: ["d2d4", "d7d5"], name: "Closed Game" },
    { moves: ["c2c4", "e7e5"], name: "English, reversed Sicilian" },
    { moves: ["c2c4"], name: "English Opening" },
    { moves: ["g1f3"], name: "Réti Opening" },
    { moves: ["e2e4", "e7e5"], name: "Open Game" },
    { moves: ["e2e4"], name: "King’s pawn" },
    { moves: ["d2d4"], name: "Queen’s pawn" },
  ];

  function openingName(ucis) {
    let best = "";
    for (let i = 0; i < OPENINGS.length; i++) {
      const o = OPENINGS[i];
      if (o.moves.length > ucis.length) continue;
      let ok = true;
      for (let j = 0; j < o.moves.length; j++) if (o.moves[j] !== ucis[j]) ok = false;
      if (ok && o.moves.length >= best.length) best = o.name;
    }
    return best;
  }

  function explainMove(prev, move, san) {
    const piece = prev.board[move.fr][move.fc];
    if (!piece) return san;
    const side = piece.c === "w" ? "White" : "Black";
    const name = NAMES[piece.t] || "piece";
    const dest = "abcdefgh"[move.tc] + (8 - move.tr);
    if (move.castle === "K") return side + " castles kingside. The king steps aside and the rook comes toward the center.";
    if (move.castle === "Q") return side + " castles queenside. The king is safer, and a rook takes the open file.";
    let line;
    if (move.enPassant) line = side + " takes the pawn en passant on " + dest + ".";
    else if (prev.board[move.tr][move.tc]) {
      line = side + "’s " + name + " captures the " + NAMES[prev.board[move.tr][move.tc].t] + " on " + dest + ".";
    } else if (piece.t === "p" && Math.abs(move.fr - move.tr) === 2) {
      line = side + " advances the pawn two squares to " + dest + ", claiming space.";
    } else if ((piece.t === "n" || piece.t === "b") && (move.fr === 0 || move.fr === 7)) {
      line = side + " develops the " + name + " to " + dest + ".";
    } else line = side + " moves the " + name + " to " + dest + ".";
    if (move.promotion) line += " The pawn promotes to a " + NAMES[move.promotion] + ".";
    return line;
  }

  function pieceBlurb(type) {
    return {
      p: "Pawns step forward and capture diagonally.",
      n: "Knights leap in an L, and they jump.",
      b: "Bishops travel any distance on one color.",
      r: "Rooks travel ranks and files.",
      q: "The queen combines rook and bishop.",
      k: "The king steps one square. Keep it safe.",
    }[type] || "";
  }

  const Study = { LESSONS, METHODS, OPENINGS, openingName, explainMove, pieceBlurb, NAMES };
  if (typeof module !== "undefined" && module.exports) module.exports = Study;
  root.Study = Study;
})(typeof globalThis !== "undefined" ? globalThis : this);
