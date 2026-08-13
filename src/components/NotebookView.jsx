import React, { useState } from "react";
import Modal from "./Modal.jsx";
import { NotebookForm } from "./Sidebar.jsx";
import { Back, Plus, Trash, Note, Pen, Pdf, Star, Search } from "../icons.jsx";
import {
  getState,
  createNote,
  renameNotebook,
  deleteNotebook,
  deleteNote,
  formatDate,
} from "../store.js";

const NOTEBOOK_COLORS = ["#0888f8", "#7a5af0", "#d94fa0", "#e04343", "#f09000", "#2fb56d", "#0aa7c8"];

export default function NotebookView({ notebookId, onNavigate, onDataChange }) {
  const state = getState();
  const nb = state.notebooks.find((n) => n.id === notebookId);
  const [showRename, setShowRename] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // notebook or note

  if (!nb) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Notebook not found</h3>
          <button className="btn" onClick={() => onNavigate({ name: "dashboard" })}>
            <Back /> Back to notebooks
          </button>
        </div>
      </div>
    );
  }

  const notes = state.notes
    .filter((n) => n.notebookId === notebookId)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const handleNew = () => {
    const note = createNote(notebookId, nb.color);
    onDataChange();
    onNavigate({ name: "note", noteId: note.id });
  };

  const stripHtml = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html || "";
    return div.textContent || "";
  };

  const doDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "notebook") {
      deleteNotebook(confirmDelete.id);
      onNavigate({ name: "dashboard" });
    } else {
      deleteNote(confirmDelete.id);
    }
    onDataChange();
    setConfirmDelete(null);
  };

  return (
    <div className="page">
      <div className="page-head">
        <button
          className="icon-btn"
          style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
          onClick={() => onNavigate({ name: "dashboard" })}
          aria-label="Back"
        >
          <Back />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="nb-dot" style={{ width: 12, height: 12, borderRadius: 4, background: nb.color, display: "inline-block" }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {nb.name}
            </span>
          </h1>
          <div className="sub">
            {notes.length} note{notes.length === 1 ? "" : "s"} · edited{" "}
            {notes.length ? formatDate(Math.max(...notes.map((n) => n.updatedAt))) : "never"}
          </div>
        </div>
        <button className="btn ghost" onClick={() => setShowRename(true)}>
          Rename
        </button>
        <button className="btn primary" onClick={handleNew}>
          <Plus /> New note
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <Note />
          </span>
          <h3>This notebook is empty</h3>
          <p>Write a note, sketch an idea, or mark up a PDF.</p>
          <button className="btn primary" onClick={handleNew}>
            <Plus /> New note
          </button>
        </div>
      ) : (
        <div className="grid">
          {notes.map((n) => (
            <div
              key={n.id}
              className="card page-thumb"
              onClick={() => onNavigate({ name: "note", noteId: n.id })}
            >
              <div className="thumb-head" style={{ background: n.color }}>
                {n.starred && (
                  <span style={{ color: "rgba(255,255,255,0.92)" }}>
                    <Star filled />
                  </span>
                )}
                <span className="thumb-head-title">{n.title || "Untitled note"}</span>
              </div>
              <div className="thumb-body">
                <div className="thumb-snippet">{stripHtml(n.body).slice(0, 110) || "—"}</div>
                <div className="thumb-meta">
                  <span>{formatDate(n.updatedAt)}</span>
                  {n.drawing && (
                    <span className="chip">
                      <Pen /> sketch
                    </span>
                  )}
                  {n.pdf && (
                    <span className="chip">
                      <Pdf /> pdf
                    </span>
                  )}
                </div>
              </div>
              <div className="card-menu">
                <button
                  className="icon-btn danger"
                  aria-label={`Delete ${n.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete({ type: "note", id: n.id, name: n.title });
                  }}
                >
                  <Trash />
                </button>
              </div>
            </div>
          ))}
          <button className="card new-card" onClick={handleNew}>
            <Plus />
            New note
          </button>
        </div>
      )}

      {showRename && (
        <Modal
          title="Rename notebook"
          sub={`Current name: “${nb.name}”`}
          onClose={() => setShowRename(false)}
        >
          <NotebookForm
            colors={NOTEBOOK_COLORS}
            submitLabel="Save"
            initialName={nb.name}
            initialColor={nb.color}
            initialPattern={nb.pattern || "gradient"}
            onSubmit={(name, color, pattern) => {
              renameNotebook(nb.id, name, color, pattern);
              onDataChange();
              setShowRename(false);
            }}
            onCancel={() => setShowRename(false)}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          title={`Delete ${confirmDelete.type === "notebook" ? "notebook" : "note"}?`}
          sub={`“${confirmDelete.name || "Untitled"}” will be removed permanently.`}
          onClose={() => setConfirmDelete(null)}
        >
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setConfirmDelete(null)}>
              Cancel
            </button>
            <button className="btn danger" onClick={doDelete}>
              <Trash /> Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
