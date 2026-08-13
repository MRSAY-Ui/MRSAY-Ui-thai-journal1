import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Back,
  Pen,
  Highlighter,
  Eraser,
  Undo,
  Redo,
  Download,
  Trash,
  Layers,
  Close,
  Check,
  Lasso,
  Move,
  Type,
  Smile,
  ImageIcon,
  Copy,
} from "../icons.jsx";
import { updateNote, uid } from "../store.js";

const PAPER_W = 1240;
const PAPER_H = 1754; // A4 ratio at ~150 dpi

const PEN_COLORS = [
  "#e05252", "#e88a3a", "#e9c442", "#5aa45c",
  "#3ba7a0", "#4c83d6", "#8a63c9", "#d96ba0",
  "#2f2e2b", "#98917f",
];

const STICKERS = [
  "⭐", "❤️", "✅", "📌", "🔥", "👍", "🎉", "💡",
  "☀️", "🌙", "✏️", "📚", "🧠", "⚠️", "❓", "★",
  "●", "▲", "■", "♥",
];

const MODES = [
  { id: "pen", label: "Pen", icon: Pen },
  { id: "select", label: "Select", icon: Lasso },
  { id: "hand", label: "Hand", icon: Move },
  { id: "text", label: "Text", icon: Type },
  { id: "sticker", label: "Stickers", icon: Smile },
  { id: "image", label: "Image", icon: ImageIcon },
];

const PAPER_LIBRARY = [
  {
    group: "Plain",
    items: [{ id: "blank", label: "Blank" }],
  },
  {
    group: "Ruled",
    items: [
      { id: "lined", label: "Lined" },
      { id: "narrow", label: "Narrow lined" },
      { id: "wide", label: "Wide lined" },
      { id: "handwriting", label: "Handwriting" },
    ],
  },
  {
    group: "Grids",
    items: [
      { id: "gridS", label: "Small grid" },
      { id: "gridL", label: "Large grid" },
      { id: "dots", label: "Dot grid" },
      { id: "graph", label: "Graph paper" },
    ],
  },
  {
    group: "Special",
    items: [
      { id: "cornell", label: "Cornell" },
      { id: "checklist", label: "Checklist" },
      { id: "weekly", label: "Weekly planner" },
      { id: "monthly", label: "Monthly" },
    ],
  },
];

const normalizePaper = (id) =>
  id === "grid" ? "gridS" : id === "dotted" ? "dots" : id;

const newId = () => uid();

