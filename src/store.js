// thai-journal data store.
// - Notebooks, notes and flashcard decks persist to localStorage.
// - PDF blobs persist to IndexedDB (localStorage is too small for files).

const STORAGE_KEY = "notely.state.v1";

let state = load();
const listeners = new Set();

function uid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  );
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        notebooks: parsed.notebooks || [],
        notes: parsed.notes || [],
        decks: parsed.decks || [],
        pdfs: parsed.pdfs || [],
        activeNotebookId: parsed.activeNotebookId || null,
      };
    }
  } catch (e) {
    console.warn("Could not read saved data", e);
  }
  return seed();
}

function seed() {
  const now = Date.now();
  const welcomeNotebook = {
    id: uid(),
    name: "Getting Started",
    color: "#0888f8",
    pattern: "gradient",
    createdAt: now,
  };
  const welcomeNote = {
    id: uid(),
    notebookId: welcomeNotebook.id,
    title: "Welcome to thai-journal 👋",
    body:
      "<h3>Your friendly note-taking space</h3>" +
      "<p>thai-journal brings notes, sketching, PDF markup and flashcards together in one calm workspace.</p>" +
      "<ul><li><b>Notes</b> — write with rich text, color-code and star your favorites.</li>" +
      "<li><b>Sketch</b> — draw by hand on lined, grid or dotted paper.</li>" +
      "<li><b>PDF</b> — import a document and mark it up with your pens.</li>" +
      "<li><b>Flashcards</b> — build decks and quiz yourself.</li></ul>" +
      "<p>Everything is saved locally on this device — no account needed.</p>",
    color: "#0888f8",
    starred: true,
    paper: "blank",
    drawing: null,
    pdf: null,
    createdAt: now,
    updatedAt: now,
  };
  return {
    notebooks: [welcomeNotebook],
    notes: [welcomeNote],
    decks: [],
    pdfs: [],
    activeNotebookId: welcomeNotebook.id,
  };
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Could not save data", e);
  }
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
}

export function resetDemo() {
  state = seed();
  save();
}

// ---------------------------------------------------------------- notebooks

export function createNotebook(name, color, pattern) {
  const nb = {
    id: uid(),
    name: name.trim() || "Untitled notebook",
    color: color || "#0888f8",
    pattern: pattern || "gradient",
    createdAt: Date.now(),
  };
  state = { ...state, notebooks: [...state.notebooks, nb] };
  save();
  return nb;
}

export function renameNotebook(id, name, color, pattern) {
  state = {
    ...state,
    notebooks: state.notebooks.map((n) =>
      n.id === id
        ? {
            ...n,
            name: name.trim() || n.name,
            ...(color ? { color } : {}),
            ...(pattern ? { pattern } : {}),
          }
        : n
    ),
  };
  save();
}

export function deleteNotebook(id) {
  state = {
    ...state,
    notebooks: state.notebooks.filter((n) => n.id !== id),
    notes: state.notes.filter((n) => n.notebookId !== id),
  };
  save();
}

// -------------------------------------------------------------------- notes

export function createNote(notebookId, color) {
  const note = {
    id: uid(),
    notebookId,
    title: "Untitled note",
    body: "",
    color: color || "#0888f8",
    starred: false,
    paper: "blank",
    drawing: null,
    pdf: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  state = { ...state, notes: [note, ...state.notes] };
  save();
  return note;
}

export function updateNote(id, patch) {
  state = {
    ...state,
    notes: state.notes.map((n) =>
      n.id === id
        ? { ...n, ...patch, updatedAt: Date.now() }
        : n
    ),
  };
  save();
}

export function deleteNote(id) {
  state = { ...state, notes: state.notes.filter((n) => n.id !== id) };
  save();
}

// ------------------------------------------------------------------- decks

export function createDeck(name) {
  const deck = {
    id: uid(),
    name: name.trim() || "New deck",
    cards: [],
    createdAt: Date.now(),
  };
  state = { ...state, decks: [...state.decks, deck] };
  save();
  return deck;
}

export function updateDeck(id, patch) {
  state = {
    ...state,
    decks: state.decks.map((d) => (d.id === id ? { ...d, ...patch } : d)),
  };
  save();
}

export function createDeckCard(deckId, front, back, existingId) {
  const deck = state.decks.find((d) => d.id === deckId);
  if (!deck) return;
  const card = { id: existingId || uid(), front, back };
  let cards;
  if (existingId) {
    cards = deck.cards.map((c) => (c.id === existingId ? card : c));
  } else {
    cards = [...deck.cards, card];
  }
  state = {
    ...state,
    decks: state.decks.map((d) => (d.id === deckId ? { ...d, cards } : d)),
  };
  save();
}

export function deleteDeckCard(deckId, cardId) {
  const deck = state.decks.find((d) => d.id === deckId);
  if (!deck) return;
  state = {
    ...state,
    decks: state.decks.map((d) =>
      d.id === deckId ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d
    ),
  };
  save();
}

export function deleteDeck(id) {
  state = { ...state, decks: state.decks.filter((d) => d.id !== id) };
  save();
}

// ------------------------------------------------------------------- pdfs

const DB_NAME = "notely-db";
const DB_STORE = "pdfs";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePdf(id, blob) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadPdf(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deletePdf(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ------------------------------------------------------------------ misc

export function getScratchNote() {
  let nb = state.notebooks.find((n) => n.name === "Sketches");
  if (!nb) {
    nb = createNotebook("Sketches", "#0888f8");
  }
  let note = state.notes.find((n) => n.notebookId === nb.id && n.title === "Sketchpad");
  if (!note) {
    note = createNote(nb.id, "#0888f8");
    updateNote(note.id, { title: "Sketchpad" });
    note = state.notes.find((n) => n.id === note.id);
  }
  return note;
}

export async function clearAllData() {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    /* ignore */
  }
  state = { notebooks: [], notes: [], decks: [], pdfs: [], activeNotebookId: null };
  save();
}

export function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export { uid };
