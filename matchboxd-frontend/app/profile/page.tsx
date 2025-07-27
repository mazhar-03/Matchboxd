"use client";

import { useEffect, useState } from "react";
import jwt from "jsonwebtoken";
import { useRouter } from "next/navigation";
import UserAvatar from "@/app/components/UserAvatar";

interface ProfileFormData {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [authState, setAuthState] = useState({
    isSignedIn: false,
    username: "",
    email: "",
    userPhoto: "",
    isLoading: true
  });
  const [formData, setFormData] = useState<ProfileFormData>({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // Load auth state from token
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwt.decode(token) as {
        username?: string;
        email?: string;
        userPhoto?: string;
        exp?: number;
      };

      const isExpired = decoded?.exp ? decoded.exp * 1000 < Date.now() : false;
      if (isExpired) throw new Error("Token expired");

      const userPhoto = decoded?.userPhoto
        ? decoded.userPhoto.startsWith('http')
          ? decoded.userPhoto
          : `http://localhost:5011${decoded.userPhoto}`
        : "";

      setAuthState({
        isSignedIn: true,
        username: decoded?.username || "",
        email: decoded?.email || "",
        userPhoto,
        isLoading: false
      });

      setFormData(prev => ({
        ...prev,
        username: decoded?.username || "",
        email: decoded?.email || ""
      }));

    } catch (error) {
      console.error("Auth error:", error);
      localStorage.removeItem("authToken");
      router.push("/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("http://localhost:5011/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmNewPassword: formData.confirmNewPassword
        })
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Update failed");

      // Update local state and token
      if (result.token) {
        localStorage.setItem("authToken", result.token);
        const decoded = jwt.decode(result.token) as { username?: string, userPhoto?: string };
        setAuthState(prev => ({
          ...prev,
          username: decoded?.username || prev.username,
          userPhoto: decoded?.userPhoto
            ? decoded.userPhoto.startsWith('http')
              ? decoded.userPhoto
              : `http://localhost:5011${decoded.userPhoto}`
            : prev.userPhoto
        }));
      }

      setMessage({ text: "Profile updated successfully", type: "success" });
      setTimeout(() => router.refresh(), 1000);

    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Update failed",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const formData = new FormData();
      formData.append("ProfileImage", file);

      const response = await fetch("http://localhost:5011/api/settings", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Upload failed");

      if (result.token) {
        localStorage.setItem("authToken", result.token);
        const decoded = jwt.decode(result.token) as { userPhoto?: string };
        setAuthState(prev => ({
          ...prev,
          userPhoto: decoded?.userPhoto
            ? decoded.userPhoto.startsWith('http')
              ? decoded.userPhoto
              : `http://localhost:5011${decoded.userPhoto}`
            : prev.userPhoto
        }));
      }

      setMessage({ text: "Profile picture updated!", type: "success" });

    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Upload failed",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (authState.isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 space-y-6 p-4">
      <h1 className="text-2xl font-bold text-center">Profile Settings</h1>

      {message && (
        <div className={`p-3 rounded ${
          message.type === "success"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-24 h-24">
            <UserAvatar
              profileImageUrl={authState.userPhoto}
              username={authState.username}
              onUpload={handleImageUpload}
              className="w-full h-full"
            />
          </div>
          <p className="text-lg font-medium">{authState.username}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="pt-4 border-t space-y-4">
          <h3 className="font-medium">Change Password</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              name="confirmNewPassword"
              type="password"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}