"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    setIsSigningOut(true);
    try {
      // Clear all auth storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      // Force hard redirect
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
  className="w-full flex items-center pl-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
  >
  <LogOut className="w-4 h-4 mr-3" />
    {isSigningOut ? "Signing out..." : "Sign Out"}
    </button>
);
}