'use client';
import Link from 'next/link';
import React, {useEffect, useState} from 'react';
import {useParams} from 'next/navigation';
import {StarIcon, ArrowLeftIcon, EyeIcon, BookmarkIcon, ChatBubbleLeftIcon} from '@heroicons/react/24/solid';

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  status: 'FINISHED' | 'TIMED' | 'SCHEDULED' | 'CANCELED';
  scoreHome: number | null;
  scoreAway: number | null;
  description: string;
  watchCount: number;
  ratings: {
    score: number;
    username: string;
    createdAt: string;
  }[];
  comments: {
    content: string;
    username: string;
    createdAt: string;
  }[];
}

export default function MatchDetailPage() {
  const {id} = useParams();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userActions, setUserActions] = useState({
    hasWatched: false,
    hasFavorited: false,
    isInWatchlist: false,
    userRating: null as number | null
  });
  const [watchedCount, setWatchedCount] = useState(0);

  useEffect(() => {
    const fetchWatchedCount = async () => {
      const res = await fetch(`http://localhost:5011/api/matches/${id}/watched/count`);
      if (res.ok) {
        const data = await res.json();
        setWatchedCount(data.watchedCount);
      }
    };

    fetchWatchedCount();
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const matchRes = await fetch(`http://localhost:5011/api/matches/${id}`);
        if (!matchRes.ok) throw new Error('Failed to fetch match');
        const matchData: Match = await matchRes.json();
        setMatch(matchData);

        const username = localStorage.getItem('username');
        if (username) {
          const userRating = matchData.ratings.find(r => r.username === username);
          if (userRating) {
            setRating(userRating.score);
            setUserActions(prev => ({...prev, userRating: userRating.score}));
          }
          const userComment = matchData.comments.find(c => c.username === username);
          if (userComment) {
            setComment(userComment.content);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchUserActions = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const [watchedRes, watchlistRes] = await Promise.all([
          fetch(`http://localhost:5011/api/users/me/matches/${id}/watched`, {
            headers: {Authorization: `Bearer ${token}`}
          }),
          fetch(`http://localhost:5011/api/users/me/favorites/${id}`, {
            headers: {Authorization: `Bearer ${token}`}
          })
        ]);

        const watchedData = watchedRes.ok ? await watchedRes.json() : {hasWatched: false};
        const watchlistData = watchlistRes.ok ? await watchlistRes.json() : {isInWatchlist: false};

        setUserActions(prev => ({
          ...prev,
          hasWatched: watchedData.hasWatched,
          isInWatchlist: watchlistData.isInWatchlist
        }));
      } catch (err) {
        console.error('Error fetching user actions:', err);
      }
    };
    fetchUserActions();
  }, [id]);

  const handleSubmit = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please login to submit');
      return;
    }

    const method = rating > 0 || comment.trim() ? 'PUT' : 'POST';

    const res = await fetch(`http://localhost:5011/api/matches/${id}/rate-comment`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        score: rating || null,
        content: comment || null
      })
    });

    if (res.ok) {
      alert('Review submitted!');
      window.location.reload();
    } else {
      const errText = await res.text();
      alert(`Error: ${errText}`);
    }
  };

  const handleWatchToggle = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please login to toggle watch status');
      return;
    }

    try {
      const method = userActions.hasWatched ? 'DELETE' : 'POST';
      const res = await fetch(`http://localhost:5011/api/matches/${id}/watch`, {
        method,
        headers: {Authorization: `Bearer ${token}`}
      });

      if (res.ok) {
        setUserActions(prev => ({...prev, hasWatched: !prev.hasWatched}));
        setWatchedCount(prev => userActions.hasWatched ? prev - 1 : prev + 1);
      } else {
        const error = await res.text();
        alert(`Error: ${error}`);
      }
    } catch (err) {
      console.error('Watch toggle error:', err);
      alert('Error toggling watch status');
    }
  };

  const handleWatchlistToggle = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please login to toggle watchlist');
      return;
    }

    try {
      const action = userActions.isInWatchlist ? 'remove' : 'add';
      const res = await fetch(`http://localhost:5011/api/watchlist/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({matchId: id})
      });

      if (res.ok) {
        setUserActions(prev => ({...prev, isInWatchlist: !prev.isInWatchlist}));
      } else {
        const error = await res.text();
        alert(`Error: ${error}`);
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err);
      alert('Error toggling watchlist');
    }
  };

  const handleFavoriteToggle = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please login to favorite');
      return;
    }

    try {
      const res = await fetch('http://localhost:5011/api/users/me/favorite/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ MatchId: Number(id) }) // id string olabilir, number yap
      });

      if (res.ok) {
        // Backend'den dönen metin "Added to favorites" ya da "Removed from favorites" olabilir
        const message = await res.text();

        setUserActions(prev => ({
          ...prev,
          hasFavorited: message.includes('Added')
        }));
      } else {
        const error = await res.text();
        alert(`Error: ${error}`);
      }
    } catch (err) {
      console.error('Favorite toggle error:', err);
      alert('Error toggling favorite');
    }
  };





  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center text-red-600 py-8">Error: {error}</div>;
  if (!match) return <div className="text-center py-8">Match not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Maç Detayları */}
      <div className="bg-gray-800 text-white p-6 rounded-lg mb-6 relative">
        <Link href="/matches" className="absolute top-4 left-4 flex items-center text-sm hover:text-gray-300 transition-colors">
          <ArrowLeftIcon className="w-5 h-5 mr-1" />
          <span>Matches</span>
        </Link>

        <div className="absolute top-4 right-4 flex items-center text-sm">
          <EyeIcon className="w-5 h-5 mr-1" />
          <span>{watchedCount} watched</span>
        </div>

        <div className="text-center space-y-2 pt-8">
          <div className="text-2xl font-bold">{match.homeTeam}</div>
          <div className="text-xl">vs</div>
          <div className="text-2xl font-bold">{match.awayTeam}</div>

          {match.status === 'FINISHED' && (
            <div className="text-4xl font-bold my-3">
              {match.scoreHome} - {match.scoreAway}
            </div>
          )}

          <div className={`px-3 py-1 rounded-full inline-block ${
            match.status === 'FINISHED' ? 'bg-green-600' :
              match.status === 'CANCELED' ? 'bg-red-600' : 'bg-yellow-600'
          }`}>
            {match.status}
          </div>
        </div>

        <div className="text-center text-gray-300 mt-4">
          {new Date(match.matchDate).toLocaleString()}
        </div>
      </div>

      {/* Kullanıcı Aksiyonları */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={match.status === "FINISHED" ? handleWatchToggle : undefined}
          disabled={match.status !== "FINISHED"}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
            userActions.hasWatched
              ? 'bg-yellow-600 hover:bg-yellow-700'
              : 'bg-blue-600 hover:bg-blue-700'
          } ${match.status !== "FINISHED" ? 'opacity-50 cursor-not-allowed hover:bg-blue-600' : ''}`}
        >
          <EyeIcon className="h-5 w-5" />
          {userActions.hasWatched ? 'Unmark as Watched' : 'Mark as Watched'}
        </button>


        {/* Maç FINISHED değilse göster */}
        {match.status !== 'FINISHED' && (
          <button
            onClick={handleWatchlistToggle}
            className={`flex items-center gap-2 px-4 py-2 ${
              userActions.isInWatchlist ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white rounded-lg`}
          >
            <BookmarkIcon className="h-5 w-5" />
            {userActions.isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
        )}

        {userActions.hasFavorited ? (
          <button
            onClick={handleFavoriteToggle}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
          >
            <StarIcon className="h-5 w-5 text-yellow-400" />
            Remove from Favorites
          </button>
        ) : (
          <button
            onClick={handleFavoriteToggle}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            <StarIcon className="h-5 w-5" />
            Add to Favorites
          </button>
        )}
      </div>

      {/* Yorum ve Puanlama */}
      {match.status === 'FINISHED' && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Comments & Ratings</h2>

          {/* Yorum Ekleme */}
          <div className="mb-6 bg-gray-700 p-4 rounded-lg">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your comment..."
              className="w-full p-3 bg-gray-600 text-white border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-3"
              rows={3}
            />

            <div className="flex items-center justify-between">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <StarIcon
                      className={`w-6 h-6 mx-1 ${
                        star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                disabled={!comment.trim() && rating === 0}
              >
                Submit
              </button>
            </div>
          </div>

          {/* Yorum Listesi */}
          <div className="space-y-4">
            {match.comments
              .filter(comment => comment.content && comment.content.trim() !== '') // boş içerikleri filtrele
              .map((comment, idx) => {
                const commentRating = match.ratings.find(r => r.username === comment.username)?.score || 0;

                return (
                  <div key={idx} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-bold text-white">{comment.username}</h4>
                        <p className="text-gray-300 mt-1">{comment.content}</p>
                      </div>

                      <div className="flex flex-col items-end">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <StarIcon
                              key={star}
                              className={`w-5 h-5 ${
                                star <= commentRating ? 'text-yellow-400 fill-current' : 'text-gray-500'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-400 mt-1">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>


        </div>
      )}
    </div>
  );
}