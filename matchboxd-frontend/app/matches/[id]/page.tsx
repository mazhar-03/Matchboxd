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
  const [hoverStar, setHoverStar] = useState<number>(0);

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
      const res = await fetch('http://localhost:5011/api/users/me/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({MatchId: Number(id)}) // id string olabilir, number yap
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
        <Link href="/matches"
              className="absolute top-4 left-4 flex items-center text-sm hover:text-gray-300 transition-colors">
          <ArrowLeftIcon className="w-5 h-5 mr-1"/>
          <span>Matches</span>
        </Link>

        <div className="absolute top-4 right-4 flex items-center text-sm">
          <EyeIcon className="w-5 h-5 mr-1"/>
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
          onClick={handleWatchToggle}
          className={`flex items-center gap-2 px-4 py-2 ${
            userActions.hasWatched ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'
          } text-white rounded-lg`}
        >
          <EyeIcon className="h-5 w-5"/>
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
            <BookmarkIcon className="h-5 w-5"/>
            {userActions.isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
        )}

        {userActions.hasFavorited ? (
          <button
            onClick={handleFavoriteToggle}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
          >
            <StarIcon className="h-5 w-5 text-yellow-400"/>
            Remove from Favorites
          </button>
        ) : (
          <button
            onClick={handleFavoriteToggle}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            <StarIcon className="h-5 w-5"/>
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
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = rating >= star;
                  const isHalfFilled = !isFilled && rating >= star - 0.5;

                  return (
                    <div
                      key={star}
                      className="relative cursor-pointer"
                      onMouseEnter={() => setHoverStar(star)}
                      onMouseLeave={() => setHoverStar(0)}
                      onClick={(e) => {
                        const {left, width} = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - left;
                        const isHalf = x < width / 2;
                        setRating(isHalf ? star - 0.5 : star);
                      }}
                    >
                      {/* Boş yıldız arkaplanı */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="w-8 h-8 text-gray-300"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>

                      {/* Dolu kısım */}
                      <div
                        className={`absolute top-0 left-0 overflow-hidden 
            ${isFilled ? 'w-full' : isHalfFilled ? 'w-1/2' : 'w-0'}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-8 h-8 text-yellow-400"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  );
                })}
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
              .filter(comment => comment.content && comment.content.trim() !== '')
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
                          {[1, 2, 3, 4, 5].map(star => {
                            const isFilled = commentRating >= star;
                            const isHalfFilled = !isFilled && commentRating >= star - 0.5;

                            return (
                              <div key={star} className="relative w-5 h-5">
                                {/* Boş yıldız arkaplanı */}
                                <StarIcon className={`absolute w-5 h-5 text-gray-500`}/>

                                {/* Dolu kısım */}
                                <div
                                  className={`absolute top-0 left-0 overflow-hidden 
                          ${isFilled ? 'w-full' : isHalfFilled ? 'w-1/2' : 'w-0'}`}
                                >
                                  <StarIcon className={`w-5 h-5 text-yellow-400 fill-current`}/>
                                </div>
                              </div>
                            );
                          })}
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