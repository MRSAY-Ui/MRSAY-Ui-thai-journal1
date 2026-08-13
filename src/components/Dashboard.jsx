import React, { useState } from "react";
import Modal from "./Modal.jsx";
import { NotebookForm } from "./Sidebar.jsx";
import {
  Notebook,
  Cards,
  Note,
  Plus,
  Trash,
  Search,
  Star,
} from "../icons.jsx";
import {
  formatDate,
  getState,
  createNotebook,
  deleteNotebook,
  deleteDeck,
} from "../store.js";

const NOTEBOOK_COLORS = ["#0888f8", "#7a5af0", "#d94fa0", "#e04343", "#f09000", "#2fb56d", "#0aa7c8"];

export default function Dashboard({ query, onQuery, onNavigate, onDataChange }) {
  const state = getState();
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const results = searching
    ? state.notes
        .filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            stripHtml(n.body).toLowerCase().includes(q)
        )
        .slice(0, 12)
    : [];

  const recentNotes = [...state.notes]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 6);

  const notebookOf = (id) => state.notebooks.find((n) => n.id === id);

  const doDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "notebook") deleteNotebook(confirmDelete.id);
    if (confirmDelete.type === "deck") deleteDeck(confirmDelete.id);
    onDataChange();
    setConfirmDelete(null);
  };

  return (
    <div className="page">
      <div className="hero">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1>{searching ? `Results for “${query}”` : "Notes storage"}</h1>
            <div className="sub">
              {searching
                ? `${results.length} note${results.length === 1 ? "" : "s"} found`
                : `${state.notebooks.length} notebook${state.notebooks.length === 1 ? "" : "s"} · ${state.notes.length} note${state.notes.length === 1 ? "" : "s"} · ${state.decks.length} deck${state.decks.length === 1 ? "" : "s"}`}
            </div>
          </div>
          <button className="btn primary" onClick={() => setShowNotebookModal(true)}>
            <Plus /> New notebook
          </button>
        </div>
        <div className="hero-search">
          <span className="search-icon">
            <Search />
          </span>
          <input
            placeholder="Search your notes…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </div>
      </div>

      {searching ? (
        <div className="search-results">
          {results.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">
                <Search />
              </span>
              <h3>No notes match “{query}”</h3>
              <p>Try a different word or check the spelling.</p>
            </div>
          )}
          {results.map((n) => {
            const nb = notebookOf(n.notebookId);
            return (
              <div
                key={n.id}
                className="result-item"
                onClick={() => onNavigate({ name: "note", noteId: n.id })}
              >
                <span style={{ color: nb?.color || "var(--muted)", fontSize: 20 }}>
                  <Note />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="result-title">
                    {highlight(n.title, query)}
                    {n.starred && (
                      <span style={{ color: "var(--gold)", marginLeft: 6 }}>
                        <Star filled />
                      </span>
                    )}
                  </div>
                  <div className="result-snippet">
                    {highlight(stripHtml(n.body).slice(0, 120), query) || "—"}
                  </div>
                </div>
                <span style={{ color: "var(--muted)", fontSize: 12, whiteSpace: "nowrap" }}>
                  {formatDate(n.updatedAt)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="grid">
            {state.notebooks.map((nb) => {
              const count = state.notes.filter((n) => n.notebookId === nb.id).length;
              return (
                <div
                  key={nb.id}
                  className="card nb-cover"
                  style={{ "--cover": nb.color }}
                  data-pattern={nb.pattern || "gradient"}
                  onClick={() => onNavigate({ name: "notebook", notebookId: nb.id })}
                >
                  <div className="nb-spine" />
                  <span className="nb-star">
                    <Star filled />
                  </span>
                  <div className="nb-cover-body">
                    <div className="nb-cover-title">{nb.name}</div>
                    <div className="nb-cover-meta">
                      {count} note{count === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="card-menu">
                    <button
                      className="icon-btn danger"
                      aria-label={`Delete ${nb.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete({ type: "notebook", id: nb.id, name: nb.name });
                      }}
                    >
                      <Trash />
                    </button>
                  </div>
                </div>
              );
            })}
            <button className="card new-card" onClick={() => setShowNotebookModal(true)}>
              <Plus />
              New notebook
            </button>
          </div>

          {state.decks.length > 0 && (
            <>
              <div className="page-head" style={{ marginTop: 40, marginBottom: 14 }}>
                <div>
                  <h1 style={{ fontSize: 20 }}>Flashcard decks</h1>
                  <div className="sub">Study with flip cards</div>
                </div>
              </div>
              <div className="grid">
                {state.decks.map((d) => (
                  <div
                    key={d.id}
                    className="card"
                    onClick={() => onNavigate({ name: "deck", deckId: d.id })}
                  >
                    <div className="card-accent" style={{ background: "var(--gold)" }} />
                    <div className="card-body">
                      <div className="card-title">{d.name}</div>
                      <div className="card-sub">
                        {d.cards.length} card{d.cards.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="card-menu">
                      <button
                        className="icon-btn danger"
                        aria-label={`Delete ${d.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete({ type: "deck", id: d.id, name: d.name });
                        }}
                      >
                        <Trash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {recentNotes.length > 0 && (
            <>
              <div className="page-head" style={{ marginTop: 40, marginBottom: 14 }}>
                <div>
                  <h1 style={{ fontSize: 20 }}>Recent notes</h1>
                  <div className="sub">Jump back into your latest writing</div>
                </div>
              </div>
              <div className="grid">
                {recentNotes.map((n) => {
                  const nb = notebookOf(n.notebookId);
                  return (
                    <div
                      key={n.id}
                      className="card"
                      onClick={() => onNavigate({ name: "note", noteId: n.id })}
                    >
                      <div className="card-accent" style={{ background: n.color }} />
                      <div className="card-body">
                        <div className="card-title">
                          {n.starred && (
                            <span style={{ color: "var(--gold)", marginRight: 4 }}>
                              <Star filled />
                            </span>
                          )}
                          {n.title}
                        </div>
                        <div className="card-sub">
                          <span>{nb ? nb.name : "—"}</span>
                          <span>·</span>
                          <span>{formatDate(n.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {state.notes.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">
                <Notebook />
              </span>
              <h3>Nothing here yet</h3>
              <p>Create your first notebook to get started.</p>
            </div>
          )}
        </>
      )}

      {showNotebookModal && (
        <Modal
          title="New notebook"
          sub="Give your notebook a name and pick a cover color."
          onClose={() => setShowNotebookModal(false)}
        >
          <NotebookForm
            colors={NOTEBOOK_COLORS}
            submitLabel="Create notebook"
            onSubmit={(name, color, pattern) => {
              const nb = createNotebook(name, color, pattern);
              onDataChange();
              setShowNotebookModal(false);
              onNavigate({ name: "notebook", notebookId: nb.id });
            }}
            onCancel={() => setShowNotebookModal(false)}
          />
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          title={`Delete ${confirmDelete.type === "notebook" ? "notebook" : "deck"}?`}
          sub={`"${confirmDelete.name}" and everything inside it will be removed permanently.`}
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

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return div.textContent || "";
}

function highlight(text, q) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}
