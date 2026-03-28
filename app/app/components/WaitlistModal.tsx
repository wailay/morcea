"use client";

import { useState, type FormEvent } from "react";
import { appendToWaitlist } from "../lib/waitlist";

export function WaitlistModal() {
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    appendToWaitlist(
      formData.get("firstName") as string,
      formData.get("lastName") as string,
      formData.get("email") as string,
    );

    setIsOpen(false);
    form.reset();
  }

  return (
    <>
      <button className="waitlist-btn" onClick={() => setIsOpen(true)}>
        Join the waitlist
      </button>

      <div
        className={`modal-overlay${isOpen ? " active" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsOpen(false);
        }}
      >
        <div className="modal">
          <button className="modal-close" onClick={() => setIsOpen(false)}>
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
        </div>
      </div>
    </>
  );
}
