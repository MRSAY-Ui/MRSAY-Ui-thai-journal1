import React, { useState, useEffect, useCallback } from "react";
import { Logo, Note, Pen, Cards, Gear, Sun, Moon } from "./icons.jsx";
import { subscribe, getState, getScratchNote } from "./store.js";
import { getTheme, applyTheme } from "./theme.js";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import NotebookView from "./components/NotebookView.jsx";
import NoteEditor from "./components/NoteEditor.jsx";
import Flashcards from "./components/Flashcards.jsx";
import DrawingPad from "./components/DrawingPad.jsx";
import PdfMarkup from "./components/PdfMarkup.jsx";
import Settings from "./components/Settings.jsx";

export default function App() {
  const [view, setView] = useState({ name: "dashboard" });
  const [query, setQuery] = useState("");
  const [drawingNote, setDrawingNote] = useState(null);
  const [pdfNote, setPdfNote] = useState(null);
  const [tick, setTick] = useState(0);
  const [theme, setTheme] = useState(getTheme);

  const onDataChange = useCallback(() => setTick((t) => t + 1), []);
  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    []
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const unsub = subscribe(() => {});
    return unsub;
  }, []);

  // keep views valid if the underlying item is deleted
  useEffect(() => {
    const state = getState();
    if (view.name === "notebook" && !state.notebooks.find((n) => n.id === view.notebookId)) {
      setView({ name: "dashboard" });
    }
    if (view.name === "note" && !state.notes.find((n) => n.id === view.noteId)) {
      setView({ name: "dashboard" });
    }
    if (view.name === "deck" && !state.decks.find((d) => d.id === view.deckId)) {
      setView({ name: "decks" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, tick]);

  const navigate = (v) => setView(v);

  const openSketch = () => {
    const note = getScratchNote();
    onDataChange();
    setDrawingNote(note);
  };

  let content;
  if (view.name === "dashboard") {
    content = <Dashboard query={query} onQuery={setQuery} onNavigate={navigate} onDataChange={onDataChange} />;
  } else if (view.name === "notebook") {
    content = <NotebookView notebookId={view.notebookId} onNavigate={navigate} onDataChange={onDataChange} />;
  } else if (view.name === "note") {
    content = (
      <NoteEditor
        noteId={view.noteId}
        onNavigate={navigate}
        onDataChange={onDataChange}
        onOpenDrawing={(note) => setDrawingNote(note)}
        onOpenPdf={(note) => setPdfNote(note)}
      />
    );
  } else if (view.name === "settings") {
    content = <Settings onDataChange={onDataChange} />;
  } else {
    content = <Flashcards view={view} onNavigate={navigate} onDataChange={onDataChange} />;
  }

  const tabActive = (name) => {
    if (name === "notes") return ["dashboard", "notebook", "note"].includes(view.name);
    if (name === "cards") return ["decks", "deck"].includes(view.name);
    if (name === "settings") return view.name === "settings";
    return false;
  };

  return (
    <div className="app">
      <Sidebar
        view={view}
        onNavigate={navigate}
        query={query}
        onQuery={setQuery}
        onDataChange={onDataChange}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="app-col">
        <div className="mobile-topbar">
          <span className="m-brand">
            <Logo size={26} /> thai-journal
          </span>
          <div style={{ flex: 1 }} />
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </button>
        </div>

        <div className="main">{content}</div>
      </div>

      <nav className="mobile-tabs" aria-label="Primary">
        <button
          className={tabActive("notes") ? "active" : ""}
          onClick={() => navigate({ name: "dashboard" })}
        >
          <span className="tab-icon">
            <Note />
          </span>
          Notes
        </button>
        <button className={drawingNote ? "active" : ""} onClick={openSketch}>
          <span className="tab-icon">
            <Pen />
          </span>
          Sketch
        </button>
        <button
          className={tabActive("cards") ? "active" : ""}
          onClick={() => navigate({ name: "decks" })}
        >
          <span className="tab-icon">
            <Cards />
          </span>
          Cards
        </button>
        <button
          className={tabActive("settings") ? "active" : ""}
          onClick={() => navigate({ name: "settings" })}
        >
          <span className="tab-icon">
            <Gear />
          </span>
          Settings
        </button>
      </nav>

      {drawingNote && (
        <DrawingPad
          note={drawingNote}
          onClose={() => setDrawingNote(null)}
          onDataChange={onDataChange}
        />
      )}
      {pdfNote && (
        <PdfMarkup
          note={pdfNote}
          onClose={() => setPdfNote(null)}
          onDataChange={onDataChange}
        />
      )}
    </div>
  );
}
