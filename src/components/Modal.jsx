import React, { useEffect } from "react";

export default function Modal({ title, sub, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        {title && <h3>{title}</h3>}
        {sub && <div className="modal-sub">{sub}</div>}
        {children}
      </div>
    </div>
  );
}
