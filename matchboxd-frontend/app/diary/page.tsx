"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  Heart,
  HeartOff,
  MessageSquareText,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import StarRating from "@/app/components/StarRating";

interface DiaryEntry {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  watchedAt: string;
  score: number | null;
  comment: string | null;   // Burayı string yaptım
  favorite: boolean;
  hasComment: boolean;
}

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [editMode, setEditMode] = useState<number | null>(null);
  const [editedScore, setEditedScore] = useState<number>(0);
  const [editedComment, setEditedComment] = useState<string>("");

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.get(
          "http://localhost:5011/api/users/me/diary",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEntries(res.data);
      } catch (err) {
        alert("Failed to load diary.");
      }
    };
    fetchEntries();
  }, []);

  const toggleFavorite = async (matchId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        `http://localhost:5011/api/users/me/favorites/toggle`,
        { matchId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setEntries((prev) =>
        prev.map((e) =>
          e.matchId === matchId ? { ...e, favorite: !e.favorite } : e
        )
      );
    } catch {
      alert("Failed to toggle favorite");
    }
  };

  const updateRatingComment = async (matchId: number, score: number, comment: string) => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.put(
        `http://localhost:5011/api/matches/${matchId}/rate-comment`,
        { score, content: comment },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setEntries((prev) =>
        prev.map((e) =>
          e.matchId === matchId
            ? { ...e, score, comment, hasComment: comment.trim().length > 0 }
            : e
        )
      );
      setEditMode(null);
    } catch {
      alert("Failed to update review");
    }
  };

  const previewComment = (comment: string | null, maxLength = 100) => {
    if (!comment) return "";
    return comment.length > maxLength ? comment.slice(0, maxLength) + "..." : comment;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">My Diary</h1>
      <ul className="space-y-4">
        {entries.map((entry) => (
          <li
            key={entry.matchId}
            className="flex flex-col sm:flex-row justify-between gap-4 p-4 border rounded-xl shadow-md bg-white hover:shadow-lg transition-all"
          >
            {/* Left - Date */}
            <div className="flex items-center gap-2 text-sm text-gray-500 sm:flex-col sm:text-center sm:w-[80px]">
              <CalendarDays className="w-5 h-5" />
              <div>
                <div className="font-medium uppercase">
                  {format(new Date(entry.watchedAt), "MMM")}
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {format(new Date(entry.watchedAt), "d")}
                </div>
              </div>
            </div>

            {/* Middle - Match Info */}
            <div className="flex-1">
              <Link href={`/matches/${entry.matchId}`}>
                <p className="text-xl font-semibold text-blue-600 hover:underline cursor-pointer">
                  {entry.homeTeam} vs {entry.awayTeam}
                </p>
              </Link>
              <p className="text-gray-500 text-sm mb-2">
                {format(new Date(entry.matchDate), "yyyy-MM-dd")}
              </p>

              {/* Star Rating */}
              <StarRating
                score={editMode === entry.matchId ? editedScore : entry.score ?? 0}
              />

              {entry.comment && entry.comment.trim() !== "" && (
                <p className="mt-2 text-gray-700 text-sm italic max-w-prose line-clamp-3">
                  {previewComment(entry.comment, 150)}
                </p>
              )}

              {/* Edit mode comment textarea */}
              {editMode === entry.matchId && (
                <div className="mt-3">
                  <textarea
                    className="w-full border rounded p-2 text-gray-700 resize-none"
                    rows={3}
                    value={editedComment}
                    onChange={(e) => setEditedComment(e.target.value)}
                    placeholder="Write your comment here..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() =>
                        updateRatingComment(entry.matchId, editedScore, editedComment)
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditMode(null)}
                      className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right - Icons */}
            <div className="flex sm:flex-col items-center gap-3 justify-center">
              {/* Favorite */}
              <button
                onClick={() => toggleFavorite(entry.matchId)}
                title="Toggle Favorite"
                aria-label={entry.favorite ? "Remove from favorites" : "Add to favorites"}
              >
                {entry.favorite ? (
                  <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                ) : (
                  <HeartOff className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                )}
              </button>

              {/* Comment Icon */}
              {entry.comment && entry.comment.trim() !== "" && (
                <Link
                  href={`/matches/${entry.matchId}#review`}
                  title="View Comment"
                >
                  <MessageSquareText className="w-6 h-6 text-blue-500 hover:text-blue-700" />
                </Link>
              )}


              {/* Edit Review button */}
              {!editMode && (
                <button
                  className="text-blue-500 hover:underline text-sm ml-2"
                  onClick={() => {
                    setEditMode(entry.matchId);
                    setEditedScore(entry.score ?? 0);
                    setEditedComment(entry.comment ?? "");
                  }}
                >
                  Edit Review
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
