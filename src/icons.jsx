import React from "react";

const base = {
  width: "1em",
  height: "1em",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
};

export const Logo = ({ size = 30 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
    <rect width="48" height="48" rx="11" fill="#ffffff" stroke="#e2ddd0" strokeWidth="1.6" />
    <path
      d="M24 8 L27.59 19.06 L39.2 19.06 L29.81 25.89 L33.4 36.94 L24 30.11 L14.6 36.94 L18.19 25.89 L8.78 19.06 L20.41 19.06 Z"
      fill="#111111"
    />
  </svg>
);

export const Notebook = (p) => (
  <svg {...base} {...p}>
    <path d="M6 4h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <path d="M6 20V4" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);

export const Note = (p) => (
  <svg {...base} {...p}>
    <path d="M5 4h11l4 4v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20V5.5A1.5 1.5 0 0 1 5.5 4z" />
    <path d="M15 4v4h4" />
    <path d="M8 13h8M8 17h5" />
  </svg>
);

export const Pen = (p) => (
  <svg {...base} {...p}>
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-8 8H6v-4l8-8" />
    <path d="M15 4l5 5" />
  </svg>
);

export const Highlighter = (p) => (
  <svg {...base} {...p}>
    <path d="M9 3h8l1 6-6 7H8l-2-6 3-7z" />
    <path d="M10 9l5 1" />
    <path d="M9 16l-2 4h10l-2-4" />
  </svg>
);

export const Eraser = (p) => (
  <svg {...base} {...p}>
    <path d="M4 16l8-9 8 8a1.5 1.5 0 0 1 0 2.2l-3 2.8H7l-3-3a1.5 1.5 0 0 1 0-2z" />
    <path d="M9 20h11" />
  </svg>
);

export const Pdf = (p) => (
  <svg {...base} {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h.01M12 13h.01M15 13h.01" />
    <path d="M9 16.5c0 1 .7 1.5 1.5 1.5s1.5-.5 1.5-1.5S11.3 15 10.5 15 9 15.5 9 16.5z" />
  </svg>
);

export const Cards = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="7" width="13" height="15" rx="2" />
    <path d="M8 4h11a2 2 0 0 1 2 2v11" />
    <path d="M7 12h5M7 16h5" />
  </svg>
);

export const Search = (p) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

export const Plus = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Trash = (p) => (
  <svg {...base} {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13a1.5 1.5 0 0 0 1.5 1.4h7A1.5 1.5 0 0 0 17 20l1-13" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const Star = ({ filled, ...p }) => (
  <svg {...base} {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9z" />
  </svg>
);

export const Back = (p) => (
  <svg {...base} {...p}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const Download = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M4 20h16" />
  </svg>
);

export const Undo = (p) => (
  <svg {...base} {...p}>
    <path d="M8 5L4 9l4 4" />
    <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
  </svg>
);

export const Redo = (p) => (
  <svg {...base} {...p}>
    <path d="M16 5l4 4-4 4" />
    <path d="M20 9H10a6 6 0 0 0 0 12h3" />
  </svg>
);

export const Close = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const Check = (p) => (
  <svg {...base} {...p}>
    <path d="M4 12.5l5 5L20 6.5" />
  </svg>
);

export const ArrowRight = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowLeft = (p) => (
  <svg {...base} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const Grid = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M4 10h16M4 15h16M10 4v16M15 4v16" />
  </svg>
);

export const Lines = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M7 10h10M7 14h10" />
  </svg>
);

export const Dots = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <circle cx="9" cy="9" r="0.6" fill="currentColor" />
    <circle cx="15" cy="9" r="0.6" fill="currentColor" />
    <circle cx="9" cy="15" r="0.6" fill="currentColor" />
    <circle cx="15" cy="15" r="0.6" fill="currentColor" />
  </svg>
);

export const Blank = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

export const Palette = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4a8 8 0 1 0 0 16c1.2 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-3.3-4-6-9-6z" />
    <circle cx="7.5" cy="11" r="1" fill="currentColor" />
    <circle cx="10.5" cy="7.5" r="1" fill="currentColor" />
    <circle cx="15" cy="7.5" r="1" fill="currentColor" />
  </svg>
);

export const Bold = (p) => (
  <svg {...base} {...p}>
    <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" />
  </svg>
);

export const Italic = (p) => (
  <svg {...base} {...p}>
    <path d="M10 5h8M6 19h8M14 5l-4 14" />
  </svg>
);

export const Underline = (p) => (
  <svg {...base} {...p}>
    <path d="M6 5v6a6 6 0 0 0 12 0V5" />
    <path d="M5 19h14" />
  </svg>
);

export const List = (p) => (
  <svg {...base} {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="5" cy="6" r="1" fill="currentColor" />
    <circle cx="5" cy="12" r="1" fill="currentColor" />
    <circle cx="5" cy="18" r="1" fill="currentColor" />
  </svg>
);

export const H = (p) => (
  <svg {...base} {...p}>
    <path d="M5 5v14M19 5v14M5 12h14" />
  </svg>
);

export const TextColor = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4l-5 16M12 4l5 16M8.5 14h7" />
  </svg>
);

export const Menu = (p) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const Shuffle = (p) => (
  <svg {...base} {...p}>
    <path d="M3 7h3l4 10h4l1.5-3.8" />
    <path d="M14 17h3l4-10h-3" />
    <path d="M16 4l2 2-2 2M16 16l2 2-2 2" />
  </svg>
);

export const Upload = (p) => (
  <svg {...base} {...p}>
    <path d="M12 15V3" />
    <path d="M7 8l5-5 5 5" />
    <path d="M4 20h16" />
  </svg>
);

export const Layers = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
  </svg>
);

export const Lasso = (p) => (
  <svg {...base} {...p}>
    <path d="M5 9c0-3.9 3.1-6 7-6s7 2.1 7 6-3.1 6-7 6c-2.3 0-3.9-1-3.9-2.5 0-1.4 1.6-2.2 3.1-2 1.5.2 2.4 1.2 2.2 2.2-.2 1-1.4 1.6-2.4 1.2" />
  </svg>
);

export const Move = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2v20M2 12h20" />
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
);

export const Type = (p) => (
  <svg {...base} {...p}>
    <path d="M5 5h14M12 5v14M8 19h8" />
  </svg>
);

export const Smile = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 10.2h.01M15.5 10.2h.01" strokeWidth="2.6" />
    <path d="M8 14.5c1.1 1.3 2.4 2 4 2s2.9-.7 4-2" />
  </svg>
);

export const ImageIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="8.5" cy="10" r="1.4" />
    <path d="M21 15l-4.5-4.5L10 17M3 15.5l4-4 3 3" />
  </svg>
);

export const Copy = (p) => (
  <svg {...base} {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const Sun = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const Moon = (p) => (
  <svg {...base} {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

export const Gear = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01A1.7 1.7 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03z" />
  </svg>
);
