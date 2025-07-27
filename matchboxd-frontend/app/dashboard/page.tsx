// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import jwt from "jsonwebtoken";
import { useRouter } from "next/navigation";
import UserAvatar from "@/app/components/UserAvatar";

export default function Dashboard() {
  const router = useRouter();
  const [authState, setAuthState] = useState({
    isSignedIn: false,
    username: "",
    userPhoto: "",
    isLoading: true
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const decoded = jwt.decode(token) as {
          username?: string,
          userPhoto?: string,
          exp?: number
        };

        // Check token expiration
        const isExpired = decoded?.exp ? decoded.exp * 1000 < Date.now() : false;

        if (isExpired) {
          throw new Error("Token expired");
        }

        // Ensure proper image URL format
        const userPhoto = decoded?.userPhoto
          ? decoded.userPhoto.startsWith('http')
            ? decoded.userPhoto
            : `http://localhost:5011${decoded.userPhoto}`
          : "";

        setAuthState({
          isSignedIn: true,
          username: decoded?.username || "User",
          userPhoto,
          isLoading: false
        });

      } catch (error) {
        console.error("Authentication error:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  if (authState.isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <section className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {authState.isSignedIn ? (
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-24 h-24"> {/* Added container with relative positioning */}
            <UserAvatar
              profileImageUrl={authState.userPhoto}
              username={authState.username}
              className="w-full h-full" // Make avatar fill the container
            />
          </div>
          <p className="text-xl">Welcome back, <span className="font-semibold">{authState.username}</span>!</p>
        </div>
      ) : (
        <p>Please log in.</p>
      )}
    </section>
  );
}