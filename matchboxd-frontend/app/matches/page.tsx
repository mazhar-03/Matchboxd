"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  status: string;
  scoreHome?: number;
  scoreAway?: number;
  averageRating: number;
  totalComments: number;
  watchCount: number;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5011/api/matches");
        if (!res.ok) throw new Error("Failed to fetch matches");
        const data: Match[] = await res.json();

        data.sort((a, b) => a.id - b.id);
        setMatches(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []);

  const filteredMatches = matches.filter(
    (m) =>
      m.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.awayTeam.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 font-sans">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-400">Matches</h1>

      <input
        type="text"
        placeholder="Search by team name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />

      {loading && <p className="text-center text-gray-600">Loading matches...</p>}
      {error && <p className="text-center text-red-600">Error: {error}</p>}

      {!loading && !error && filteredMatches.length === 0 && (
        <p className="text-center text-gray-500">No matches found for &quot;{searchTerm}&quot;</p>
      )}

      {!loading && !error && filteredMatches.length > 0 && (
        <div className="overflow-x-auto rounded-lg shadow-md">
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-100">
            <tr>
              {[
                "ID",
                "Date",
                "Home Team",
                "Away Team",
                "Score",
                "Status",
                "Avg Rating",
                "Comments",
                "Watch Count",
              ].map((header) => (
                <th
                  key={header}
                  className="text-left px-4 py-3 border-b border-gray-300 text-gray-700 font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
            </thead>
            <tbody>
            {filteredMatches.map((match) => (
              <tr
                key={match.id}
                className="even:bg-white odd:bg-gray-50 hover:bg-blue-100 transition-colors"
              >
                <td className="px-4 py-2 text-center text-gray-700">
                  <Link
                  href={`/matches/${match.id}`}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  {match.id}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-700">
                  {new Date(match.matchDate).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-gray-900 font-medium">{match.homeTeam}</td>
                <td className="px-4 py-2 text-gray-900 font-medium">{match.awayTeam}</td>
                <td className="px-4 py-2 text-center text-gray-700">
                  {match.scoreHome !== null && match.scoreAway !== null
                    ? `${match.scoreHome} - ${match.scoreAway}`
                    : "-"}
                </td>
                <td className="px-4 py-2 capitalize text-gray-600">{match.status}</td>
                <td
                  className={`px-4 py-2 text-center font-semibold ${
                    match.averageRating > 4
                      ? "text-green-600"
                      : match.averageRating < 2
                        ? "text-red-600"
                        : "text-yellow-500"
                  }`}
                >
                  {match.averageRating.toFixed(1)}
                </td>
                <td className="px-4 py-2 text-center text-gray-600">{match.totalComments}</td>
                <td className="px-4 py-2 text-center text-gray-600">{match.watchCount}</td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
