"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { TrashIcon, StarIcon } from "@heroicons/react/24/solid";

interface WatchlistMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  status: string;
  scoreHome: number | null;
  scoreAway: number | null;
  description: string | null;
  averageRating: number;
  totalComments: number;
  watchCount: number;
}

export default function WatchlistPage() {
  const [matches, setMatches] = useState<WatchlistMatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get("http://localhost:5011/api/watchlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatches(res.data);
    } catch (err) {
      alert("Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (matchId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        "http://localhost:5011/api/watchlist/remove",
        { matchId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    } catch (err) {
      alert("Failed to remove match from watchlist");
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<StarIcon key={i} className="w-5 h-5 text-yellow-400" />);
      } else if (rating >= i - 0.5) {
        stars.push(
          <StarIcon key={i} className="w-5 h-5 text-yellow-300 opacity-50" />
        );
      } else {
        stars.push(<StarIcon key={i} className="w-5 h-5 text-gray-300" />);
      }
    }
    return stars;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        My Watchlist
      </h1>

      {loading && <p className="text-center">Loading...</p>}

      {!loading && matches.length === 0 && (
        <p className="text-center text-gray-600">Your watchlist is empty.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => (
          <div
            key={match.id}
            className="border rounded-xl p-5 shadow-md bg-white hover:shadow-lg transition flex flex-col justify-between"
          >
            <Link href={`/matches/${match.id}`} className="mb-4 block cursor-pointer">
              <div className="text-blue-600 font-semibold text-lg leading-tight max-w-full break-words">
                <span className="block truncate max-w-full">{match.homeTeam}</span>
                <span className="block text-gray-700">vs</span>
                <span className="block truncate max-w-full">{match.awayTeam}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(match.matchDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Score:{" "}
                {match.scoreHome !== null && match.scoreAway !== null
                  ? `${match.scoreHome} - ${match.scoreAway}`
                  : "N/A"}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {renderStars(match.averageRating)}
                <span className="text-sm text-gray-500 ml-2">
                  ({match.totalComments} comments)
                </span>
                <span className="text-sm text-gray-500 ml-4">
                  👁️ {match.watchCount} watched
                </span>
              </div>
            </Link>

            <button
              onClick={() => removeFromWatchlist(match.id)}
              title="Remove from watchlist"
              className="self-end mt-4 flex items-center gap-1 text-red-600 hover:text-red-800 transition"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
