import React from "react";
import "./PageLoadingFallback.css";

export default function PageLoadingFallback({ message = "Loading workspace..." }) {
  return (
    <div className="petra-loading-container" role="status" aria-live="polite">
      <div className="petra-loading-card">
        <div className="petra-spinner-ring">
          <div className="petra-spinner-inner" />
        </div>
        <div className="petra-loading-text">
          <h4>Petra School OS</h4>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
}
