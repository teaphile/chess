# Meridian Chess

A static chess table for GitHub Pages. Full rules, two seats on one device, a computer opponent that can match your results or play a fixed strength, a score sheet, drills, and a methods course. No server and no account.

## Publish

1. Push this folder to a GitHub repository.
2. Settings → Pages → Deploy from a branch → the folder that contains `index.html`.
3. Open the Pages URL. The game is the page.

`index.html` is self-contained. Theme, sound, coach, rating, notes, and the current game are stored in the browser.

## Play

- **Two seats** passes the device between players.
- **As White** and **As Black** play the computer.
- **Match** follows your results, from a learner to a deeper search. **Easy**, **Club**, and **Master** stay fixed. Master searches several depths and keeps the last finished one, so the page stays responsive.
- **Learn** holds the drills and twenty methods: center, development, castle, checks-captures-threats, pins, forks, skewers, discoveries, endings. Hint draws an arrow. The speech button reads the coach aloud.
- A hanging piece is pointed out before the move is kept. Those positions are saved under Your notes.
- **Score** is the game record. Click a move to review it. Copy score writes PGN. Copy link writes a URL that restores the game.

Castling, en passant, promotion, check, checkmate, stalemate, the fifty-move rule, threefold repetition, and insufficient material are all enforced.

## Rebuild

If you edit the source files, from this folder:

```
node build.js
```

Commit the new `index.html`.
