import { useEffect, useRef, useState } from "react";

interface ToastState {
  message: string;
  show: boolean;
}

let showToastFn: ((msg: string) => void) | null = null;

export function showToast(msg: string) {
  showToastFn?.(msg);
}

export function Toast() {
  const [toast, setToast] = useState<ToastState>({ message: "", show: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    showToastFn = (msg: string) => {
      setToast({ message: msg, show: true });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3200);
    };
    return () => {
      showToastFn = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className={`toast ${toast.show ? "show" : ""}`}>
      {toast.message}
    </div>
  );
}
