import React, { useState } from "react";
import Modal from "./Modal.jsx";
import {
  Back,
  Plus,
  Trash,
  Cards,
  ArrowRight,
  ArrowLeft,
  Check,
  Close,
} from "../icons.jsx";
import {
  getState,
  createDeck,
  createDeckCard,
  updateDeck,
  deleteDeck,
  deleteDeckCard,
} from "../store.js";

export default function Flashcards({ view, onNavigate, onDataChange }) {
  if (view.name === "deck") {
    return <DeckDetail deckId={view.deckId} onNavigate={onNavigate} onDataChange={onDataChange} />;
  }
  return <DeckList onNavigate={onNavigate} onDataChange={onDataChange} />;
}

function DeckList({ onNavigate, onDataChange }) {
  const state = getState();
  const [showNew, setShowNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Flashcards</h1>
          <div className="sub">
            {state.decks.length} deck{state.decks.length === 1 ? "" : "s"} · build cards, flip and study
          </div>
        </div>
        <button className="btn primary" onClick={() => setShowNew(true)}>
          <Plus /> New deck
        </button>
      </div>

      {state.decks.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon"><Cards /></span>
          <h3>No decks yet</h3>
          <p>Create a deck, add question-and-answer cards, and quiz yourself.</p>
          <button className="btn primary" onClick={() => setShowNew(true)}>
            <Plus /> New deck
          </button>
        </div>
      ) : (
        <div className="grid">
          {state.decks.map((d) => (
            <div key={d.id} className="card" onClick={() => onNavigate({ name: "deck", deckId: d.id })}>
              <div className="card-accent" style={{ background: "var(--gold)" }} />
              <div className="card-body">
                <div className="card-title">{d.name}</div>
                <div className="card-sub">{d.cards.length} card{d.cards.length === 1 ? "" : "s"}</div>
              </div>
              <div className="card-menu">
                <button
                  className="icon-btn danger"
                  aria-label={`Delete ${d.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(d);
                  }}
                >
                  <Trash />
                </button>
              </div>
            </div>
          ))}
          <button className="card new-card" onClick={() => setShowNew(true)}>
            <Plus />
            New deck
          </button>
        </div>
      )}

      {showNew && (
        <Modal title="New deck" sub="A deck is a set of question-and-answer cards." onClose={() => setShowNew(false)}>
          <label className="field-label">Deck name</label>
          <input
            className="input"
            autoFocus
            placeholder="e.g. Spanish vocabulary"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const d = createDeck(e.target.value);
                onDataChange();
                setShowNew(false);
                onNavigate({ name: "deck", deckId: d.id });
              }
            }}
          />
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setShowNew(false)}>Cancel</button>
            <button
              className="btn primary"
              onClick={(e) => {
                const input = e.target.closest(".modal").querySelector("input");
                const d = createDeck(input.value);
                onDataChange();
                setShowNew(false);
                onNavigate({ name: "deck", deckId: d.id });
              }}
            >
              Create deck
            </button>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal
          title="Delete deck?"
          sub={`“${confirmDelete.name}” and its cards will be removed permanently.`}
          onClose={() => setConfirmDelete(null)}
        >
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button
              className="btn danger"
              onClick={() => {
                deleteDeck(confirmDelete.id);
                onDataChange();
                setConfirmDelete(null);
              }}
            >
              <Trash /> Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DeckDetail({ deckId, onNavigate, onDataChange }) {
  const state = getState();
  const deck = state.decks.find((d) => d.id === deckId);
  const [studying, setStudying] = useState(false);
  const [editing, setEditing] = useState(null); // card being edited or "new"
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (!deck) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Deck not found</h3>
          <button className="btn" onClick={() => onNavigate({ name: "decks" })}>
            <Back /> Back to decks
          </button>
        </div>
      </div>
    );
  }

  if (studying) {
    return (
      <StudyMode
        deck={deck}
        onExit={() => setStudying(false)}
        onDataChange={onDataChange}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <button
          className="icon-btn"
          style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
          onClick={() => onNavigate({ name: "decks" })}
          aria-label="Back"
        >
          <Back />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deck.name}</h1>
          <div className="sub">{deck.cards.length} card{deck.cards.length === 1 ? "" : "s"}</div>
        </div>
        <button
          className="btn primary"
          disabled={deck.cards.length === 0}
          onClick={() => setStudying(true)}
        >
          Study
        </button>
        <button className="btn" onClick={() => setEditing("new")}>
          <Plus /> Add card
        </button>
      </div>

      {deck.cards.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon"><Cards /></span>
          <h3>No cards yet</h3>
          <p>Add a card — put the question on the front and the answer on the back.</p>
          <button className="btn primary" onClick={() => setEditing("new")}>
            <Plus /> Add card
          </button>
        </div>
      ) : (
        <div className="card-list">
          {deck.cards.map((c, i) => (
            <div key={c.id} className="card-row">
              <span className="num">{i + 1}</span>
              <div className="card-front">{c.front || "—"}</div>
              <div className="card-back">{c.back || "—"}</div>
              <button className="icon-btn" onClick={() => setEditing(c)} title="Edit card">
                <Back style={{ transform: "scaleX(-1)" }} />
              </button>
              <button
                className="icon-btn danger"
                onClick={() => setConfirmDelete(c)}
                title="Delete card"
              >
                <Trash />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <CardEditor
          deck={deck}
          card={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onDataChange={onDataChange}
        />
      )}

      {confirmDelete && (
        <Modal
          title="Delete card?"
          sub={`“${confirmDelete.front || "Untitled card"}” will be removed.`}
          onClose={() => setConfirmDelete(null)}
        >
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button
              className="btn danger"
              onClick={() => {
                deleteDeckCard(deck.id, confirmDelete.id);
                onDataChange();
                setConfirmDelete(null);
              }}
            >
              <Trash /> Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CardEditor({ deck, card, onClose, onDataChange }) {
  const [front, setFront] = useState(card?.front || "");
  const [back, setBack] = useState(card?.back || "");

  const save = () => {
    createDeckCard(deck.id, front, back, card?.id);
    onDataChange();
    onClose();
  };

  return (
    <Modal title={card ? "Edit card" : "New card"} sub="Front is the question, back is the answer." onClose={onClose}>
      <label className="field-label">Front</label>
      <textarea
        className="textarea"
        autoFocus
        value={front}
        placeholder="Question…"
        onChange={(e) => setFront(e.target.value)}
      />
      <label className="field-label">Back</label>
      <textarea
        className="textarea"
        value={back}
        placeholder="Answer…"
        onChange={(e) => setBack(e.target.value)}
      />
      <div className="modal-actions">
        <button className="btn ghost" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={save} disabled={!front.trim() && !back.trim()}>
          <Check /> {card ? "Save" : "Add card"}
        </button>
      </div>
    </Modal>
  );
}

function StudyMode({ deck, onExit, onDataChange }) {
  const [order, setOrder] = useState(() => shuffle(deck.cards));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState([]); // "got" | "learning"

  const card = order[index];
  const done = results.length;
  const total = order.length;
  const finished = done === total;

  const answer = (grade) => {
    setResults([...results, grade]);
    setFlipped(false);
    if (index + 1 < total) setIndex(index + 1);
  };

  const restart = () => {
    setOrder(shuffle(deck.cards));
    setIndex(0);
    setResults([]);
    setFlipped(false);
  };

  if (finished) {
    const got = results.filter((r) => r === "got").length;
    const pct = Math.round((got / total) * 100);
    return (
      <div className="page">
        <div className="study-result">
          <div className="emoji">{pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📚"}</div>
          <h2>Session complete!</h2>
          <p style={{ color: "var(--muted)" }}>
            You got {got} of {total} cards ({pct}%).
          </p>
          <div className="study-controls" style={{ justifyContent: "center", marginTop: 18 }}>
            <button className="btn" onClick={restart}>
              Study again
            </button>
            <button className="btn primary" onClick={onExit}>
              Back to deck
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="deck-toolbar">
        <button className="icon-btn" style={{ border: "1px solid var(--line)", background: "var(--surface)" }} onClick={onExit} aria-label="Exit study">
          <Close />
        </button>
        <div>
          <div style={{ fontWeight: 700 }}>{deck.name}</div>
          <div className="sub" style={{ margin: 0 }}>
            Card {index + 1} of {total}
          </div>
        </div>
        <div className="spacer" />
        <span className="chip">
          {done} answered
        </span>
      </div>

      <div className="study-stage">
        <div className="progress-track">
          <div className="bar" style={{ width: `${(done / total) * 100}%` }} />
        </div>

        <div className="flip-scene">
          <div className={`flip-card ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(true)}>
            <div className="flip-face front">
              <span className="face-label">Front</span>
              {card.front}
            </div>
            <div className="flip-face back">
              <span className="face-label">Back</span>
              {card.back}
            </div>
          </div>
        </div>

        {!flipped ? (
          <div className="study-controls">
            <button className="btn big" onClick={() => setFlipped(true)}>
              Flip card
            </button>
          </div>
        ) : (
          <div className="study-controls">
            <button className="btn big" style={{ borderColor: "#eecfcd", color: "var(--danger)", background: "var(--danger-soft)" }} onClick={() => answer("learning")}>
              <ArrowLeft /> Still learning
            </button>
            <button className="btn big primary" onClick={() => answer("got")}>
              Got it <ArrowRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
