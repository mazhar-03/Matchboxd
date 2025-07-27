"use client";

import {useEffect, useState} from "react";

interface MatchLogProps {
  match: {
    id: number;
    status: "scheduled" | "timed" | "finished";
  };
  userId: string;
}


export default function MatchLog({ match, userId }: MatchLogProps) {

  const [comment, setComment] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [watchlistAdded, setWatchlistAdded] = useState(false);
  const [favoriteAdded, setFavoriteAdded] = useState(false);
  const [watched, setWatched] = useState(false);

  const canAddToWatchlist = match.status !== "finished";

  const handleSubmit = async () => {
    try {
      const res = await fetch(`http://localhost:5011/api/matches/${match.id}/rate-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, content: comment, score }),
      });

      if (!res.ok) throw new Error("Failed to log");

      alert("Log saved!");
      setComment("");
      setScore(null);
    } catch (err) {
      console.error(err);
      alert("Error logging match.");
    }
  };

  const handleFavorite = async () => {
    try {
      const res = await fetch(`http://localhost:5011/api/matches/${match.id}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error("Already in favorites?");
      setFavoriteAdded(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkWatched = async () => {
    try {
      const res = await fetch(`http://localhost:5011/api/matches/${match.id}/watch`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Already marked?");
      setWatched(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (!userId) return <div>Please log in</div>;
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg mt-6 space-y-4">
      <h3 className="text-xl font-bold">Log Match</h3>

      {match.status !== "finished" && (
        <button
          onClick={handleMarkWatched}
          className={`px-4 py-2 rounded bg-green-600 text-white ${
            watched ? "opacity-60 cursor-not-allowed" : "hover:bg-green-700"
          }`}
          disabled={watched}
        >
          {watched ? "Watched ✓" : "Mark as Watched"}
        </button>
      )}

      {canAddToWatchlist && !watchlistAdded && (
        <button
          onClick={() => {
            // You probably already have a function for this
            setWatchlistAdded(true);
          }}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Add to Watchlist
        </button>
      )}

      {!favoriteAdded && (
        <button
          onClick={handleFavorite}
          className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
        >
          Add to Favorites
        </button>
      )}

      {match.status === "finished" && (
        <>
          <div>
            <label className="block font-medium">Rating</label>
            <select
              value={score ?? ""}
              onChange={(e) => setScore(Number(e.target.value))}
              className="mt-1 border rounded px-3 py-2"
            >
              <option value="">Select rating</option>
              {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((val) => (
                <option key={val} value={val}>
                  {val} ⭐
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="mt-1 border rounded w-full px-3 py-2"
              placeholder="Share your thoughts..."
            />
          </div>

          <button
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded"
          >
            Submit Review
          </button>
        </>
      )}
    </div>
  );
}
