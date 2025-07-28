"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {Pen, Settings, Heart, Bookmark, CalendarDays, Menu, User} from "lucide-react";
import UserAvatar from "@/app/components/UserAvatar";
import { SignOutButton } from "./SignOutButton";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


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

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDesktopDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


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
          <div className="hidden sm:flex items-center gap-6">
            {isSignedIn ? (
              <>
                {/* Main Links */}
                <div className="flex gap-4 ">
                  {mainLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 font-medium transition-colors text-xl ${
                        pathname === item.href
                          ? "text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400"
                          : "text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDesktopDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    <UserAvatar
                      profileImageUrl={userPhoto}
                      username={username}
                      className="w-8 h-8"
                    />
                    <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
      {username || "Account"}
    </span>
                    <span className="text-gray-500 text-3xl pt-1">▾</span>
                  </button>

                  {/* Dropdown menu (only desktop) */}
                  {desktopDropdownOpen && (
                    <div className="absolute right-0 mt-72 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md z-50">
                      {dropdownLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setDesktopDropdownOpen(false)}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t border-gray-200 dark:border-gray-700" />
                      <SignOutButton />
                    </div>
                  )}
                </div>

                {/* Settings Dropdown */}
                <div className="relative">
                  <button
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Settings"
                  >
                  </button>
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
          <div className="sm:hidden flex items-center gap-2">
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

                {/* User Profile */}
                <div className="flex items-center gap-2">
                  <UserAvatar
                    profileImageUrl={userPhoto}
                    username={username}
                    className="w-8 h-8"
                  />
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
          <SignOutButton />
        </div>
      )}
    </nav>
  );
}