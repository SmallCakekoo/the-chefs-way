import { useEffect, useRef } from "react";
import Button from "./Button.jsx";
import { sfx } from "../lib/sfx.js";
import styles from "./ConfirmDialog.module.css";

/** Diálogo de confirmación plano. Feedback claro antes de una acción destructiva. */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "danger",
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={onCancel}
      role="presentation"
    >
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cd-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="cd-title" className={styles.title}>
          {title}
        </p>
        {body && <p className={styles.body}>{body}</p>}
        <div className={styles.actions}>
          <Button onClick={onCancel}>{cancelLabel}</Button>
          <Button
            ref={confirmRef}
            variant={tone === "danger" ? "primary" : "secondary"}
            onClick={() => {
              sfx.press();
              onConfirm?.();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
