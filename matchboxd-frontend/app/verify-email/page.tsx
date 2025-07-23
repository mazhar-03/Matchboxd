"use client"; // because we'll use React hooks and client-side fetching

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    fetch("http://localhost:5011/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
  .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          const errorData = await res.json();
          setStatus("error");
          setMessage(errorData.message || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error. Please try again later.");
      });
  }, [token]);

  return (
    <main className="min-h-screen flex flex-col justify-center items-center p-8">
      {status === "loading" && <p>Verifying your email...</p>}
      {status === "success" && <p className="text-green-600">{message}</p>}
      {status === "error" && <p className="text-red-600">{message}</p>}
    </main>
  );
}