export default function DrawingPad({ note, onClose, onDataChange }) {
  const canvasRef = useRef(null);
  const paperAreaRef = useRef(null);
  const baseRef = useRef(null); // offscreen paper template
  const inkRef = useRef(null); // offscreen ink layer (eraser only affects this)
  const fileRef = useRef(null);

  const [mode, setMode] = useState("pen"); // pen | select | hand | text | sticker | image
  const [tool, setTool] = useState("pen"); // pen | highlighter | eraser
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [size, setSize] = useState(4);
  const [template, setTemplate] = useState(normalizePaper(note?.drawing?.template) || "blank");
  const [showPapers, setShowPapers] = useState(false);

  const [strokes, setStrokes] = useState(note?.drawing?.strokes || []);
  const [texts, setTexts] = useState(note?.drawing?.texts || []);
  const [images, setImages] = useState(note?.drawing?.images || []);
  const [stickers, setStickers] = useState(note?.drawing?.stickers || []);

  const [selection, setSelection] = useState(null); // { type, ids }
  const [lasso, setLasso] = useState(null); // {x1,y1,x2,y2}
  const [textEdit, setTextEdit] = useState(null); // { id, x, y, text, size, color } | "new"
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const textsRef = useRef(texts);
  textsRef.current = texts;
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const stickersRef = useRef(stickers);
  stickersRef.current = stickers;

  const dragRef = useRef(null); // { kind, startX, startY, orig }
  const drawingRef = useRef(false);
  const currentRef = useRef(null);
  const historyRef = useRef([]);
  const futureRef = useRef([]);
  const saveTimer = useRef(null);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  const snapshot = useCallback(() => ({
    template,
    strokes: strokesRef.current,
    texts: textsRef.current,
    images: imagesRef.current,
    stickers: stickersRef.current,
  }), [template]);

  const pushHistory = useCallback(() => {
    historyRef.current.push(snapshot());
    if (historyRef.current.length > 80) historyRef.current.shift();
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [snapshot]);

  const persist = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateNote(note.id, { drawing: snapshot() });
      onDataChange();
    }, 500);
  }, [note.id, snapshot, onDataChange]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!inkRef.current) {
      inkRef.current = document.createElement("canvas");
      inkRef.current.width = PAPER_W;
      inkRef.current.height = PAPER_H;
    }
    const ctx = canvas.getContext("2d");
    const ink = inkRef.current.getContext("2d");

    // ink layer: strokes + eraser
    ink.clearRect(0, 0, PAPER_W, PAPER_H);
    for (const s of strokesRef.current) drawStroke(ink, s);
    if (currentRef.current) drawStroke(ink, currentRef.current);

    // composite
    ctx.clearRect(0, 0, PAPER_W, PAPER_H);
    ctx.drawImage(baseRef.current, 0, 0);
    for (const img of imagesRef.current) {
      ctx.drawImage(img.bmp || img.src, img.x, img.y, img.w, img.h);
    }
    for (const st of stickersRef.current) {
      ctx.font = `${st.size}px "Segoe UI Emoji", "Apple Color Emoji", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(st.char, st.x, st.y);
    }
    ctx.drawImage(inkRef.current, 0, 0);
    for (const t of textsRef.current) drawTextEl(ctx, t);

    // selection outline
    const sel = selectionRef.current;
    if (sel && sel.ids.length) {
      let box = null;
      const merge = (x, y, w, h) => {
        box = box
          ? {
              x: Math.min(box.x, x),
              y: Math.min(box.y, y),
              w: Math.max(box.x + box.w, x + w) - Math.min(box.x, x),
              h: Math.max(box.y + box.h, y + h) - Math.min(box.y, y),
            }
          : { x, y, w, h };
      };
      if (sel.type === "stroke") {
        for (const s of strokesRef.current) {
          if (!sel.ids.includes(s.id)) continue;
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const pt of s.points) {
            minX = Math.min(minX, pt.x);
            minY = Math.min(minY, pt.y);
            maxX = Math.max(maxX, pt.x);
            maxY = Math.max(maxY, pt.y);
          }
          if (maxX >= minX) merge(minX, minY, maxX - minX, maxY - minY);
        }
      } else if (sel.type === "text") {
        for (const t of textsRef.current) {
          if (sel.ids.includes(t.id)) {
            const b = textBox(t);
            merge(b.x, b.y, b.w, b.h);
          }
        }
      } else if (sel.type === "image") {
        for (const im of imagesRef.current) {
          if (sel.ids.includes(im.id)) merge(im.x, im.y, im.w, im.h);
        }
      } else if (sel.type === "sticker") {
        for (const st of stickersRef.current) {
          if (sel.ids.includes(st.id)) merge(st.x - st.size / 2, st.y - st.size / 2, st.size, st.size);
        }
      }
      if (box) {
        ctx.strokeStyle = "#0888f8";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(box.x - 6, box.y - 6, box.w + 12, box.h + 12);
        ctx.setLineDash([]);
        ctx.fillStyle = "#0888f8";
        for (const [hx, hy] of [
          [box.x - 6, box.y - 6],
          [box.x + box.w + 6, box.y - 6],
          [box.x - 6, box.y + box.h + 6],
          [box.x + box.w + 6, box.y + box.h + 6],
        ]) {
          ctx.fillRect(hx - 5, hy - 5, 10, 10);
        }
      }
    }
    if (lasso) {
      const lx = Math.min(lasso.x1, lasso.x2);
      const ly = Math.min(lasso.y1, lasso.y2);
      ctx.strokeStyle = "#0888f8";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.strokeRect(lx, ly, Math.abs(lasso.x2 - lasso.x1), Math.abs(lasso.y2 - lasso.y1));
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(8,136,248,0.08)";
      ctx.fillRect(lx, ly, Math.abs(lasso.x2 - lasso.x1), Math.abs(lasso.y2 - lasso.y1));
    }
  }, [lasso]);

  // render paper template into offscreen base canvas
  useEffect(() => {
    const base = document.createElement("canvas");
    base.width = PAPER_W;
    base.height = PAPER_H;
    const ctx = base.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAPER_W, PAPER_H);
    drawPaper(ctx, normalizePaper(template), PAPER_W, PAPER_H);
    baseRef.current = base;
    redraw();
  }, [template, redraw]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const sel = selectionRef.current;
        if (sel && sel.ids.length && !textEdit) {
          e.preventDefault();
          deleteSelection();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  const toLocal = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * PAPER_W) / rect.width,
      y: ((e.clientY - rect.top) * PAPER_H) / rect.height,
    };
  };

  // ------------------------------------------------------------- pen mode

  const onPenDown = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = toLocal(e);
    const t = tool === "eraser" ? "eraser" : tool;
    const opts = { tool: t, color, size: t === "highlighter" ? Math.max(size * 2.2, 14) : size };
    currentRef.current = { ...opts, points: [p] };
    redraw();
  };

  const onPenMove = (e) => {
    if (!drawingRef.current) return;
    const p = toLocal(e);
    const cur = currentRef.current;
    const last = cur.points[cur.points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 2.5) return;
    cur.points.push(p);
    redraw();
  };

  const onPenUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const cur = currentRef.current;
    currentRef.current = null;
    if (cur && cur.points.length > 0) {
      pushHistory();
      const next = [...strokesRef.current, cur];
      strokesRef.current = next;
      setStrokes(next);
      persist();
    }
    redraw();
  };

  // ------------------------------------------------------------ select mode

  const hitTest = (p) => {
    // stickers (topmost)
    for (let i = stickersRef.current.length - 1; i >= 0; i--) {
      const s = stickersRef.current[i];
      if (Math.abs(p.x - s.x) < s.size / 2 + 6 && Math.abs(p.y - s.y) < s.size / 2 + 6) {
        return { type: "sticker", id: s.id };
      }
    }
    for (let i = imagesRef.current.length - 1; i >= 0; i--) {
      const im = imagesRef.current[i];
      if (p.x >= im.x && p.x <= im.x + im.w && p.y >= im.y && p.y <= im.y + im.h) {
        return { type: "image", id: im.id };
      }
    }
    for (let i = textsRef.current.length - 1; i >= 0; i--) {
      const t = textsRef.current[i];
      const box = textBox(t);
      if (p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h) {
        return { type: "text", id: t.id };
      }
    }
    // strokes: nearest point within threshold
    const th = 14;
    let best = null;
    let bestD = th;
    for (let i = strokesRef.current.length - 1; i >= 0; i--) {
      const s = strokesRef.current[i];
      for (const pt of s.points) {
        const d = Math.hypot(p.x - pt.x, p.y - pt.y);
        if (d < bestD) {
          bestD = d;
          best = { type: "stroke", id: s.id };
        }
      }
    }
    return best;
  };

  const onSelectDown = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    const p = toLocal(e);
    const hit = hitTest(p);
    if (hit) {
      // dragging an existing selection vs new selection
      const already = selectionRef.current && selectionRef.current.type === hit.type && selectionRef.current.ids.includes(hit.id);
      const ids = already ? selectionRef.current.ids : [hit.id];
      setSelection({ type: hit.type, ids });
      selectionRef.current = { type: hit.type, ids };
      dragRef.current = { kind: "move", type: hit.type, ids, startX: p.x, startY: p.y };
    } else {
      setSelection(null);
      selectionRef.current = null;
      dragRef.current = { kind: "lasso", startX: p.x, startY: p.y };
      setLasso({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
    }
    redraw();
  };

  const onSelectMove = (e) => {
    const p = toLocal(e);
    const d = dragRef.current;
    if (!d) return;
    if (d.kind === "lasso") {
      setLasso({ x1: d.startX, y1: d.startY, x2: p.x, y2: p.y });
      return;
    }
    if (d.kind === "move") {
      const dx = p.x - d.startX;
      const dy = p.y - d.startY;
      if (d.type === "stroke") {
        strokesRef.current = strokesRef.current.map((s) =>
          d.ids.includes(s.id)
            ? { ...s, points: s.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })) }
            : s
        );
        setStrokes(strokesRef.current);
      } else if (d.type === "text") {
        textsRef.current = textsRef.current.map((t) =>
          d.ids.includes(t.id) ? { ...t, x: t.x + dx, y: t.y + dy } : t
        );
        setTexts(textsRef.current);
      } else if (d.type === "image") {
        imagesRef.current = imagesRef.current.map((im) =>
          d.ids.includes(im.id) ? { ...im, x: im.x + dx, y: im.y + dy } : im
        );
        setImages(imagesRef.current);
      } else if (d.type === "sticker") {
        stickersRef.current = stickersRef.current.map((s) =>
          d.ids.includes(s.id) ? { ...s, x: s.x + dx, y: s.y + dy } : s
        );
        setStickers(stickersRef.current);
      }
      redraw();
    }
  };

  const onSelectUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (d.kind === "lasso") {
      const lx = Math.min(d.startX, lasso?.x2 ?? d.startX);
      const ly = Math.min(d.startY, lasso?.y2 ?? d.startY);
      const rx = Math.max(d.startX, lasso?.x2 ?? d.startX);
      const ry = Math.max(d.startY, lasso?.y2 ?? d.startY);
      setLasso(null);
      const ids = [];
      for (const s of strokesRef.current) {
        const inside = s.points.some((pt) => pt.x >= lx && pt.x <= rx && pt.y >= ly && pt.y <= ry);
        if (inside) ids.push(s.id);
      }
      if (ids.length) {
        const sel = { type: "stroke", ids };
        setSelection(sel);
        selectionRef.current = sel;
      } else {
        setSelection(null);
        selectionRef.current = null;
      }
      redraw();
    } else if (d.kind === "move") {
      pushHistory();
      persist();
    }
  };

  const deleteSelection = () => {
    const sel = selectionRef.current;
    if (!sel || !sel.ids.length) return;
    pushHistory();
    if (sel.type === "stroke") {
      strokesRef.current = strokesRef.current.filter((s) => !sel.ids.includes(s.id));
      setStrokes(strokesRef.current);
    } else if (sel.type === "text") {
      textsRef.current = textsRef.current.filter((t) => !sel.ids.includes(t.id));
      setTexts(textsRef.current);
    } else if (sel.type === "image") {
      imagesRef.current = imagesRef.current.filter((im) => !sel.ids.includes(im.id));
      setImages(imagesRef.current);
    } else if (sel.type === "sticker") {
      stickersRef.current = stickersRef.current.filter((s) => !sel.ids.includes(s.id));
      setStickers(stickersRef.current);
    }
    setSelection(null);
    selectionRef.current = null;
    persist();
    redraw();
  };

  const duplicateSelection = () => {
    const sel = selectionRef.current;
    if (!sel || !sel.ids.length) return;
    pushHistory();
    if (sel.type === "stroke") {
      const copies = strokesRef.current
        .filter((s) => sel.ids.includes(s.id))
        .map((s) => ({ ...s, points: s.points.map((pt) => ({ x: pt.x + 24, y: pt.y + 24 })) }));
      strokesRef.current = [...strokesRef.current, ...copies];
      setStrokes(strokesRef.current);
    } else if (sel.type === "text") {
      const copies = textsRef.current
        .filter((t) => sel.ids.includes(t.id))
        .map((t) => ({ ...t, id: newId(), x: t.x + 24, y: t.y + 24 }));
      textsRef.current = [...textsRef.current, ...copies];
      setTexts(textsRef.current);
    } else if (sel.type === "image") {
      const copies = imagesRef.current
        .filter((im) => sel.ids.includes(im.id))
        .map((im) => ({ ...im, id: newId(), x: im.x + 24, y: im.y + 24 }));
      imagesRef.current = [...imagesRef.current, ...copies];
      setImages(imagesRef.current);
    } else if (sel.type === "sticker") {
      const copies = stickersRef.current
        .filter((s) => sel.ids.includes(s.id))
        .map((s) => ({ ...s, id: newId(), x: s.x + 24, y: s.y + 24 }));
      stickersRef.current = [...stickersRef.current, ...copies];
      setStickers(stickersRef.current);
    }
    persist();
    redraw();
  };

  // --------------------------------------------------------------- hand mode

  const onHandDown = (e) => {
    const area = paperAreaRef.current;
    dragRef.current = { kind: "hand", startX: e.clientX, startY: e.clientY, sl: area.scrollLeft, st: area.scrollTop };
  };

  const onHandMove = (e) => {
    const d = dragRef.current;
    if (!d || d.kind !== "hand") return;
    const area = paperAreaRef.current;
    area.scrollLeft = d.sl - (e.clientX - d.startX);
    area.scrollTop = d.st - (e.clientY - d.startY);
  };

  const onHandUp = () => {
    dragRef.current = null;
  };

  // -------------------------------------------------------------- text mode

  const onTextDown = (e) => {
    e.preventDefault();
    const p = toLocal(e);
    // tap an existing text to edit it
    const hit = hitTest(p);
    if (hit && hit.type === "text") {
      const t = textsRef.current.find((x) => x.id === hit.id);
      if (t) {
        setTextEdit({ id: t.id, x: t.x, y: t.y, text: t.text, size: t.size, color: t.color });
        return;
      }
    }
    const el = { id: newId(), x: p.x, y: p.y, text: "", size: 40, color: color === "#98917f" ? "#2f2e2b" : color };
    textsRef.current = [...textsRef.current, el];
    setTexts(textsRef.current);
    setTextEdit({ ...el });
  };

  const saveText = () => {
    if (!textEdit) return;
    pushHistory();
    if (textEdit.id) {
      textsRef.current = textsRef.current.map((t) =>
        t.id === textEdit.id ? { ...t, text: textEdit.text, size: textEdit.size, color: textEdit.color } : t
      );
    }
    setTexts(textsRef.current);
    setTextEdit(null);
    persist();
    redraw();
  };

  // ------------------------------------------------------------ sticker mode

  const addSticker = (char) => {
    pushHistory();
    const el = { id: newId(), x: PAPER_W / 2, y: PAPER_H / 2, size: 72, char };
    stickersRef.current = [...stickersRef.current, el];
    setStickers(stickersRef.current);
    const sel = { type: "sticker", ids: [el.id] };
    setSelection(sel);
    selectionRef.current = sel;
    setMode("select");
    persist();
    redraw();
  };

  // ------------------------------------------------------------- image mode

  const onImageFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        pushHistory();
        const w = Math.min(560, img.naturalWidth * (560 / img.naturalWidth));
        const h = (w * img.naturalHeight) / img.naturalWidth;
        const el = {
          id: newId(),
          x: (PAPER_W - w) / 2,
          y: (PAPER_H - h) / 2,
          w,
          h,
          src: reader.result,
          bmp: img,
        };
        imagesRef.current = [...imagesRef.current, el];
        setImages(imagesRef.current);
        const sel = { type: "image", ids: [el.id] };
        setSelection(sel);
        selectionRef.current = sel;
        setMode("select");
        persist();
        redraw();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  // ------------------------------------------------------------- undo/redo

  const undo = () => {
    if (!historyRef.current.length) return;
    futureRef.current.push(snapshot());
    const prev = historyRef.current.pop();
    applySnapshot(prev);
    setCanUndo(historyRef.current.length > 0);
    setCanRedo(true);
  };

  const redo = () => {
    if (!futureRef.current.length) return;
    historyRef.current.push(snapshot());
    const next = futureRef.current.pop();
    applySnapshot(next);
    setCanRedo(futureRef.current.length > 0);
    setCanUndo(true);
  };

  const applySnapshot = (s) => {
    strokesRef.current = s.strokes || [];
    textsRef.current = s.texts || [];
    imagesRef.current = s.images || [];
    stickersRef.current = s.stickers || [];
    setStrokes(strokesRef.current);
    setTexts(textsRef.current);
    setImages(imagesRef.current);
    setStickers(stickersRef.current);
    setSelection(null);
    selectionRef.current = null;
    persist();
    redraw();
  };

  const clearAll = () => {
    pushHistory();
    strokesRef.current = [];
    textsRef.current = [];
    imagesRef.current = [];
    stickersRef.current = [];
    setStrokes([]);
    setTexts([]);
    setImages([]);
    setStickers([]);
    setSelection(null);
    selectionRef.current = null;
    persist();
    redraw();
  };

  // ----------------------------------------------------------- export / save

  const saveAndClose = () => {
    updateNote(note.id, { drawing: snapshot() });
    onDataChange();
    onClose();
  };

  const exportPng = () => {
    const out = document.createElement("canvas");
    out.width = PAPER_W;
    out.height = PAPER_H;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAPER_W, PAPER_H);
    ctx.drawImage(baseRef.current, 0, 0);
    for (const img of imagesRef.current) ctx.drawImage(img.bmp || img.src, img.x, img.y, img.w, img.h);
    for (const st of stickersRef.current) {
      ctx.font = `${st.size}px "Segoe UI Emoji", "Apple Color Emoji", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(st.char, st.x, st.y);
    }
    for (const s of strokesRef.current) drawStroke(ctx, s);
    for (const t of textsRef.current) drawTextEl(ctx, t);
    out.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(note.title || "sketch").replace(/[^\w]+/g, "-")}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
  };

  const pointerHandlers = (() => {
    switch (mode) {
      case "pen":
        return { onPointerDown: onPenDown, onPointerMove: onPenMove, onPointerUp: onPenUp, onPointerCancel: onPenUp };
      case "select":
        return { onPointerDown: onSelectDown, onPointerMove: onSelectMove, onPointerUp: onSelectUp, onPointerCancel: onSelectUp };
      case "text":
        return { onPointerDown: onTextDown, onPointerMove: () => {}, onPointerUp: () => {}, onPointerCancel: () => {} };
      default:
        return {};
    }
  })();

  const paperAreaHandlers =
    mode === "hand"
      ? { onPointerDown: onHandDown, onPointerMove: onHandMove, onPointerUp: onHandUp, onPointerCancel: onHandUp }
      : {};

  const paperLabel = PAPER_LIBRARY.flatMap((g) => g.items).find((p) => p.id === template)?.label || "Blank";

  return (
    <div className="drawing-screen">
      <div className="drawing-topbar">
        <button className="btn sm" onClick={saveAndClose}>
          <Check /> Done
        </button>
        <button className="icon-btn" onClick={undo} disabled={!canUndo} title="Undo">
          <Undo />
        </button>
        <button className="icon-btn" onClick={redo} disabled={!canRedo} title="Redo">
          <Redo />
        </button>
        <div className="spacer" />

        <button className="btn sm" onClick={() => setShowPapers(true)} title="Paper library">
          <Layers /> {paperLabel}
        </button>

        <button className="icon-btn" style={{ color: "#e05252" }} onClick={clearAll} title="Clear page">
          <Trash />
        </button>
        <button className="btn sm" onClick={exportPng}>
          <Download /> PNG
        </button>
        <button className="icon-btn" onClick={onClose} title="Back (don't save)">
          <Back />
        </button>
      </div>

      <div className="paper-area" ref={paperAreaRef} style={{ touchAction: "none" }} {...paperAreaHandlers}>
        <canvas
          ref={canvasRef}
          className={`paper ${mode === "pen" && tool === "eraser" ? "erasing" : ""}`}
          width={PAPER_W}
          height={PAPER_H}
          style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", touchAction: "none" }}
          {...pointerHandlers}
        />
      </div>

      <div className="sketch-dock">
        {/* mode bar */}
        <div className="canvas-tools">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`tool ${mode === m.id ? "on" : ""}`}
              onClick={() => {
                setMode(m.id);
                setSelection(null);
                selectionRef.current = null;
              }}
              title={m.label}
            >
              <m.icon />
            </button>
          ))}
        </div>

        {mode === "pen" && (
          <div className="canvas-tools">
            <div className="tool-group">
              {[
                { id: "pen", icon: Pen, label: "Pen" },
                { id: "highlighter", icon: Highlighter, label: "Highlighter" },
                { id: "eraser", icon: Eraser, label: "Eraser" },
              ].map((t) => (
                <button
                  key={t.id}
                  className={`tool ${tool === t.id ? "on" : ""}`}
                  onClick={() => setTool(t.id)}
                  title={t.label}
                >
                  <t.icon />
                </button>
              ))}
            </div>
            <div className="tool-group" style={{ alignItems: "center", gap: 6 }}>
              {PEN_COLORS.map((c) => (
                <button
                  key={c}
                  className={`pen-swatch ${color === c ? "on" : ""}`}
                  style={{ color: c, background: c === "#e9c442" || c === "#98917f" ? "rgba(0,0,0,0.03)" : undefined }}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                >
                  <span className="dot" />
                </button>
              ))}
            </div>
            <div className="tool-group stroke-size">
              <span style={{ fontSize: 11 }}>Size</span>
              <input
                type="range"
                min="1"
                max="24"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
              <span style={{ minWidth: 16, textAlign: "center" }}>{size}</span>
            </div>
          </div>
        )}

        {mode === "select" && (
          <div className="canvas-tools">
            {selection && selection.ids.length > 0 ? (
              <>
                <span className="chip">{selection.ids.length} selected</span>
                <button className="tool" onClick={duplicateSelection} title="Duplicate">
                  <Copy />
                </button>
                <button className="tool" style={{ color: "#e05252" }} onClick={deleteSelection} title="Delete">
                  <Trash />
                </button>
                <button className="tool" onClick={() => { setSelection(null); selectionRef.current = null; }} title="Deselect">
                  <Close />
                </button>
              </>
            ) : (
              <span className="chip">Drag a loop to select, or tap an element</span>
            )}
          </div>
        )}

        {mode === "hand" && (
          <div className="canvas-tools">
            <span className="chip">Drag to move around the page</span>
          </div>
        )}

        {mode === "text" && (
          <div className="canvas-tools">
            <span className="chip">Tap the page to place text</span>
            <div className="tool-group" style={{ alignItems: "center", gap: 6 }}>
              {PEN_COLORS.slice(0, 9).map((c) => (
                <button
                  key={c}
                  className={`pen-swatch ${color === c ? "on" : ""}`}
                  style={{ color: c, background: c === "#e9c442" ? "rgba(0,0,0,0.03)" : undefined }}
                  onClick={() => setColor(c)}
                  aria-label={`Text color ${c}`}
                >
                  <span className="dot" />
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "sticker" && (
          <div className="canvas-tools sticker-palette">
            {STICKERS.map((s) => (
              <button key={s} className="sticker-btn" onClick={() => addSticker(s)} title={`Add ${s}`}>
                {s}
              </button>
            ))}
          </div>
        )}

        {mode === "image" && (
          <div className="canvas-tools">
            <button className="btn sm primary" onClick={() => fileRef.current?.click()}>
              <ImageIcon /> Choose an image
            </button>
            <span className="chip">It will be placed in the middle — drag it afterwards</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImageFile(f);
                e.target.value = "";
              }}
            />
          </div>
        )}
      </div>

      {showPapers && (
        <div
          className="paper-picker-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setShowPapers(false)}
        >
          <div className="paper-picker">
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <h3>Paper library</h3>
                <div className="modal-sub">13 paper styles for your notes and sketches.</div>
              </div>
              <button className="icon-btn" onClick={() => setShowPapers(false)} aria-label="Close">
                <Close />
              </button>
            </div>
            {PAPER_LIBRARY.map((g) => (
              <div key={g.group}>
                <div className="paper-group-title">{g.group}</div>
                <div className="paper-grid">
                  {g.items.map((p) => (
                    <button
                      key={p.id}
                      className={`paper-swatch ${template === p.id ? "on" : ""}`}
                      onClick={() => {
                        setTemplate(p.id);
                        setShowPapers(false);
                      }}
                    >
                      <PaperPreview id={p.id} />
                      <span className="p-label">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {textEdit && (
        <div className="paper-picker-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setTextEdit(null)}>
          <div className="paper-picker" style={{ maxWidth: 420 }}>
            <h3>{textEdit.id ? "Edit text" : "Place text"}</h3>
            <div className="modal-sub">Type below, then tap Save.</div>
            <textarea
              className="textarea"
              autoFocus
              rows={3}
              value={textEdit.text}
              placeholder="Type your text…"
              onChange={(e) => setTextEdit({ ...textEdit, text: e.target.value })}
            />
            <label className="field-label">Size</label>
            <input
              type="range"
              min="20"
              max="96"
              value={textEdit.size}
              onChange={(e) => setTextEdit({ ...textEdit, size: Number(e.target.value) })}
            />
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => {
                // remove a freshly created empty text if discarded
                if (!textEdit.id) {
                  textsRef.current = textsRef.current.filter((t) => t.text !== "" || t.id !== textEdit.id);
                  setTexts(textsRef.current);
                  redraw();
                }
                setTextEdit(null);
              }}>
                Cancel
              </button>
              <button className="btn primary" onClick={saveText}>
                <Check /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ helpers

function drawTextEl(ctx, t) {
  ctx.save();
  ctx.fillStyle = t.color || "#2f2e2b";
  ctx.font = `${t.size}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const lines = String(t.text || "").split("\n");
  lines.forEach((ln, i) => ctx.fillText(ln, t.x, t.y + i * t.size * 1.25));
  ctx.restore();
}

function textBox(t) {
  const lines = String(t.text || "").split("\n");
  const longest = lines.reduce((a, b) => (b.length > a.length ? b : a), "");
  const w = Math.max(20, longest.length * t.size * 0.58);
  const h = Math.max(t.size * 1.2, lines.length * t.size * 1.25);
  return { x: t.x - 4, y: t.y - t.size, w, h };
}

function PaperPreview({ id }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    drawPaper(ctx, id, c.width, c.height);
  }, [id]);
  return <canvas ref={ref} width={150} height={212} />;
}

function drawPaper(ctx, template, w, h) {
  const s = w / PAPER_W;
  ctx.save();
  const BLUE = (a) => `rgba(8,136,248,${a})`;
  const line = (x1, y1, x2, y2, color, lw = 1) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x1 * s, y1 * s);
    ctx.lineTo(x2 * s, y2 * s);
    ctx.stroke();
  };
  const text = (t, x, y, size, color, weight = "500") => {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${Math.max(9, size * s)}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(t, x * s, y * s);
  };
  switch (template) {
    case "blank":
      break;
    case "lined":
      line(64, 0, 64, PAPER_H, "rgba(224,67,67,0.38)");
      for (let y = 96; y < PAPER_H; y += 64) line(0, y, PAPER_W, y, BLUE(0.24));
      break;
    case "narrow":
      line(44, 0, 44, PAPER_H, "rgba(224,67,67,0.38)");
      for (let y = 70; y < PAPER_H; y += 44) line(0, y, PAPER_W, y, BLUE(0.22));
      break;
    case "wide":
      line(92, 0, 92, PAPER_H, "rgba(224,67,67,0.38)");
      for (let y = 120; y < PAPER_H; y += 92) line(0, y, PAPER_W, y, BLUE(0.26));
      break;
    case "handwriting":
      for (let base = 160; base < PAPER_H - 40; base += 96) {
        line(0, base, PAPER_W, base, BLUE(0.3), 1.2);
        ctx.setLineDash([6 * s, 6 * s]);
        line(0, base - 32, PAPER_W, base - 32, BLUE(0.2));
        ctx.setLineDash([]);
        line(0, base - 64, PAPER_W, base - 64, BLUE(0.18));
      }
      break;
    case "gridS":
      for (let x = 0; x <= PAPER_W; x += 44) line(x, 0, x, PAPER_H, BLUE(0.14));
      for (let y = 0; y <= PAPER_H; y += 44) line(0, y, PAPER_W, y, BLUE(0.14));
      break;
    case "gridL":
      for (let x = 0; x <= PAPER_W; x += 88) line(x, 0, x, PAPER_H, BLUE(0.18));
      for (let y = 0; y <= PAPER_H; y += 88) line(0, y, PAPER_W, y, BLUE(0.18));
      break;
    case "dots":
      ctx.fillStyle = BLUE(0.32);
      for (let x = 44; x < PAPER_W; x += 44) {
        for (let y = 44; y < PAPER_H; y += 44) {
          ctx.beginPath();
          ctx.arc(x * s, y * s, Math.max(1.1, 1.4 * s), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    case "graph":
      for (let x = 0; x <= PAPER_W; x += 44) line(x, 0, x, PAPER_H, BLUE(0.1));
      for (let y = 0; y <= PAPER_H; y += 44) line(0, y, PAPER_W, y, BLUE(0.1));
      for (let x = 0; x <= PAPER_W; x += 220) line(x, 0, x, PAPER_H, BLUE(0.26));
      for (let y = 0; y <= PAPER_H; y += 220) line(0, y, PAPER_W, y, BLUE(0.26));
      break;
    case "cornell":
      line(280, 90, 280, 1400, BLUE(0.34), 1.2);
      line(64, 1460, PAPER_W - 64, 1460, BLUE(0.34), 1.2);
      for (let y = 96; y < PAPER_H; y += 64) line(0, y, PAPER_W, y, BLUE(0.2));
      break;
    case "checklist":
      for (let y = 130; y < PAPER_H - 70; y += 76) {
        line(150, y + 38, PAPER_W - 70, y + 38, BLUE(0.2));
        ctx.strokeStyle = BLUE(0.4);
        ctx.lineWidth = 1.4;
        ctx.strokeRect(90 * s, y * s, 36 * s, 36 * s);
      }
      break;
    case "weekly": {
      const cols = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const cw = PAPER_W / 7;
      ctx.fillStyle = BLUE(0.07);
      ctx.fillRect(0, 0, PAPER_W * s, 120 * s);
      cols.forEach((d, i) => text(d, i * cw + 12, 60, 30, BLUE(0.75), "700"));
      for (let i = 0; i <= 7; i++) line(i * cw, 0, i * cw, PAPER_H, BLUE(0.22));
      for (let y = 120; y < PAPER_H; y += 100) line(0, y, PAPER_W, y, BLUE(0.12));
      line(0, 120, PAPER_W, 120, BLUE(0.3));
      break;
    }
    case "monthly": {
      const cw = PAPER_W / 7;
      const cellH = 268;
      text("MONTH", 24, 56, 34, BLUE(0.8), "700");
      line(0, 90, PAPER_W, 90, BLUE(0.3));
      for (let i = 0; i <= 7; i++) line(i * cw, 90, i * cw, PAPER_H, BLUE(0.2));
      for (let r = 0; r <= 5; r++) line(0, 90 + r * cellH, PAPER_W, 90 + r * cellH, BLUE(0.2));
      let day = 1;
      for (let r = 0; r < 5 && day <= 31; r++) {
        for (let c = 0; c < 7 && day <= 31; c++, day++) {
          text(String(day), c * cw + 14, 90 + r * cellH + 34, 26, "rgba(26,34,48,0.55)");
        }
      }
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

function drawStroke(ctx, s) {
  if (s.points.length < 2) {
    drawDot(ctx, s.points[0], s);
    return;
  }
  ctx.save();
  if (s.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "#000";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = s.size * 4;
  } else if (s.tool === "highlighter") {
    ctx.globalAlpha = 0.38;
    ctx.strokeStyle = s.color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = s.size;
  } else {
    ctx.strokeStyle = s.color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = s.size;
  }
  const pts = s.points;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.stroke();
  ctx.restore();
}

function drawDot(ctx, p, s) {
  if (!p) return;
  ctx.save();
  if (s.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(p.x, p.y, s.size * 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.globalAlpha = s.tool === "highlighter" ? 0.38 : 1;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, s.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
