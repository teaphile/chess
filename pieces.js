/* Original Staunton-style set. viewBox 0 0 64 64. Not taken from any published font. */
(function (root) {
  "use strict";

  const PATHS = {
    k: `
      <path d="M29.6 2.2h4.8v4.4h4.4v4.4h-4.4v3.2h-4.8V11H25.2V6.6h4.4z"/>
      <path d="M19.6 16.4h24.8l-2.4 4.6H22z"/>
      <path d="M22.6 21.2c2.4 2.6 5.6 3.8 9.4 3.8s7-1.2 9.4-3.8c1.8 1.2 5 2.8 6.6 5-6.6 2.6-13.6 3.4-16 3.4s-9.4-.8-16-3.4c1.6-2.2 4.8-3.8 6.6-5z"/>
      <path d="M20.8 31.2c6.8 3 15.6 3 22.4 0 .8 5.4 0 11.4-2 16.8H22.8c-2-5.4-2.8-11.4-2-16.8z"/>
      <path d="M17.8 48h28.4l1.6 2.8H16.2z"/>
      <path d="M14.6 51h34.8l2.4 3.2c-2.6 2.1-9.2 3.8-19.8 3.8S17.2 56.3 14.6 54.2z"/>
      <ellipse cx="32" cy="58.6" rx="18.6" ry="2.8"/>
    `,
    q: `
      <circle cx="13.2" cy="16.4" r="2.7"/>
      <circle cx="22.4" cy="11.2" r="2.7"/>
      <circle cx="32" cy="8.8" r="3"/>
      <circle cx="41.6" cy="11.2" r="2.7"/>
      <circle cx="50.8" cy="16.4" r="2.7"/>
      <path d="M12.8 15.6 18 25.2c3-2.4 8-3.8 14-3.8s11 1.4 14 3.8l5.2-9.6c2.4 1.5 5.8 3.2 7.2 5.6-7 3.2-16.4 4.6-26.4 4.6S10.6 24.4 3.6 21.2c1.4-2.4 4.8-4.1 7.2-5.6z"/>
      <path d="M16.8 31.6c8.8 3.6 21.6 3.6 30.4 0 .9 6.2-.2 13.4-2.6 19H19.4c-2.4-5.6-3.5-12.8-2.6-19z"/>
      <path d="M14.4 50.6h35.2l1.4 2.6H13z"/>
      <path d="M12.2 53.4h39.6l2.4 3c-2.8 2.1-10.2 3.8-22.2 3.8S15 58.5 12.2 56.4z"/>
      <ellipse cx="32" cy="60.2" rx="20.6" ry="2.6"/>
    `,
    r: `
      <path d="M14.4 8.8h8v6.8h4.2V8.8H29v6.8h6V8.8h8v6.8h6.4v8.6H14.4V15.6h0z"/>
      <path d="M16.8 24.2h30.4v3.8H16.8z"/>
      <path d="M19 28c.6 7.6.2 13.4-1.6 18.2h29.2c-1.8-4.8-2.2-10.6-1.6-18.2z"/>
      <path d="M14.8 46.2h34.4v3.4H14.8z"/>
      <path d="M12.4 49.8h39.2l2.6 3.2c-2.6 2.2-9.8 4-22.2 4s-19.6-1.8-22.2-4z"/>
      <ellipse cx="32" cy="58.6" rx="20.4" ry="2.8"/>
    `,
    b: `
      <circle cx="32" cy="6.6" r="3.35"/>
      <path d="M32 10.6c2 2.4 5.4 6.2 6 10.6 4.6 2.6 7.8 7.4 6.6 13.2-1.8 9.6-6 16.4-8.8 20.2H28.2c-2.8-3.8-7-10.6-8.8-20.2-1.2-5.8 2-10.6 6.6-13.2.6-4.4 4-8.2 6-10.6z"/>
      <path d="M29.2 16.2 35.2 27.4" fill="none" stroke-width="2"/>
      <path d="M23.6 44.8h16.8" fill="none" stroke-width="1.55"/>
      <path d="M16.8 49.2h30.4l2.6 3.2c-2.4 2.1-8.6 3.8-17.8 3.8s-15.4-1.7-17.8-3.8z"/>
      <ellipse cx="32" cy="57.4" rx="17.6" ry="2.8"/>
    `,
    n: `
      <path d="M8.2 24.6c.6-6.2 6.6-8.2 9.6-5.6-2.2-6.4 3-10.6 9-7.6l4.6-7.2 3.6 8.2c4.2-4.2 10.4-3.2 13.4 2l4.2-3.2-3.2 6.2 4.6-2.2-3.6 7.2c5.2 4 6.2 12.2 2.2 19.2 3 4 1 10-5 11.4H15.6c-2-5.6 2-9.6 2.6-14.6-6.6-3-11.6-8-10-14.8z"/>
      <path d="M12.2 27.2c2.6 2.6 5.6 2.2 7.2-.4" fill="none" stroke-width="1.35"/>
      <circle class="eye" cx="19.6" cy="22.2" r="1.5"/>
      <path d="M14.2 51.6h33.2v2.6H14.2z"/>
      <path d="M12.4 54.4h37.2l2.2 2.8c-2.2 1.8-8.8 3.2-19.8 3.2S14.6 59 12.4 57.2z"/>
      <ellipse cx="31" cy="59.2" rx="17.2" ry="2.4"/>
    `,
    p: `
      <circle cx="32" cy="15.2" r="8.4"/>
      <path d="M25.4 22.6c-1.5 2-2.6 4.4-2.8 7.2-3.6 1.7-6.4 5.2-5.4 10 .9 5.6 5.8 8.6 11 9.2-.8 4.2-1 7.8-.2 11h16c.8-3.2.6-6.8-.2-11 5.2-.6 10.1-3.6 11-9.2 1-4.8-1.8-8.3-5.4-10-.2-2.8-1.3-5.2-2.8-7.2-2 1.2-4.6 1.9-7.4 1.9s-5.4-.7-7.4-1.9z"/>
      <path d="M19.6 51.6h24.8l2.2 3c-1.8 1.9-6.8 3.4-14.6 3.4s-12.8-1.5-14.6-3.4z"/>
      <ellipse cx="32" cy="57.2" rx="15.4" ry="2.8"/>
    `,
  };

  const PALETTES = {
    ink: { w: "#f6f0e4", ws: "#241c14", b: "#12100e", bs: "#ecd4aa", sw: "1.25", bsw: "1.05" },
    paper: { w: "#fffaf4", ws: "#241c14", b: "#1a1410", bs: "#5c4634", sw: "1.35", bsw: "1.05" },
    night: { w: "#f3f7f9", ws: "#172028", b: "#0d1114", bs: "#e6d4b0", sw: "1.3", bsw: "1.1" },
    club: { w: "#f7f3e8", ws: "#1e2a22", b: "#12100e", bs: "#f3e4c0", sw: "1.35", bsw: "1.15" },
  };
  let palette = PALETTES.ink;

  function setPalette(name) {
    palette = PALETTES[name] || PALETTES.ink;
  }

  function pieceSVG(type, color, facing) {
    const ivory = color === "w";
    const fill = ivory ? palette.w : palette.b;
    const stroke = ivory ? palette.ws : palette.bs;
    const sw = ivory ? palette.sw : palette.bsw;
    const flip = type === "n" && facing === "right" ? "translate(64 0) scale(-1 1)" : "";
    const body = (PATHS[type] || PATHS.p).replace('class="eye"', 'fill="' + stroke + '" stroke="none"');
    return (
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
      '<g fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round" stroke-linecap="round" transform="' + flip + '">' +
      body +
      "</g></svg>"
    );
  }

  const Pieces = { pieceSVG, setPalette, PALETTES, PATHS };
  if (typeof module !== "undefined" && module.exports) module.exports = Pieces;
  root.Pieces = Pieces;
})(typeof globalThis !== "undefined" ? globalThis : this);
