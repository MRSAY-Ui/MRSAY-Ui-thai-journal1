import React, { useState } from "react";
import { Logo, Notebook, Cards, Search, Plus, Trash, Note, Gear, Sun, Moon } from "../icons.jsx";
import {
  createNotebook,
  createDeck,
  deleteNotebook,
  deleteDeck,
  getState,
} from "../store.js";
import Modal from "./Modal.jsx";

const NOTEBOOK_COLORS = ["#0888f8", "#7a5af0", "#d94fa0", "#e04343", "#f09000", "#2fb56d", "#0aa7c8"];

const NOTEBOOK_PATTERNS = ["solid", "gradient", "dots", "stripes", "grid"];

export default function Sidebar({
  view,
  onNavigate,
  query,
  onQuery,
  onDataChange,
  theme,
  onToggleTheme,
}) {
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type, id, name }

  const state = getState();

  const handleCreateNotebook = (name, color, pattern) => {
    const nb = createNotebook(name, color, pattern);
    onDataChange();
    setShowNotebookModal(false);
    onNavigate({ name: "notebook", notebookId: nb.id });
  };

  const handleCreateDeck = (name) => {
    const d = createDeck(name);
    onDataChange();
    setShowDeckModal(false);
    onNavigate({ name: "deck", deckId: d.id });
  };

  const doDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === "notebook") deleteNotebook(confirmDelete.id);
    if (confirmDelete.type === "deck") deleteDeck(confirmDelete.id);
    onDataChange();
    setConfirmDelete(null);
    onNavigate({ name: "dashboard" });
  };

  return (
    <>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <Logo />
          <div>
            <div className="brand-name">thai-journal</div>
            <div className="brand-tag">write · sketch · annotate · study</div>
          </div>
        </div>

        <div className="side-search">
          <span className="search-icon">
            <Search />
          </span>
          <input
            placeholder="Search notes…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </div>

        <button
          className={`nav-item ${view.name === "dashboard" ? "active" : ""}`}
          onClick={() => onNavigate({ name: "dashboard" })}
        >
          <span className="nav-icon">
            <Notebook />
          </span>
          All notebooks
        </button>
        <button
          className={`nav-item ${view.name === "settings" ? "active" : ""}`}
          onClick={() => onNavigate({ name: "settings" })}
        >
          <span className="nav-icon">
            <Gear />
          </span>
          Settings
        </button>

        <div className="side-section">Notebooks</div>
        {state.notebooks.map((nb) => (
          <button
            key={nb.id}
            className={`nav-item ${
              view.name === "notebook" && view.notebookId === nb.id ? "active" : ""
            }`}
            onClick={() => onNavigate({ name: "notebook", notebookId: nb.id })}
          >
            <span className="nb-dot" style={{ background: nb.color }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {nb.name}
            </span>
            <span className="nav-actions">
              <span
                role="button"
                tabIndex={0}
                className="icon-btn danger"
                aria-label={`Delete ${nb.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete({ type: "notebook", id: nb.id, name: nb.name });
                }}
              >
                <Trash />
              </span>
            </span>
          </button>
        ))}
        <button
          className="nav-item"
          onClick={() => setShowNotebookModal(true)}
          style={{ color: "var(--primary)", fontWeight: 600 }}
        >
          <span className="nav-icon">
            <Plus />
          </span>
          New notebook
        </button>

        <div className="side-section">Study</div>
        <button
          className="nav-item"
          onClick={() => onNavigate({ name: "decks" })}
        >
          <span className="nav-icon">
            <Cards />
          </span>
          Flashcards
        </button>
        {state.decks.map((d) => (
          <button
            key={d.id}
            className={`nav-item ${
              view.name === "deck" && view.deckId === d.id ? "active" : ""
            }`}
            onClick={() => onNavigate({ name: "deck", deckId: d.id })}
          >
            <span className="nav-icon">
              <Note />
            </span>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {d.name}
            </span>
            <span className="nav-actions">
              <span
                role="button"
                tabIndex={0}
                className="icon-btn danger"
                aria-label={`Delete ${d.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete({ type: "deck", id: d.id, name: d.name });
                }}
              >
                <Trash />
              </span>
            </span>
          </button>
        ))}
        <button
          className="nav-item"
          onClick={() => setShowDeckModal(true)}
          style={{ color: "var(--primary)", fontWeight: 600 }}
        >
          <span className="nav-icon">
            <Plus />
          </span>
          New deck
        </button>

        <div className="sidebar-footer" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="nav-item" onClick={onToggleTheme} aria-label="Toggle dark mode">
            <span className="nav-icon">
              {theme === "dark" ? <Sun /> : <Moon />}
            </span>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <div style={{ padding: "0 10px" }}>
            Saved locally on this device. No account, no cloud — your notes stay yours.
          </div>
        </div>
      </aside>

      {showNotebookModal && (
        <Modal
          title="New notebook"
          sub="Give your notebook a name and pick a cover color."
          onClose={() => setShowNotebookModal(false)}
        >
          <NotebookForm
            colors={NOTEBOOK_COLORS}
            submitLabel="Create notebook"
            onSubmit={handleCreateNotebook}
            onCancel={() => setShowNotebookModal(false)}
          />
        </Modal>
      )}

      {showDeckModal && (
        <Modal
          title="New flashcard deck"
          sub="Decks hold question-and-answer cards for studying."
          onClose={() => setShowDeckModal(false)}
        >
          <label className="field-label">Deck name</label>
          <input
            className="input"
            autoFocus
            placeholder="e.g. Spanish vocabulary"
            onKeyDown={(e) => e.key === "Enter" && handleCreateDeck(e.target.value)}
          />
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setShowDeckModal(false)}>
              Cancel
            </button>
            <button
              className="btn primary"
              onClick={(e) => handleCreateDeck(e.target.previousElementSibling.previousElementSibling.value)}
            >
              Create deck
            </button>
          </div>
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
    </>
  );
}

function NotebookForm({ colors, submitLabel, onSubmit, onCancel, initialName = "", initialColor = colors[0], initialPattern = "gradient" }) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [pattern, setPattern] = useState(initialPattern);

  return (
    <>
      <label className="field-label">Name</label>
      <input
        className="input"
        autoFocus
        value={name}
        placeholder="e.g. Chemistry notes"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit(name, color, pattern)}
      />
      <label className="field-label">Cover color</label>
      <div className="color-dots">
        {colors.map((c) => (
          <button
            key={c}
            className={`color-dot ${color === c ? "on" : ""}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
            aria-label={`Color ${c}`}
          />
        ))}
      </div>
      <label className="field-label">Cover pattern</label>
      <div className="pattern-chips">
        {NOTEBOOK_PATTERNS.map((p) => (
          <button
            key={p}
            className={`pattern-chip ${pattern === p ? "on" : ""}`}
            data-pattern={p}
            onClick={() => setPattern(p)}
            aria-label={`Pattern ${p}`}
          />
        ))}
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn primary" onClick={() => onSubmit(name, color, pattern)}>
          {submitLabel}
        </button>
      </div>
    </>
  );
}

export { NotebookForm };
