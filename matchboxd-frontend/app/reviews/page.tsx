"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Star, StarHalf } from "lucide-react";

interface UserReview {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  status: string;
  score: number | null;
  comment: string | null;
  reviewedAt: string | null;
}

function StarRating({ score }: { score: number }) {
  const fullStars = Math.floor(score);
  const halfStar = score - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1 text-yellow-400">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={"full" + i} className="w-5 h-5" />
      ))}
      {halfStar && <StarHalf className="w-5 h-5" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={"empty" + i} className="w-5 h-5 opacity-30" />
      ))}
    </div>
  );
}

export default function CreatedReviewsPage() {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.get<UserReview[]>(
          "http://localhost:5011/api/users/me/reviews",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setReviews(res.data);
      } catch (err) {
        setError("Failed to load reviews.");
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) return <p>Loading reviews...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (reviews.length === 0) return <p>You have no reviews yet.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">My Reviews & Ratings</h1>
      <ul className="space-y-6">
        {reviews.map((review) => (
          <li key={review.matchId} className="border rounded-md p-4 shadow-sm">
            <div className="flex justify-between mb-2">
              <h2 className="text-lg font-bold">
                {review.homeTeam} vs {review.awayTeam}
              </h2>
              <span className="text-sm text-gray-500">
  Reviewed on {new Date(review.reviewedAt ?? "").toLocaleDateString()}
</span>
            </div>
            <div className="flex items-center gap-4 mb-2">
              {review.score !== null ? (
                <StarRating score={review.score} />
              ) : (
                <span className="italic text-gray-400">No rating given</span>
              )}
              <span className="text-sm text-gray-500 capitalize">
                {review.status}
              </span>
            </div>
            {review.comment ? (
              <div className="font-serif bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 mt-2 text-gray-800 dark:text-gray-100 shadow-sm text-base leading-relaxed">
                {review.comment}
              </div>
            ) : (
              <p className="italic text-gray-400">No comment given</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
