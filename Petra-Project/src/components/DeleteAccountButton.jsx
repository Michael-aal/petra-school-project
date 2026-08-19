import { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import "../Styles/components/DeleteAccountButton.css";

export default function DeleteAccountButton({
  className = "",
  buttonLabel = "Delete Account",
  title = "Delete Account",
  message = "Are you sure you want to permanently delete your account? This action cannot be undone.",
  successMessage = "Account deletion has been cancelled in this demo. No changes were made.",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const closeModal = () => {
    setIsOpen(false);
    setStatusMessage("");
  };

  const handleConfirm = () => {
    setIsOpen(false);
    setStatusMessage(successMessage);
  };

  return (
    <div className={`delete-account-button-wrap ${className}`.trim()}>
      <button type="button" className="delete-account-button" onClick={() => setIsOpen(true)}>
        <Trash2 size={16} />
        <span>{buttonLabel}</span>
      </button>

      {statusMessage ? (
        <p className="delete-account-status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}

      {isOpen ? (
        <div className="delete-account-modal-backdrop" role="presentation" onClick={closeModal}>
          <div
            className="delete-account-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-account-modal-header">
              <div className="delete-account-modal-icon" aria-hidden="true">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 id="delete-account-title">{title}</h3>
                <p>{message}</p>
              </div>
              <button type="button" className="delete-account-modal-close" onClick={closeModal} aria-label="Close delete dialog">
                <X size={16} />
              </button>
            </div>

            <div className="delete-account-modal-actions">
              <button type="button" className="delete-account-modal-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="delete-account-modal-confirm" onClick={handleConfirm}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
