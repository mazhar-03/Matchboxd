"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { TrashIcon } from "@heroicons/react/24/solid";

type FavoriteMatch = {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string; // ISO string
  status: string;
};

export default function FavPage() {
  const [favorites, setFavorites] = useState<FavoriteMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get<FavoriteMatch[]>(
          "http://localhost:5011/api/users/me/favorites",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setFavorites(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load favorites.");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const removeFromFavorites = async (matchId: number) => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        "http://localhost:5011/api/users/me/favorite/remove",
        { matchId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFavorites((prev) => prev.filter((m) => m.matchId !== matchId));
    } catch (err) {
      alert("Failed to remove from favorites.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6 text-gray-300">
      <h2 className="text-2xl font-bold mb-4 ">Your Favorite Matches</h2>
      {favorites.length === 0 ? (
        <p>No favorites yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
          {favorites.map((match) => (
            <div
              key={match.matchId}
              className="border rounded-xl p-4 shadow-md bg-white text-blue-600 relative"
            >
              <button
                onClick={() => removeFromFavorites(match.matchId)}
                title="Remove from favorites"
                className="absolute top-2 right-2 text-red-600 hover:text-red-800 transition"
              >
                <TrashIcon className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-semibold">
                {match.homeTeam} <br />
                <span className="text-gray-700">vs</span> <br />
                {match.awayTeam}
              </h3>
              <p className="text-sm text-gray-600">
                Date: {new Date(match.matchDate).toLocaleDateString()}
              </p>
              <p className="text-sm ">
                Time:{" "}
                {new Date(match.matchDate).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-gray-600">Status: {match.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
