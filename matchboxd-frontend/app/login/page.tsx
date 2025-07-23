"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5011/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
        credentials: "include"
      });


      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Response is not valid JSON:", text);
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        console.error("Login error:", data);
        alert(data.message || "Login failed!");
        return;
      }

      // Success - save token or redirect
      console.log("Login success:", data);
      // e.g. localStorage.setItem("token", data.token);
      // router.push('/dashboard');

    } catch (err) {
      console.error("Fetch/login error:", err);
      alert("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Login to Matchboxd</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          className="border px-4 py-2 rounded"
          type="text"
          placeholder="Username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
