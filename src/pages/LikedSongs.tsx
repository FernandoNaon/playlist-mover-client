import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Music,
  Search,
  Check,
  X,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fetchLikedSongs,
  migrateTracks,
  type LikedTrack,
  type MigrationResult,
  type TrackToMigrate,
} from "../lib/api";

export default function LikedSongs() {
  const { spotifyCode, isSpotifyConnected, tidalSessionId, isTidalConnected, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Tracks state
  const [tracks, setTracks] = useState<LikedTrack[]>([]);
  const [totalTracks, setTotalTracks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Selection state
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Migration state
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [playlistName, setPlaylistName] = useState("My Liked Songs");
  const [showNameInput, setShowNameInput] = useState(false);

  useEffect(() => {
    if (!authLoading && !isSpotifyConnected) {
      navigate("/");
    }
  }, [authLoading, isSpotifyConnected, navigate]);

  // Load initial liked songs
  useEffect(() => {
    if (!spotifyCode) return;

    const loadLikedSongs = async () => {
      setIsLoading(true);
      try {
        const data = await fetchLikedSongs(spotifyCode, 50, 0);
        setTracks(data.tracks);
        setTotalTracks(data.total);
        setHasMore(data.has_more);
      } catch (error) {
        console.error("Error fetching liked songs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLikedSongs();
  }, [spotifyCode]);

  // Load more songs
  const loadMore = async () => {
    if (!spotifyCode || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const data = await fetchLikedSongs(spotifyCode, 50, tracks.length);
      setTracks((prev) => [...prev, ...data.tracks]);
      setHasMore(data.has_more);
    } catch (error) {
      console.error("Error loading more songs:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Filter tracks by search query
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const query = searchQuery.toLowerCase();
    return tracks.filter(
      (track) =>
        track.name.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        track.album.toLowerCase().includes(query)
    );
  }, [tracks, searchQuery]);

  // Toggle track selection
  const toggleTrack = (trackId: string) => {
    setSelectedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  // Select all visible tracks
  const selectAll = () => {
    const visibleIds = new Set(filteredTracks.map((t) => t.id));
    setSelectedTracks(visibleIds);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedTracks(new Set());
  };

  // Handle migration
  const handleMigrate = async () => {
    if (!spotifyCode || !tidalSessionId || selectedTracks.size === 0) return;

    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const tracksToMigrate: TrackToMigrate[] = tracks
        .filter((t) => selectedTracks.has(t.id))
        .map((t) => ({
          name: t.name,
          artist: t.artists[0] || t.artist.split(",")[0].trim(),
          album: t.album,
        }));

      const result = await migrateTracks(
        spotifyCode,
        tidalSessionId,
        tracksToMigrate,
        playlistName
      );
      setMigrationResult(result);

      if (result.success) {
        setSelectedTracks(new Set());
        setShowNameInput(false);
      }
    } catch (error) {
      setMigrationResult({
        success: false,
        total_tracks: selectedTracks.size,
        migrated: 0,
        not_found: 0,
        not_found_tracks: [],
        error: error instanceof Error ? error.message : "Migration failed",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: 'var(--bg-cream)' }}>
        <div
          className="w-12 h-12 rounded-full animate-spin"
          style={{ border: '4px solid var(--green-pale)', borderTopColor: 'var(--green-primary)' }}
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto" style={{ background: 'var(--bg-cream)', minHeight: '100%' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--coral)', color: 'white' }}
          >
            <Heart className="w-8 h-8" />
          </div>
          <div>
            <h1 className="heading-lg" style={{ color: 'var(--text-dark)' }}>Liked Songs</h1>
            <p style={{ color: 'var(--text-medium)' }}>
              {totalTracks.toLocaleString()} songs in your library
            </p>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-light)' }} />
            <input
              type="text"
              placeholder="Search your liked songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl focus:outline-none"
              style={{
                background: 'var(--bg-warm)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-dark)'
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'var(--green-pale)', color: 'var(--green-primary)' }}
            >
              Select All ({filteredTracks.length})
            </button>
            {selectedTracks.size > 0 && (
              <button
                onClick={deselectAll}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ background: 'var(--bg-warm)', color: 'var(--text-medium)' }}
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selection Summary & Migrate Button */}
      {selectedTracks.size > 0 && (
        <div
          className="mb-6 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: 'var(--green-pale)', border: '1px solid var(--green-light)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'var(--green-primary)', color: 'white' }}
            >
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--green-primary)' }}>
                {selectedTracks.size} track{selectedTracks.size !== 1 ? "s" : ""} selected
              </p>
              <p className="text-sm" style={{ color: 'var(--text-medium)' }}>
                Ready to migrate to Tidal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {showNameInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Playlist name"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm focus:outline-none"
                  style={{
                    background: 'white',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-dark)'
                  }}
                />
                <button
                  onClick={() => setShowNameInput(false)}
                  className="p-2 rounded-lg"
                  style={{ color: 'var(--text-medium)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNameInput(true)}
                className="text-sm underline"
                style={{ color: 'var(--green-primary)' }}
              >
                Playlist: {playlistName}
              </button>
            )}

            {isTidalConnected ? (
              <button
                onClick={handleMigrate}
                disabled={isMigrating || selectedTracks.size === 0}
                className="btn-primary"
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    Migrate to Tidal
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => navigate("/settings")}
                className="btn-secondary"
              >
                Connect Tidal
              </button>
            )}
          </div>
        </div>
      )}

      {/* Migration Result */}
      {migrationResult && (
        <div
          className="mb-6 p-4 rounded-2xl"
          style={{
            background: migrationResult.success ? 'var(--green-pale)' : 'var(--peach)',
            border: migrationResult.success ? '1px solid var(--green-light)' : '1px solid var(--coral-light)'
          }}
        >
          <div className="flex items-start gap-3">
            {migrationResult.success ? (
              <Check className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--green-primary)' }} />
            ) : (
              <X className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--coral)' }} />
            )}
            <div>
              <h3 className="font-display font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>
                {migrationResult.success ? "Migration Complete!" : "Migration Failed"}
              </h3>
              {migrationResult.success ? (
                <p style={{ color: 'var(--text-medium)' }}>
                  Successfully migrated {migrationResult.migrated} of{" "}
                  {migrationResult.total_tracks} tracks to "{migrationResult.playlist_name}".
                  {migrationResult.not_found > 0 && (
                    <span style={{ color: 'var(--coral)' }}>
                      {" "}{migrationResult.not_found} tracks could not be found on Tidal.
                    </span>
                  )}
                </p>
              ) : (
                <p style={{ color: 'var(--coral)' }}>{migrationResult.error}</p>
              )}
              {migrationResult.not_found_tracks && migrationResult.not_found_tracks.length > 0 && (
                <details className="mt-2">
                  <summary className="text-sm cursor-pointer" style={{ color: 'var(--text-medium)' }}>
                    Show tracks not found ({migrationResult.not_found_tracks.length})
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {migrationResult.not_found_tracks.map((track, i) => (
                      <li key={i} className="text-sm" style={{ color: 'var(--text-light)' }}>
                        {track.name} - {track.artist}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Not connected warning */}
      {!isTidalConnected && (
        <div
          className="mb-6 p-4 rounded-2xl flex items-start gap-3"
          style={{ background: 'var(--peach)', border: '1px solid var(--coral-light)' }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--coral)' }} />
          <div>
            <p className="font-medium" style={{ color: 'var(--coral)' }}>Connect Tidal</p>
            <p className="text-sm" style={{ color: 'var(--text-medium)' }}>
              Go to Settings to connect your Tidal account before migrating songs.
            </p>
          </div>
        </div>
      )}

      {/* Tracks List */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div
          className="grid grid-cols-[auto_auto_1fr_1fr_auto_auto] gap-4 p-4 text-sm font-medium"
          style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-medium)' }}
        >
          <span className="w-10"></span>
          <span className="w-8">#</span>
          <span>Title</span>
          <span>Album</span>
          <span>Added</span>
          <span>Duration</span>
        </div>

        {/* Track list */}
        {isLoading ? (
          <div className="p-8 text-center">
            <div
              className="w-10 h-10 mx-auto rounded-full animate-spin mb-4"
              style={{ border: '3px solid var(--green-pale)', borderTopColor: 'var(--green-primary)' }}
            />
            <p style={{ color: 'var(--text-medium)' }}>Loading your liked songs...</p>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="p-8 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-light)' }} />
            <p style={{ color: 'var(--text-medium)' }}>
              {searchQuery ? "No songs match your search" : "No liked songs found"}
            </p>
          </div>
        ) : (
          <>
            <div className="max-h-[600px] overflow-auto">
              {filteredTracks.map((track, index) => {
                const isSelected = selectedTracks.has(track.id);
                return (
                  <div
                    key={track.id}
                    onClick={() => toggleTrack(track.id)}
                    className="grid grid-cols-[auto_auto_1fr_1fr_auto_auto] gap-4 p-4 items-center cursor-pointer transition-colors"
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      background: isSelected ? 'var(--green-pale)' : 'transparent',
                    }}
                    onMouseOver={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-warm)';
                    }}
                    onMouseOut={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Checkbox */}
                    <div className="w-10 flex justify-center">
                      <div
                        className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                        style={{
                          borderColor: isSelected ? 'var(--green-primary)' : 'var(--border-light)',
                          background: isSelected ? 'var(--green-primary)' : 'transparent',
                        }}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>

                    {/* Number */}
                    <span className="w-8 text-sm" style={{ color: 'var(--text-light)' }}>{index + 1}</span>

                    {/* Track info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {track.image ? (
                        <img
                          src={track.image}
                          alt={track.album}
                          className="w-10 h-10 rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--bg-warm)' }}
                        >
                          <Music className="w-5 h-5" style={{ color: 'var(--text-light)' }} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate" style={{ color: 'var(--text-dark)' }}>{track.name}</p>
                        <p className="text-sm truncate" style={{ color: 'var(--text-medium)' }}>
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    {/* Album */}
                    <p className="truncate" style={{ color: 'var(--text-medium)' }}>{track.album}</p>

                    {/* Added date */}
                    <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                      {formatDate(track.added_at)}
                    </p>

                    {/* Duration */}
                    <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                      {formatDuration(track.duration_ms)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && !searchQuery && (
              <div className="p-4 text-center" style={{ borderTop: '1px solid var(--border-light)' }}>
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-colors"
                  style={{ background: 'var(--bg-warm)', color: 'var(--text-dark)' }}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Load More ({tracks.length} of {totalTracks})
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
