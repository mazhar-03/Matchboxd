"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserAvatar from "@/app/components/UserAvatar";

interface ProfileFormData {
  username: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  profileImageFile?: File;
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
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // Load initial user data
  useEffect(() => {
    const loadUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:5011/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setFormData({
            username: userData.username,
            email: userData.email,
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: ""
          });
          if (userData.profileImageUrl) {
            setProfileImageUrl(userData.profileImageUrl);
          }
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setMessage({text: 'Failed to load profile data', type: 'error'});
      }
    };

    loadUserData();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('Username', formData.username);
      formDataToSend.append('Email', formData.email);

      if (formData.currentPassword && formData.newPassword) {
        formDataToSend.append('CurrentPassword', formData.currentPassword);
        formDataToSend.append('NewPassword', formData.newPassword);
      }

      if (profileImage) {
        formDataToSend.append('ProfileImage', profileImage);
      }

      const response = await fetch('http://localhost:5011/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Update failed");
      }

      // Update local data
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      if (result.avatarUrl) {
        setProfileImageUrl(result.avatarUrl);
      }

      setMessage({text: result.message || "Profile updated successfully", type: 'success'});
      router.refresh();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Update failed";
      setMessage({text: errorMessage, type: 'error'});
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setProfileImage(file);
    // Create a preview URL
    setProfileImageUrl(URL.createObjectURL(file));
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

      {message && (
        <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
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
          <label className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            name="username"
            className="w-full p-2 border rounded mt-1"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            name="email"
            type="email"
            className="w-full p-2 border rounded mt-1"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-medium">Change Password</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              name="currentPassword"
              type="password"
              className="w-full p-2 border rounded mt-1"
              value={formData.currentPassword}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              name="newPassword"
              type="password"
              className="w-full p-2 border rounded mt-1"
              value={formData.newPassword}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              name="confirmNewPassword"
              type="password"
              className="w-full p-2 border rounded mt-1"
              value={formData.confirmNewPassword}
              onChange={handleChange}
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}