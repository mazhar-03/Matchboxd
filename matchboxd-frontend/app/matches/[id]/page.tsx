'use client';

import React, {useEffect, useState} from 'react';
import {useParams} from 'next/navigation';
import {StarIcon, EyeIcon, BookmarkIcon, ChatBubbleLeftIcon} from '@heroicons/react/24/solid';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Fetching match details for id: ${id}`);
        const matchRes = await fetch(`http://localhost:5011/api/matches/${id}`);
        console.log('Match details response status:', matchRes.status);
        if (!matchRes.ok) throw new Error('Failed to fetch match');
        const matchData: Match = await matchRes.json();
        setMatch(matchData);
        console.log('Match data:', matchData);

        const token = localStorage.getItem('authToken');
        console.log('Token from localStorage:', token);
        if (token) {
          console.log('Fetching user actions for match');
          const actionsRes = await fetch(`http://localhost:5011/api/matches/${id}/user-actions`, {
            headers: {'Authorization': `Bearer ${token}`}
          });
          console.log('User actions response status:', actionsRes.status);
          if (actionsRes.ok) {
            const actionsData = await actionsRes.json();
            console.log('User actions data:', actionsData);
            setUserActions(actionsData);
            if (actionsData.userRating) setRating(actionsData.userRating);
          } else {
            console.warn('Failed to fetch user actions:', await actionsRes.text());
          }
        } else {
          console.warn('No token found in localStorage');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleWatch = async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('handleWatch token:', token);
      if (!token) {
        alert('Please login to mark as watched');
        return;
      }

      const res = await fetch(`http://localhost:5011/api/matches/${id}/watch`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${token}`}
      });
      console.log('Mark as watched response status:', res.status);

      const text = await res.text();
      console.log('Mark as watched response text:', text);

      if (res.ok) {
        setUserActions(prev => ({...prev, hasWatched: true}));
        alert('Match marked as watched!');
      } else {
        alert(text);
      }
    } catch (err) {
      console.error('Error marking as watched:', err);
      alert('Error marking as watched');
    }
  };

  const handleRateAndComment = async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('handleRateAndComment token:', token);
      if (!token) {
        alert('Please login to rate and comment');
        return;
      }

      const res = await fetch(`http://localhost:5011/api/matches/${id}/rate-comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          score: rating,
          content: comment
        })
      });

      console.log('Rate and comment response status:', res.status);
      const text = await res.text();
      console.log('Rate and comment response text:', text);

      if (res.ok) {
        alert('Rating and comment submitted!');
        window.location.reload();
      } else {
        alert(text);
      }
    } catch (err) {
      console.error('Error submitting rating/comment:', err);
      alert('Error submitting rating/comment');
    }
  };

  const handleWatchlist = async (action: 'add' | 'remove') => {
    try {
      const token = localStorage.getItem('authToken');
      console.log(`handleWatchlist token: ${token}, action: ${action}`);
      if (!token) {
        alert('Please login to modify watchlist');
        return;
      }

      const res = await fetch(`http://localhost:5011/api/watchlist/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({matchId: id})
      });

      console.log(`Watchlist ${action} response status:`, res.status);
      const text = await res.text();
      console.log(`Watchlist ${action} response text:`, text);

      if (res.ok) {
        setUserActions(prev => ({...prev, isInWatchlist: action === 'add'}));
        alert(`Match ${action === 'add' ? 'added to' : 'removed from'} watchlist!`);
      } else {
        alert(text);
      }
    } catch (err) {
      console.error('Error modifying watchlist:', err);
      alert('Error modifying watchlist');
    }
  };

  const handleFavorite = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please login to add to favorites');
        return;
      }

      const res = await fetch(`http://localhost:5011/api/matches/${id}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      const text = await res.text();
      if (res.ok) {
        setUserActions(prev => ({...prev, hasFavorited: true}));
        alert('Match added to favorites!');
      } else {
        alert(text);
      }
    } catch (err) {
      console.error('Error favoriting match:', err);
      alert('Error favoriting match');
    }
  };

  if (loading) return <div className="text-center py-8">Loading match details...</div>;
  if (error) return <div className="text-center text-red-600 py-8">Error: {error}</div>;
  if (!match) return <div className="text-center py-8">Match not found</div>;


  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Maç Başlığı */}
      <div className="bg-gray-800 text-white p-6 rounded-lg mb-6">
        <h1 className="text-3xl font-bold text-center">
          {match.homeTeam} vs {match.awayTeam}
        </h1>
        <div className="flex justify-between items-center mt-4">
          <span className="text-gray-300">
            {new Date(match.matchDate).toLocaleString()}
          </span>
          <span className={`px-3 py-1 rounded-full ${
            match.status === 'FINISHED' ? 'bg-green-600' :
              match.status === 'CANCELED' ? 'bg-red-600' : 'bg-yellow-600'
          }`}>
            {match.status}
          </span>
        </div>

        {match.status === 'FINISHED' && (
          <div className="text-center text-4xl font-bold my-4">
            {match.scoreHome} - {match.scoreAway}
          </div>
        )}
      </div>

      {/* Kullanıcı Aksiyon Butonları */}
      <div className="flex flex-wrap gap-4 mb-8">
        {match.status === 'FINISHED' ? (
          <>
            {!userActions.hasWatched && (
              <button
                onClick={handleWatch}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <EyeIcon className="h-5 w-5"/>
                Mark as Watched
              </button>
            )}

            <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`h-6 w-6 cursor-pointer ${
                    star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-400'
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>

            <button
              onClick={handleRateAndComment}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              <ChatBubbleLeftIcon className="h-5 w-5"/>
              {userActions.userRating ? 'Update Rating' : 'Submit Rating'}
            </button>
          </>
        ) : (
          <button
            onClick={() => handleWatchlist(userActions.isInWatchlist ? 'remove' : 'add')}
            className={`flex items-center gap-2 px-4 py-2 ${
              userActions.isInWatchlist
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            } text-white rounded-lg`}
          >
            <BookmarkIcon className="h-5 w-5"/>
            {userActions.isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
        )}

        <button
          onClick={handleFavorite}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
          disabled={userActions.hasFavorited}
        >
          <StarIcon className="h-5 w-5"/>
          {userActions.hasFavorited ? 'Favorited' : 'Add to Favorites'}
        </button>

      </div>

      {/* Yorum Bölümü */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Comments & Ratings</h2>
        {match.status === 'FINISHED' && (
          <>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your comment..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-3"
              rows={3}
            />

            <div className="space-y-4">
              {match.comments.map((comment, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg shadow">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-bold">{comment.username}</h4>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                    <div className="flex items-center">
                      {match.ratings[idx] && (
                        <div className="flex">
                          {Array.from({length: match.ratings[idx].score}).map((_, i) => (
                            <StarIcon key={i} className="h-4 w-4 text-yellow-500"/>
                          ))}
                        </div>
                      )}
                      <span className="text-sm text-gray-500 ml-2">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}