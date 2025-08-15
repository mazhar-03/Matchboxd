"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

interface SignOutButtonProps {
  className?: string;
}

export default function SignOutButton({ className = "" }: SignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    setIsSigningOut(true);
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = "/login";
    } catch (error) {
      console.error("Sign out failed:", error);
      window.location.href = "/login";
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={`w-full flex items-center cursor-pointer text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}
    >
      <LogOut className="w-4 h-4 mr-3" />
      {isSigningOut ? "Signing out..." : "Sign Out"}
    </button>
  );
}
