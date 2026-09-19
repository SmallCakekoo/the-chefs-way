import { useEffect, useRef } from "react";
import ArtDialog, { ArtButton } from "./ArtDialog.jsx";

/** Diálogo de confirmación con el marco del juego. Feedback claro antes de una acción destructiva. */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  return (
    <ArtDialog
      open={open}
      title={title}
      onClose={onCancel}
      actions={
        <>
          <ArtButton ref={confirmRef} sound="press" onClick={onConfirm}>
            {confirmLabel}
          </ArtButton>
          <ArtButton onClick={onCancel}>{cancelLabel}</ArtButton>
        </>
      }
    >
      {body && <p>{body}</p>}
    </ArtDialog>
  );
}
