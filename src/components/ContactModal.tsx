import { useState, type FormEvent } from "react";
import { saveContactMessage } from "@/lib/api";
import { showToast } from "@/components/Toast";

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

export function ContactModal({ open, onClose }: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const msg = await saveContactMessage({ name, email, subject, message });
      showToast(msg);
      onClose();
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box contact-box">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 style={{ fontSize: "1.5rem" }}>
          Contact <span className="grad-text">Seekora</span>
        </h2>
        <p className="section-sub">Your message will be saved for the site administrator.</p>
        <form onSubmit={handleSubmit}>
          <input className="modal-input" type="text" maxLength={120} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="modal-input" type="email" maxLength={160} placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="modal-input" type="text" maxLength={200} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <textarea className="modal-textarea" maxLength={5000} placeholder="How can we help?" value={message} onChange={(e) => setMessage(e.target.value)} required />
          <button className="btn" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Saving..." : "Save Message"}
          </button>
        </form>
      </div>
    </div>
  );
}
