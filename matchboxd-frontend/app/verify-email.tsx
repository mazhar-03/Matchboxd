"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:5011/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const text = await res.text();

        try {
          const data = JSON.parse(text);
          if (res.ok) {
            setStatus("success");
            setMessage(data.message || "Email verified successfully!");
          } else {
            setStatus("error");
            setMessage(data.message || "Verification failed.");
          }
        } catch {
          setStatus(res.ok ? "success" : "error");
          setMessage(text || (res.ok ? "Verified!" : "Verification failed."));
        }
      })
      .catch((err) => {
        console.error("Network or fetch error:", err);
        setStatus("error");
        setMessage("Network error. Please try again later.");
      });
  }, [token]);

  return (
    <div className="text-center mt-32 text-xl font-semibold text-gray-600">
      {status === "loading" && <p>Verifying your email...</p>}
      {status !== "loading" && <p>{message}</p>}
    </div>
  );
}
