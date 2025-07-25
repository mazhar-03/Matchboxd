"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {ChevronDown, LogOut, Pen, Settings, Heart, Bookmark, CalendarDays, Menu, User} from "lucide-react";
import UserAvatar from "@/app/components/UserAvatar";

interface NavLink {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavbarProps {
  isSignedIn: boolean;
  username?: string;
  userPhoto?: string;
}

export default function Navbar({ isSignedIn, username, userPhoto }: NavbarProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

    const mainLinks: NavLink[] = [
    { label: "Matches", href: "/matches" },
    { label: "Profile", href: "/profile" },
  ];
  const dropdownLinks: NavLink[] = [
    { label: "Match Diary", href: "/diary", icon: <CalendarDays className="w-4 h-4" /> },
    { label: "My Reviews", href: "/reviews", icon: <Pen className="w-4 h-4" /> },
    { label: "Favorites", href: "/favourites", icon: <Heart className="w-4 h-4" /> },
    { label: "Watchlist", href: "/watchlist", icon: <Bookmark className="w-4 h-4" /> },
    { label: "Settings", href: "/settings", icon: <Settings className="w-4 h-4" /> },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleSignOut = async () => {
    try {
      // Clear client-side storage
      localStorage.removeItem('token');
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      // Optional: Make API call to invalidate server-side session
      await fetch('/api/auth/logout', { method: 'POST' });

      // Clear any React state if needed
      if (window.__NEXT_DATA__?.props?.pageProps) {
        window.__NEXT_DATA__.props.pageProps = {};
      }

      // Force full page reload to reset all state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback if anything fails
      window.location.href = '/login';
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors flex items-center"
            aria-label="Home"
          >
            ⚽ MatchJournal
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {isSignedIn ? (
              <>
                {/* Main Links */}
                <div className="flex gap-4">
                  {mainLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-1 py-2 text-sm font-medium transition-colors ${
                        pathname === item.href
                          ? "text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400"
                          : "text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 focus:outline-none group"
                    aria-label="User menu"
                    aria-expanded={dropdownOpen}
                  >
                    <UserAvatar
                      profileImageUrl={userPhoto}
                      username={username}
                      className="w-8 h-8"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {username || "Account"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700">
                      <div className="py-1">
                        {dropdownLinks.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <span className="mr-3">{item.icon}</span>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <div className="py-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2">
            {isSignedIn ? (
              <>
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 focus:outline-none"
                  aria-label="Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* User Avatar (acts as dropdown trigger) */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="p-2 rounded-md focus:outline-none"
                    aria-label="User menu"
                  >
                    <UserAvatar
                      profileImageUrl={userPhoto}
                      username={username}
                      className="w-8 h-8"
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700">
                      <div className="py-1">
                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <span className="mr-3">
                            <User
                              className="w-5 h-5 text-gray-400 hover:text-green-500 transition-colors"
                              strokeWidth={1.5}  // Thicker/thinner lines
                            />
                          </span>
                          My Profile
                        </Link>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && isSignedIn && (
        <div className="md:hidden" ref={mobileMenuRef}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800 shadow-md">
            {mainLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {dropdownLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}