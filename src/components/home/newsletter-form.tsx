import React, { useCallback, useState } from "react";
import styles from "./newsletter-form.module.css";
import clsx from "clsx";

export const NewsletterForm = () => {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmittedForm] = useState(false);
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!email) {
        setError("Please enter email address");
        return;
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
        setError("Please enter a valid email address");
        return;
      }

      setTimeout(() => {
        setIsSubmittedForm(true);
        setEmail("");
        setError("");
      }, 400);

      setTimeout(() => {
        setIsSubmittedForm(false);
      }, 5000);
    },
    [email],
  );
  return isSubmitted ? (
    <span
      style={{
        color: "var(--buf-ink-blue-02)",
      }}
    >
      Thanks for signing up!
    </span>
  ) : (
    <div className={clsx("container", styles.formContainer)}>
      <p>Join the newsletter for future updates</p>
      <form id="mailinglist" onSubmit={handleSubmit}>
        <div className={styles.form}>
          <input
            id="newsletterEmailField"
            aria-label="Your email"
            type="email"
            name="email"
            placeholder="Your email..."
            onChange={(e) => setEmail(e.target.value)}
            value={email}
          />
          <button
            type="submit"
            style={{
              cursor: "pointer",
            }}
          >
            Join
          </button>
        </div>
        {error && (
          <span
            style={{
              color: "#e53238",
              fontSize: ".75rem",
              marginTop: ".5rem",
            }}
          >
            {error}
          </span>
        )}
      </form>
    </div>
  );
};
