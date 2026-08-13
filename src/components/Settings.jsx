import React, { useState } from "react";
import Modal from "./Modal.jsx";
import { Sun, Moon, Download, Trash, Layers, Gear } from "../icons.jsx";
import { getState, resetDemo, clearAllData } from "../store.js";
import { getTheme, applyTheme } from "../theme.js";

export default function Settings({ onDataChange }) {
  const [theme, setThemeState] = useState(getTheme);
  const [confirm, setConfirm] = useState(null); // "reset" | "clear"

  const pickTheme = (t) => {
    setThemeState(t);
    applyTheme(t);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "thai-journal-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const doReset = () => {
    resetDemo();
    onDataChange();
    setConfirm(null);
  };

  const doClear = async () => {
    await clearAllData();
    onDataChange();
    setConfirm(null);
  };

  return (
    <div className="page" style={{ maxWidth: 620, margin: "0 auto" }}>
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <div className="sub">Appearance, data and about</div>
        </div>
      </div>

      <div className="settings-list">
        <div className="settings-group">
          <div className="group-title">Appearance</div>
          <div className="settings-row">
            <span className="row-icon">{theme === "dark" ? <Moon /> : <Sun />}</span>
            <div className="row-label">
              Theme
              <div className="row-desc">Your choice is remembered on this device</div>
            </div>
            <div className="seg">
              <button
                className={theme === "light" ? "active" : ""}
                onClick={() => pickTheme("light")}
              >
                <Sun /> Light
              </button>
              <button
                className={theme === "dark" ? "active" : ""}
                onClick={() => pickTheme("dark")}
              >
                <Moon /> Dark
              </button>
            </div>
          </div>
        </div>

        <div className="settings-group">
          <div className="group-title">Data</div>
          <button className="settings-row" onClick={exportData}>
            <span className="row-icon">
              <Download />
            </span>
            <div className="row-label">
              Export data
              <div className="row-desc">Download everything as a JSON backup</div>
            </div>
          </button>
          <button className="settings-row" onClick={() => setConfirm("reset")}>
            <span className="row-icon" style={{ color: "var(--gold)" }}>
              <Layers />
            </span>
            <div className="row-label">
              Reset demo
              <div className="row-desc">Restore the welcome notebook and note</div>
            </div>
          </button>
          <button className="settings-row" onClick={() => setConfirm("clear")}>
            <span className="row-icon" style={{ color: "var(--danger)" }}>
              <Trash />
            </span>
            <div className="row-label" style={{ color: "var(--danger)" }}>
              Clear all data
              <div className="row-desc">Delete every notebook, note, deck and PDF</div>
            </div>
          </button>
        </div>

        <div className="settings-group">
          <div className="group-title">About</div>
          <div className="settings-row">
            <span className="row-icon">
              <Gear />
            </span>
            <div className="row-label">
              thai-journal
              <div className="row-desc">
                Version 1.0 · notes, sketch, PDF markup & flashcards · everything is saved
                locally on this device
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirm && (
        <Modal
          title={confirm === "reset" ? "Reset demo data?" : "Clear all data?"}
          sub={
            confirm === "reset"
              ? "This restores the welcome notebook and note."
              : "This permanently deletes everything — notebooks, notes, decks and PDFs."
          }
          onClose={() => setConfirm(null)}
        >
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button className="btn danger" onClick={confirm === "reset" ? doReset : doClear}>
              <Trash /> {confirm === "reset" ? "Reset" : "Clear all"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
