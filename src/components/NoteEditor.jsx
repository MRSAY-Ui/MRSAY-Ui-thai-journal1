import React, { useEffect, useRef, useState } from "react";
import {
  Back,
  Bold,
  Italic,
  Underline,
  List,
  H,
  Pen,
  Pdf,
  Star,
  Trash,
  Layers,
  Download,
  Upload,
} from "../icons.jsx";
import { getState, updateNote, deleteNote, createNote, formatDate } from "../store.js";

const NOTE_COLORS = ["#5a8f7b", "#4c83d6", "#8a63c9", "#d96ba0", "#e05252", "#e88a3a", "#3ba7a0"];

export default function NoteEditor({ noteId, onNavigate, onDataChange, onOpenDrawing, onOpenPdf }) {
  const state = getState();
  const note = state.notes.find((n) => n.id === noteId);
  const [title, setTitle] = useState(note?.title || "");
  const [starred, setStarred] = useState(note?.starred || false);
  const [color, setColor] = useState(note?.color || NOTE_COLORS[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const contentRef = useRef(null);
  const saveTimer = useRef(null);
  const importRef = useRef(null);

  useEffect(() => {
    if (contentRef.current && document.activeElement !== contentRef.current) {
      contentRef.current.innerHTML = note?.body || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  useEffect(() => {
    return () => clearTimeout(saveTimer.current);
  }, []);

  if (!note) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Note not found</h3>
          <button className="btn" onClick={() => onNavigate({ name: "dashboard" })}>
            <Back /> Back
          </button>
        </div>
      </div>
    );
  }

  const queueSave = (patch) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateNote(note.id, patch);
      onDataChange();
    }, 250);
  };

  const exec = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    onInput();
  };

  const onInput = () => {
    const body = contentRef.current.innerHTML;
    queueSave({ body });
  };

  const onTitle = (e) => {
    setTitle(e.target.value);
    queueSave({ title: e.target.value });
  };

  const toggleStar = () => {
    const next = !starred;
    setStarred(next);
    updateNote(note.id, { starred: next });
    onDataChange();
  };

  const pickColor = (c) => {
    setColor(c);
    updateNote(note.id, { color: c });
    onDataChange();
  };

  const doDelete = () => {
    deleteNote(note.id);
    onDataChange();
    onNavigate({ name: "notebook", notebookId: note.notebookId });
  };

  const exportNote = () => {
    const payload = {
      app: "thai-journal",
      type: "note",
      version: 1,
      title: note.title,
      body: note.body,
      color: note.color,
      paper: note.paper || "blank",
      drawing: note.drawing || null,
      pdf: note.pdf ? { name: note.pdf.name } : null,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(note.title || "note").replace(/[^\w]+/g, "-")}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const importNoteFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || data.type !== "note") throw new Error("this is not a thai-journal note file");
        const n = createNote(note.notebookId, data.color || note.color);
        updateNote(n.id, {
          title: data.title || "Imported note",
          body: data.body || "",
          paper: data.paper || "blank",
          color: data.color || note.color,
          drawing: data.drawing || null,
        });
        onDataChange();
        onNavigate({ name: "note", noteId: n.id });
      } catch (err) {
        alert("Could not import that file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const isActive = (cmd, value) => {
    try {
      return document.queryCommandState(cmd);
    } catch {
      return false;
    }
  };

  return (
    <div className="page editor-wrap">
      <div className="page-head" style={{ marginBottom: 8 }}>
        <button
          className="icon-btn"
          style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
          onClick={() => onNavigate({ name: "notebook", notebookId: note.notebookId })}
          aria-label="Back to notebook"
        >
          <Back />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sub" style={{ margin: 0 }}>
            {formatDate(note.updatedAt)} · edited
          </div>
        </div>
        <button
          className={`icon-btn ${starred ? "" : ""}`}
          style={starred ? { color: "var(--gold)" } : undefined}
          onClick={toggleStar}
          aria-label={starred ? "Unstar note" : "Star note"}
        >
          <Star filled={starred} />
        </button>
        <button className="icon-btn" onClick={exportNote} title="Export note as a file" aria-label="Export note">
          <Download />
        </button>
        <button className="icon-btn" onClick={() => importRef.current?.click()} title="Import a note file" aria-label="Import note">
          <Upload />
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={(e) => {
            importNoteFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          className="icon-btn danger"
          onClick={() => setConfirmDelete(true)}
          aria-label="Delete note"
        >
          <Trash />
        </button>
      </div>

      <input
        className="editor-title-input"
        value={title}
        placeholder="Untitled note"
        onChange={onTitle}
      />

      <div className="editor-dock">
        <select
          className="h-select"
          defaultValue="p"
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") exec("formatBlock", "<p>");
            else if (v === "h2") exec("formatBlock", "<h2>");
            else if (v === "h3") exec("formatBlock", "<h3>");
            e.target.value = "p";
          }}
        >
          <option value="p">Body</option>
          <option value="h2">Heading</option>
          <option value="h3">Subheading</option>
        </select>
        <span className="sep" />
        <button className={`tool ${isActive("bold") ? "on" : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} title="Bold">
          <Bold />
        </button>
        <button className={`tool ${isActive("italic") ? "on" : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} title="Italic">
          <Italic />
        </button>
        <button className={`tool ${isActive("underline") ? "on" : ""}`} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} title="Underline">
          <Underline />
        </button>
        <span className="sep" />
        <button className="tool" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")} title="Bulleted list">
          <List />
        </button>
        <span className="sep" />
        <button
          className="tool"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("foreColor", "#e05252")}
          title="Red text"
        >
          <H style={{ color: "#e05252" }} />
        </button>
        <button
          className="tool"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("foreColor", "#5a8f7b")}
          title="Green text"
        >
          <H style={{ color: "#5a8f7b" }} />
        </button>
        <button
          className="tool"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("foreColor", "#4c83d6")}
          title="Blue text"
        >
          <H style={{ color: "#4c83d6" }} />
        </button>
        <button
          className="tool"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => exec("foreColor", "#2f2e2b")}
          title="Reset color"
        >
          <H />
        </button>
        <span className="sep" />
        <span className="paper-chips" title="Paper texture">
          {[
            { id: "blank", label: "Plain" },
            { id: "lined", label: "Lined" },
            { id: "grid", label: "Grid" },
            { id: "dotted", label: "Dots" },
          ].map((p) => (
            <button
              key={p.id}
              className={`paper-chip ${(note.paper || "blank") === p.id ? "on" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                updateNote(note.id, { paper: p.id });
                onDataChange();
              }}
            >
              {p.label}
            </button>
          ))}
        </span>
        <span className="sep" />
        <span className="color-dots" title="Note color">
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              className={`color-dot ${color === c ? "on" : ""}`}
              style={{ background: c }}
              onClick={() => pickColor(c)}
              aria-label={`Note color ${c}`}
            />
          ))}
        </span>
        <span className="chip" style={{ marginLeft: 6 }}>
          <Layers /> saved locally
        </span>
      </div>

      <div className={`editor-paper p-${note.paper || "blank"}`}>
        <div
          ref={contentRef}
          className="editor-content"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Start writing…"
          onInput={onInput}
        />
      </div>

      <div className="attachments">
        {note.drawing && (
          <div className="attach-card" onClick={() => onOpenDrawing(note)} role="button" tabIndex={0}>
            <span className="attach-icon">
              <Pen />
            </span>
            <div>
              <div className="attach-name">Sketch</div>
              <div className="attach-meta">Open drawing pad</div>
            </div>
          </div>
        )}
        {note.pdf && (
          <div className="attach-card" onClick={() => onOpenPdf(note)} role="button" tabIndex={0}>
            <span className="attach-icon">
              <Pdf />
            </span>
            <div>
              <div className="attach-name">PDF markup</div>
              <div className="attach-meta">{note.pdf.name}</div>
            </div>
          </div>
        )}
        {!note.drawing && (
          <button className="attach-add" onClick={() => onOpenDrawing(note)}>
            <Pen /> Sketch a drawing
          </button>
        )}
        {!note.pdf && (
          <button className="attach-add" onClick={() => onOpenPdf(note)}>
            <Pdf /> Annotate a PDF
          </button>
        )}
      </div>

      {confirmDelete && (
        <div className="modal-backdrop" onClick={() => setConfirmDelete(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete note?</h3>
            <div className="modal-sub">“{note.title || "Untitled note"}” will be removed permanently.</div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button className="btn danger" onClick={doDelete}>
                <Trash /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
