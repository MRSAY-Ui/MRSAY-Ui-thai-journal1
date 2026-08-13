import React, { useEffect, useRef, useState, useCallback } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  Back,
  Pen,
  Highlighter,
  Eraser,
  Undo,
  Redo,
  Trash,
  Pdf,
  Upload,
  Check,
} from "../icons.jsx";
import { uid, updateNote, savePdf, loadPdf, deletePdf } from "../store.js";

GlobalWorkerOptions.workerSrc = workerUrl;

const PEN_COLORS = [
  "#e05252", "#e88a3a", "#e9c442", "#5aa45c",
  "#3ba7a0", "#4c83d6", "#8a63c9", "#d96ba0",
  "#2f2e2b", "#ffffff",
];

const RENDER_WIDTH = 900;

export default function PdfMarkup({ note, onClose, onDataChange }) {
  const [pdfState, setPdfState] = useState({
    loading: !note.pdf ? false : true,
    error: null,
    pages: [], // { index, page, viewport }
  });
  const [fileName, setFileName] = useState(note.pdf?.name || "");
  const [annotations, setAnnotations] = useState(note.pdf?.annotations || []);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [size, setSize] = useState(4);
  const [history, setHistory] = useState({ past: [], future: [] });
  const fileInputRef = useRef(null);
  const annotationsRef = useRef(annotations);
  annotationsRef.current = annotations;

  const loadDocument = useCallback(async (blob) => {
    setPdfState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await blob.arrayBuffer();
      const doc = await getDocument({ data }).promise;
      const scale = 1;
      const first = await doc.getPage(1);
      const vp = first.getViewport({ scale });
      const fitScale = RENDER_WIDTH / vp.width;
      const pages = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: fitScale });
        pages.push({ index: i, page, viewport });
      }
      setPdfState({ loading: false, error: null, pages });
    } catch (err) {
      console.error(err);
      setPdfState({ loading: false, error: "Could not open this PDF. Please try another file." });
    }
  }, []);

  const importPdf = async (file) => {
    if (!file || file.type !== "application/pdf") {
      setPdfState((s) => ({ ...s, error: "Please choose a PDF file." }));
      return;
    }
    const id = uid();
    await savePdf(id, file);
    const annotationsList = note.pdf?.annotations || [];
    updateNote(note.id, { pdf: { id, name: file.name, annotations: annotationsList } });
    setFileName(file.name);
    onDataChange();
    await loadDocument(file);
  };

  useEffect(() => {
    if (note.pdf?.id && pdfState.pages.length === 0 && !pdfState.loading && !pdfState.error) {
      loadPdf(note.pdf.id).then((blob) => {
        if (blob) loadDocument(blob);
        else {
          updateNote(note.id, { pdf: null });
          onDataChange();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.pdf?.id]);

  const changeStrokes = (pageIndex, nextStrokes) => {
    const next = [...annotationsRef.current];
    next[pageIndex] = nextStrokes;
    setAnnotations(next);
    annotationsRef.current = next;
    updateNote(note.id, { pdf: { ...note.pdf, annotations: next } });
    onDataChange();
  };

  const undo = () => {
    // undo last stroke across pages: find last stroke anywhere
    const flat = annotationsRef.current.flat();
    if (!flat.length) return;
    const withIdx = [];
    annotationsRef.current.forEach((arr, i) => arr.forEach((s) => withIdx.push({ i, s })));
    const last = withIdx[withIdx.length - 1];
    const next = annotationsRef.current.map((arr) => [...arr]);
    next[last.i] = next[last.i].filter((s) => s !== last.s);
    setAnnotations(next);
    annotationsRef.current = next;
    updateNote(note.id, { pdf: { ...note.pdf, annotations: next } });
    onDataChange();
  };

  const clearAll = () => {
    const next = annotationsRef.current.map((arr) => []);
    setAnnotations(next);
    annotationsRef.current = next;
    updateNote(note.id, { pdf: { ...note.pdf, annotations: next } });
    onDataChange();
  };

  const removePdf = async () => {
    if (note.pdf?.id) await deletePdf(note.pdf.id);
    updateNote(note.id, { pdf: null });
    onDataChange();
    onClose();
  };

  const pageCount = pdfState.pages.length;
  const annotatedCount = annotations.flat().length;

  return (
    <div className="pdf-screen">
      <div className="pdf-topbar">
        <button className="btn sm" onClick={onClose}>
          <Back /> Done
        </button>
        <span style={{ fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {fileName || note.pdf?.name || "PDF markup"}
        </span>
        <span style={{ opacity: 0.7, fontSize: 13 }}>
          {pageCount ? `${pageCount} pages · ${annotatedCount} strokes` : ""}
        </span>
        <div className="spacer" />

        {pdfState.pages.length > 0 && (
          <div className="canvas-tools" style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.15)" }}>
            <div className="tool-group">
              {[
                { id: "pen", icon: Pen, label: "Pen" },
                { id: "highlighter", icon: Highlighter, label: "Highlighter" },
                { id: "eraser", icon: Eraser, label: "Eraser" },
              ].map((t) => (
                <button
                  key={t.id}
                  className={`tool ${tool === t.id ? "on" : ""}`}
                  style={tool === t.id ? { background: "rgba(90,143,123,0.35)", color: "#fff" } : { color: "#d8d2c2" }}
                  onClick={() => setTool(t.id)}
                  title={t.label}
                >
                  <t.icon />
                </button>
              ))}
            </div>
            <div className="tool-group">
              {PEN_COLORS.map((c) => (
                <button
                  key={c}
                  className={`pen-swatch ${color === c ? "on" : ""}`}
                  style={{ color: c, background: c === "#ffffff" || c === "#e9c442" ? "rgba(255,255,255,0.08)" : undefined }}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                >
                  <span className="dot" />
                </button>
              ))}
            </div>
            <div className="tool-group stroke-size" style={{ color: "#d8d2c2" }}>
              <input
                type="range"
                min="1"
                max="24"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {pdfState.pages.length > 0 && (
          <>
            <button className="btn sm" onClick={undo} title="Remove last stroke">
              <Undo /> Undo
            </button>
            <button className="btn sm" onClick={clearAll} title="Clear annotations">
              <Trash /> Clear
            </button>
          </>
        )}
        <button className="btn sm primary" onClick={() => fileInputRef.current?.click()}>
          <Upload /> {note.pdf ? "Replace" : "Import PDF"}
        </button>
        {note.pdf && (
          <button className="btn sm" onClick={removePdf} title="Remove this PDF">
            Remove
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importPdf(f);
            e.target.value = "";
          }}
        />
      </div>

      {pdfState.loading && (
        <div className="pdf-drop">
          <span className="big-icon"><Pdf /></span>
          <div>Opening PDF…</div>
        </div>
      )}

      {!pdfState.loading && pdfState.error && !note.pdf && (
        <div className="pdf-drop">
          <span className="big-icon"><Pdf /></span>
          <div>{pdfState.error}</div>
          <button className="btn primary" onClick={() => fileInputRef.current?.click()}>
            <Upload /> Choose a PDF
          </button>
        </div>
      )}

      {!pdfState.loading && pdfState.pages.length === 0 && !pdfState.error && (
        <div className="pdf-drop">
          <span className="big-icon"><Pdf /></span>
          <div style={{ maxWidth: 420 }}>
            <strong>Import a PDF to mark up</strong>
            <p style={{ opacity: 0.8, fontSize: 13.5, margin: "8px 0 0" }}>
              Upload any PDF — worksheets, lecture slides, forms — then annotate it with pens and highlighters.
              The document stays on your device.
            </p>
          </div>
          <button className="btn primary" onClick={() => fileInputRef.current?.click()}>
            <Upload /> Choose a PDF
          </button>
        </div>
      )}

      {!pdfState.loading && pdfState.pages.length > 0 && (
        <div className="pdf-pages">
          {pdfState.pages.map((p, i) => (
            <AnnotatedPage
              key={p.index}
              page={p.page}
              viewport={p.viewport}
              strokes={annotations[i] || []}
              onStrokes={(next) => changeStrokes(i, next)}
              tool={tool}
              color={color}
              size={size}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AnnotatedPage({ page, viewport, strokes, onStrokes, tool, color, size }) {
  const pdfCanvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [renderState, setRenderState] = useState("pending"); // pending | done
  const currentRef = useRef(null);
  const drawingRef = useRef(false);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  useEffect(() => {
    let cancelled = false;
    let task = null;
    (async () => {
      try {
        task = page.render({
          canvasContext: pdfCanvasRef.current.getContext("2d"),
          viewport,
        });
        await task.promise;
        if (!cancelled) setRenderState("done");
      } catch (err) {
        if (!cancelled && err?.name !== "RenderingCancelledException") console.error(err);
      }
    })();
    return () => {
      cancelled = true;
      if (task) task.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, viewport]);

  const redraw = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of strokesRef.current) drawStroke(ctx, s);
    if (currentRef.current) drawStroke(ctx, currentRef.current);
  }, []);

  useEffect(() => {
    redraw();
  }, [strokes, redraw]);

  const toLocal = (e) => {
    const canvas = overlayRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const onPointerDown = (e) => {
    if (renderState !== "done") return;
    e.preventDefault();
    overlayRef.current.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = toLocal(e);
    const t = tool === "eraser" ? "eraser" : tool;
    const opts = { tool: t, color, size: t === "highlighter" ? Math.max(size * 2.2, 14) : size };
    currentRef.current = { ...opts, points: [p] };
    redraw();
  };

  const onPointerMove = (e) => {
    if (!drawingRef.current) return;
    const p = toLocal(e);
    const cur = currentRef.current;
    const last = cur.points[cur.points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < 2.5) return;
    cur.points.push(p);
    redraw();
  };

  const onPointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const cur = currentRef.current;
    currentRef.current = null;
    if (cur && cur.points.length > 0) {
      onStrokes([...strokesRef.current, cur]);
    }
    redraw();
  };

  return (
    <div className="pdf-page">
      <canvas
        ref={pdfCanvasRef}
        width={Math.ceil(viewport.width)}
        height={Math.ceil(viewport.height)}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
      {renderState === "done" && (
        <canvas
          ref={overlayRef}
          width={Math.ceil(viewport.width)}
          height={Math.ceil(viewport.height)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            cursor: tool === "eraser" ? "cell" : "crosshair",
            touchAction: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      )}
    </div>
  );
}

function drawStroke(ctx, s) {
  if (s.points.length < 2) {
    if (!s.points[0]) return;
    ctx.save();
    if (s.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(s.points[0].x, s.points[0].y, s.size * 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalAlpha = s.tool === "highlighter" ? 0.38 : 1;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.points[0].x, s.points[0].y, s.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
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
