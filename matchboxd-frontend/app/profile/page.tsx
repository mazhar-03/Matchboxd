"use client";

import { useState, FormEvent, useEffect } from "react";
import { updateUserProfile } from "@/lib/api";
import UserAvatar from "@/app/components/UserAvatar";
import { useRouter } from "next/navigation";

interface ProfileFormData {
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface UserData {
  username: string;
  email: string;
  userPhoto?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProfileFormData>({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load user data on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedData: UserData = JSON.parse(userData);
      setFormData(prev => ({
        ...prev,
        username: parsedData.username,
        email: parsedData.email
      }));
      if (parsedData.userPhoto) {
        setProfileImageUrl(parsedData.userPhoto);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("No authentication token found");

      const response = await fetch('http://localhost:5011/api/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData) // Use actual form data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Update failed");
      }

      const result = await response.json();

      // Update stored user data if username changed
      if (result.username) {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedData: UserData = JSON.parse(userData);
          localStorage.setItem('user', JSON.stringify({
            ...parsedData,
            username: result.username,
            userPhoto: result.avatarUrl || parsedData.userPhoto
          }));
        }
      }

      // Update tokens and image URL
      if (result.token) {
        localStorage.setItem('token', result.token);
        document.cookie = `token=${result.token}; path=/;`;
      }
      if (result.avatarUrl) setProfileImageUrl(result.avatarUrl);

      setSuccessMessage(result.message || "Profile updated successfully");

      // Optional: Refresh to ensure all components get updated data
      setTimeout(() => router.refresh(), 1000);

    } catch (error: unknown) {
      console.error("Update failed:", error);
      setErrorMessage(error instanceof Error ? error.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const result = await updateUserProfile({ profileImageFile: file });

      // Update local user data
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedData = JSON.parse(userData);
        localStorage.setItem('user', JSON.stringify({
          ...parsedData,
          userPhoto: result.avatarUrl
        }));
      }

      setProfileImageUrl(result.avatarUrl);

      if (result.token) {
        localStorage.setItem('token', result.token);
        document.cookie = `token=${result.token}; path=/;`;
      }

      setSuccessMessage("Profile picture updated successfully!");
      router.refresh();

    } catch (err: unknown) {
      console.error("Upload failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-md mx-auto mt-10 space-y-6 p-4">
      <h1 className="text-2xl font-bold text-center">Update Profile</h1>

      {successMessage && (
        <div className="p-3 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center">
          <UserAvatar
            profileImageUrl={profileImageUrl}
            username={formData.username}
            onUpload={handleImageUpload}
            className="w-24 h-24"
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            id="username"
            name="username"
            className="w-full p-2 border rounded mt-1"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            className="w-full p-2 border rounded mt-1"
            placeholder="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-medium">Change Password</h3>

          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              className="w-full p-2 border rounded mt-1"
              placeholder="Current Password"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              className="w-full p-2 border rounded mt-1"
              placeholder="New Password"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              id="confirmNewPassword"
              name="confirmNewPassword"
              className="w-full p-2 border rounded mt-1"
              placeholder="Confirm New Password"
              type="password"
              value={formData.confirmNewPassword}
              onChange={handleChange}
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}