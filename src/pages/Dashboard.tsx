import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Music,
  Disc3,
  Users,
  ListMusic,
  Clock,
  TrendingUp,
  Play,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getTopTracks,
  getTopArtists,
  getRecentlyPlayed,
  getLibraryStats,
  type TopTrack,
  type TopArtist,
  type RecentTrack,
  type LibraryStats,
  type TimeRange,
} from "../lib/api";

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: "short_term", label: "Last 4 weeks" },
  { value: "medium_term", label: "Last 6 months" },
  { value: "long_term", label: "All time" },
];

export default function Dashboard() {
  const {
    spotifyCode,
    spotifyUser,
    isSpotifyConnected,
    isTidalConnected,
    tidalUser,
    isLoading: authLoading,
  } = useAuth();
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  const [topTracks, setTopTracks] = useState<TopTrack[]>([]);
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isSpotifyConnected) {
      navigate("/");
    }
  }, [authLoading, isSpotifyConnected, navigate]);

  useEffect(() => {
    if (!spotifyCode) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [tracks, artists, recent, libraryStats] = await Promise.all([
          getTopTracks(spotifyCode, timeRange, 10),
          getTopArtists(spotifyCode, timeRange, 10),
          getRecentlyPlayed(spotifyCode, 10),
          getLibraryStats(spotifyCode),
        ]);
        setTopTracks(tracks);
        setTopArtists(artists);
        setRecentTracks(recent);
        setStats(libraryStats);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [spotifyCode, timeRange]);

  const formatPlayedAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      icon: Music,
      label: "Saved Tracks",
      value: stats?.saved_tracks ?? "-",
      color: "green",
    },
    {
      icon: ListMusic,
      label: "Playlists",
      value: stats?.playlists ?? "-",
      color: "blue",
    },
    {
      icon: Disc3,
      label: "Saved Albums",
      value: stats?.saved_albums ?? "-",
      color: "purple",
    },
    {
      icon: Users,
      label: "Following",
      value: stats?.followed_artists ?? "-",
      color: "pink",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {spotifyUser?.display_name?.split(" ")[0] || "there"}!
        </h1>
      </div>

      {/* Quick Actions - Sync to Tidal */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {/* Spotify Status Card */}
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-2xl p-6 border border-green-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-green-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Spotify</h3>
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Connected
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            {stats?.playlists ?? 0} playlists • {stats?.saved_tracks ?? 0} saved
            tracks
          </p>
          <Link
            to="/playlists"
            className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium"
          >
            View Playlists
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tidal Status/Sync Card */}
        <div
          className={`rounded-2xl p-6 border ${
            isTidalConnected
              ? "bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-500/20"
              : "bg-gray-900 border-gray-800"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isTidalConnected ? "bg-cyan-500/20" : "bg-gray-800"
                }`}
              >
                <svg
                  className={`w-7 h-7 ${isTidalConnected ? "text-cyan-400" : "text-gray-500"}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004L0 16.004l4.004 4.004 4.004-4.004 4.004 4.004 4.004-4.004-4.004-4.004 4.004-4.004-4.004-4.004zm4.004 4.004l4.004-4.004L24.024 7.996l-4.004 4.004 4.004 4.004-4.004 4.004-4.004-4.004z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Tidal</h3>
                {isTidalConnected ? (
                  <div className="flex items-center gap-2 text-sm text-cyan-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Connected as {tidalUser?.name}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <XCircle className="w-4 h-4" />
                    Not connected
                  </div>
                )}
              </div>
            </div>
          </div>

          {isTidalConnected ? (
            <>
              <p className="text-gray-400 text-sm mb-4">
                Ready to sync your playlists from Spotify to Tidal
              </p>
              <Link
                to="/playlists"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Sync Playlists
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-4">
                Connect Tidal to transfer your Spotify playlists
              </p>
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                Connect Tidal
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </div>

        <p className="text-gray-400 mb-6">Here's your Spotify listening activity</p>


      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center mb-3`}
            >
              <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
            </div>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <span className="inline-block w-16 h-6 bg-gray-800 rounded animate-pulse" />
              ) : (
                stat.value.toLocaleString()
              )}
            </p>
            <p className="text-gray-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-gray-400" />
        <span className="text-gray-400 mr-2">Time period:</span>
        {timeRangeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setTimeRange(option.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              timeRange === option.value
                ? "bg-green-500 text-black"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Tracks */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold flex items-center gap-2">
              <Music className="w-5 h-5 text-green-400" />
              Top Tracks
            </h2>
          </div>
          <div className="divide-y divide-gray-800">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-800 rounded animate-pulse" />
                    <div className="flex-1">
                      <div className="w-32 h-4 bg-gray-800 rounded animate-pulse mb-2" />
                      <div className="w-24 h-3 bg-gray-800 rounded animate-pulse" />
                    </div>
                  </div>
                ))
              : topTracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="p-4 flex items-center gap-3 hover:bg-gray-800/50 transition-colors group"
                  >
                    <span className="text-gray-500 w-6 text-center text-sm">
                      {index + 1}
                    </span>
                    {track.image ? (
                      <img
                        src={track.image}
                        alt={track.album}
                        className="w-12 h-12 rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
                        <Music className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{track.name}</p>
                      <p className="text-sm text-gray-400 truncate">
                        {track.artist}
                      </p>
                    </div>
                    <Play className="w-5 h-5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
          </div>
        </div>

        {/* Top Artists */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Top Artists
            </h2>
          </div>
          <div className="divide-y divide-gray-800">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-800 rounded-full animate-pulse" />
                    <div className="flex-1">
                      <div className="w-32 h-4 bg-gray-800 rounded animate-pulse mb-2" />
                      <div className="w-24 h-3 bg-gray-800 rounded animate-pulse" />
                    </div>
                  </div>
                ))
              : topArtists.map((artist, index) => (
                  <div
                    key={artist.id}
                    className="p-4 flex items-center gap-3 hover:bg-gray-800/50 transition-colors"
                  >
                    <span className="text-gray-500 w-6 text-center text-sm">
                      {index + 1}
                    </span>
                    {artist.image ? (
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{artist.name}</p>
                      <p className="text-sm text-gray-400 truncate">
                        {artist.genres.slice(0, 2).join(", ") || "No genres"}
                      </p>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Recently Played */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Recently Played
            </h2>
          </div>
          <div className="divide-y divide-gray-800">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-800 rounded animate-pulse" />
                    <div className="flex-1">
                      <div className="w-32 h-4 bg-gray-800 rounded animate-pulse mb-2" />
                      <div className="w-24 h-3 bg-gray-800 rounded animate-pulse" />
                    </div>
                  </div>
                ))
              : recentTracks.map((track, index) => (
                  <div
                    key={`${track.id}-${index}`}
                    className="p-4 flex items-center gap-3 hover:bg-gray-800/50 transition-colors"
                  >
                    {track.image ? (
                      <img
                        src={track.image}
                        alt={track.album}
                        className="w-12 h-12 rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
                        <Music className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{track.name}</p>
                      <p className="text-sm text-gray-400 truncate">
                        {track.artist}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatPlayedAt(track.played_at)}
                    </span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
