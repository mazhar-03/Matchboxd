"use client";

import { useRouter } from 'next/navigation';
import { useState } from "react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState({ text: "", isError: false });
  const router = useRouter();

  const validateField = (name: string, value: string) => {
    let error = "";

    switch (name) {
      case "email":
        if (!value) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          error = "Please enter a valid email (e.g., user@example.com)";
        break;

      case "username":
        if (!value) error = "Username is required";
        else if (value.length < 3 || value.length > 20)
          error = "Username must be 3-20 characters";
        else if (!/^[a-zA-Z0-9_]+$/.test(value))
          error = "Only letters, numbers, and underscores allowed";
        break;

      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 8)
          error = "Password must be at least 8 characters";
        else if (!/[A-Z]/.test(value))
          error = "Must contain at least one uppercase letter";
        else if (!/[a-z]/.test(value))
          error = "Must contain at least one lowercase letter";
        else if (!/\d/.test(value))
          error = "Must contain at least one number";
        break;
    }

    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([name, value]) => {
      const error = validateField(name, value);
      if (error) validationErrors[name] = error;
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await fetch("http://localhost:5011/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle backend validation errors
        const backendError = typeof data === 'string' ? data : data.message;
        setMessage({ text: backendError || "Registration failed", isError: true });
        return;
      }

      setMessage({
        text: "Success! Please check your email to verify your account.",
        isError: false
      });
      setFormData({ email: "", username: "", password: "" });

    } catch (err) {
      console.error(err);
      setMessage({
        text: "Network error. Please try again.",
        isError: true
      });
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold text-center">Register</h1>

      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <div>
          <input
            className={`border px-4 py-2 rounded w-full ${
              errors.email ? "border-red-500" : ""
            }`}
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <input
            className={`border px-4 py-2 rounded w-full ${
              errors.username ? "border-red-500" : ""
            }`}
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {errors.username && (
            <p className="text-red-500 text-xs mt-1">{errors.username}</p>
          )}
        </div>

        <div>
          <input
            className={`border px-4 py-2 rounded w-full ${
              errors.password ? "border-red-500" : ""
            }`}
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            required
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Register
        </button>
      </form>

      {message.text && (
        <p className={`text-sm text-center ${
          message.isError ? "text-red-500" : "text-green-600"
        }`}>
          {message.text}
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