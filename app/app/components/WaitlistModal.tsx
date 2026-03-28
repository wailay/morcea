"use client";

import { useState, type FormEvent } from "react";
import { appendToWaitlist } from "../lib/waitlist";

export function WaitlistModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function close() {
    setIsOpen(false);
    setTimeout(() => setSubmitted(false), 300);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    appendToWaitlist(
      formData.get("firstName") as string,
      formData.get("lastName") as string,
      formData.get("email") as string,
    );

    form.reset();
    setSubmitted(true);
  }

  return (
    <>
      <button className="waitlist-btn" onClick={() => setIsOpen(true)}>
        Join the waitlist
      </button>

      <div
        className={`modal-overlay${isOpen ? " active" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="modal">
          <button className="modal-close" onClick={close}>
            &times;
          </button>
          <h2>Join the waitlist</h2>
          <form className="modal-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              required
            />
            <input type="email" name="email" placeholder="Email" required />
            <button type="submit">Submit</button>
          </form>
          <div className={`modal-confirm${submitted ? " modal-confirm-visible" : ""}`}>
            <div className="modal-confirm-inner">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="8" fill="rgba(255,255,255,0.15)" />
                <path d="M5 8.5L7 10.5L11 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Added to the waitlist. Stay tuned!</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
