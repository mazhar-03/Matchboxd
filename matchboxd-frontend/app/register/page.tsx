"use client";

import { useRouter } from 'next/navigation';  // note: in Next.js 13+ app dir, import from 'next/navigation' instead of 'next/router'
import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5011/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.text();

      if (!res.ok) {
        setMessage("Registration failed: " + data);
        return;
      }

      setMessage("Success! Check your email to verify your account.");
      setEmail("");
      setUsername("");
      setPassword("");
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong.");
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Register</h1>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <input
          className="border px-4 py-2 rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="border px-4 py-2 rounded"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="border px-4 py-2 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Register
        </button>
      </form>

      {message && (
        <p className="text-sm text-center text-gray-700 dark:text-gray-300">
          {message}
        </p>
      )}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Go back"
        >
          &larr; Back
        </button>

        <button
          onClick={() => router.push('/login')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </div>
    </div>
  );
}
