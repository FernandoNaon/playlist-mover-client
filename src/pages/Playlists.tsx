import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ListMusic,
  Music,
  ArrowRight,
  Check,
  X,
  AlertCircle,
  Search,
  ExternalLink,
  RefreshCw,
  Trash2,
  Merge,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fetchPlaylists,
  fetchPlaylistTracks,
  fetchTidalPlaylists,
  fetchTidalPlaylistTracks,
  migratePlaylist,
  deleteTidalPlaylist,
  mergeTidalPlaylists,
  type Playlist,
  type Track,
  type TidalPlaylist,
  type TidalTrack,
  type MigrationResult,
  type MergePlaylistsResult,
} from "../lib/api";

export default function Playlists() {
  const { spotifyCode, isSpotifyConnected, tidalSessionId, isTidalConnected, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Spotify state
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<Playlist[]>([]);
  const [filteredSpotifyPlaylists, setFilteredSpotifyPlaylists] = useState<Playlist[]>([]);
  const [spotifySearchQuery, setSpotifySearchQuery] = useState("");
  const [selectedSpotifyPlaylist, setSelectedSpotifyPlaylist] = useState<Playlist | null>(null);
  const [spotifyTracks, setSpotifyTracks] = useState<Track[]>([]);
  const [isLoadingSpotify, setIsLoadingSpotify] = useState(true);
  const [isLoadingSpotifyTracks, setIsLoadingSpotifyTracks] = useState(false);

  // Tidal state
  const [tidalPlaylists, setTidalPlaylists] = useState<TidalPlaylist[]>([]);
  const [filteredTidalPlaylists, setFilteredTidalPlaylists] = useState<TidalPlaylist[]>([]);
  const [tidalSearchQuery, setTidalSearchQuery] = useState("");
  const [selectedTidalPlaylist, setSelectedTidalPlaylist] = useState<TidalPlaylist | null>(null);
  const [tidalTracks, setTidalTracks] = useState<TidalTrack[]>([]);
  const [isLoadingTidal, setIsLoadingTidal] = useState(false);
  const [isLoadingTidalTracks, setIsLoadingTidalTracks] = useState(false);

  // Migration state
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Merge state
  const [isMerging, setIsMerging] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<TidalPlaylist | null>(null);
  const [mergeResult, setMergeResult] = useState<MergePlaylistsResult | null>(null);

  // Active view state
  const [activeView, setActiveView] = useState<"spotify" | "tidal" | null>(null);

  useEffect(() => {
    if (!authLoading && !isSpotifyConnected) {
      navigate("/");
    }
  }, [authLoading, isSpotifyConnected, navigate]);

  // Load Spotify playlists
  useEffect(() => {
    if (!spotifyCode) return;

    const loadPlaylists = async () => {
      try {
        const data = await fetchPlaylists(spotifyCode);
        setSpotifyPlaylists(data);
        setFilteredSpotifyPlaylists(data);
      } catch (error) {
        console.error("Error fetching Spotify playlists:", error);
      } finally {
        setIsLoadingSpotify(false);
      }
    };

    loadPlaylists();
  }, [spotifyCode]);

  // Load Tidal playlists
  useEffect(() => {
    if (!tidalSessionId || !isTidalConnected) return;

    const loadTidalPlaylists = async () => {
      setIsLoadingTidal(true);
      try {
        const data = await fetchTidalPlaylists(tidalSessionId);
        setTidalPlaylists(data);
        setFilteredTidalPlaylists(data);
      } catch (error) {
        console.error("Error fetching Tidal playlists:", error);
      } finally {
        setIsLoadingTidal(false);
      }
    };

    loadTidalPlaylists();
  }, [tidalSessionId, isTidalConnected]);

  // Filter Spotify playlists
  useEffect(() => {
    const query = spotifySearchQuery.toLowerCase();
    setFilteredSpotifyPlaylists(
      spotifyPlaylists.filter((p) => p.name.toLowerCase().includes(query))
    );
  }, [spotifySearchQuery, spotifyPlaylists]);

  // Filter Tidal playlists
  useEffect(() => {
    const query = tidalSearchQuery.toLowerCase();
    setFilteredTidalPlaylists(
      tidalPlaylists.filter((p) => p.name.toLowerCase().includes(query))
    );
  }, [tidalSearchQuery, tidalPlaylists]);

  const handleSelectSpotifyPlaylist = async (playlist: Playlist) => {
    if (!spotifyCode) return;

    // Cancel merge mode when selecting Spotify playlist
    if (mergeMode) {
      setMergeMode(false);
      setMergeTarget(null);
    }

    setSelectedSpotifyPlaylist(playlist);
    setSelectedTidalPlaylist(null);
    setSpotifyTracks([]);
    setTidalTracks([]);
    setMigrationResult(null);
    setMergeResult(null);
    setShowDeleteConfirm(false);
    setIsLoadingSpotifyTracks(true);
    setActiveView("spotify");

    try {
      const data = await fetchPlaylistTracks(spotifyCode, playlist.id);
      setSpotifyTracks(data);
    } catch (error) {
      console.error("Error fetching Spotify tracks:", error);
    } finally {
      setIsLoadingSpotifyTracks(false);
    }
  };

  const handleSelectTidalPlaylist = async (playlist: TidalPlaylist) => {
    if (!tidalSessionId) return;

    // If in merge mode, handle merge target selection
    if (mergeMode && mergeTarget) {
      if (playlist.id === mergeTarget.id) {
        // Can't merge with itself
        return;
      }
      // Perform merge
      await handleMerge(playlist);
      return;
    }

    setSelectedTidalPlaylist(playlist);
    setSelectedSpotifyPlaylist(null);
    setTidalTracks([]);
    setSpotifyTracks([]);
    setMigrationResult(null);
    setMergeResult(null);
    setShowDeleteConfirm(false);
    setIsLoadingTidalTracks(true);
    setActiveView("tidal");

    try {
      const data = await fetchTidalPlaylistTracks(tidalSessionId, playlist.id);
      setTidalTracks(data);
    } catch (error) {
      console.error("Error fetching Tidal tracks:", error);
    } finally {
      setIsLoadingTidalTracks(false);
    }
  };

  const handleMigrate = async () => {
    if (!spotifyCode || !tidalSessionId || !selectedSpotifyPlaylist) return;

    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const result = await migratePlaylist(
        spotifyCode,
        tidalSessionId,
        selectedSpotifyPlaylist.id,
        selectedSpotifyPlaylist.name
      );
      setMigrationResult(result);

      // Refresh Tidal playlists after successful migration
      if (result.success) {
        const data = await fetchTidalPlaylists(tidalSessionId);
        setTidalPlaylists(data);
        setFilteredTidalPlaylists(data);
      }
    } catch (error) {
      setMigrationResult({
        success: false,
        total_tracks: 0,
        migrated: 0,
        not_found: 0,
        not_found_tracks: [],
        error: error instanceof Error ? error.message : "Migration failed",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDelete = async () => {
    if (!tidalSessionId || !selectedTidalPlaylist) return;

    setIsDeleting(true);

    try {
      await deleteTidalPlaylist(tidalSessionId, selectedTidalPlaylist.id);

      // Refresh Tidal playlists
      const data = await fetchTidalPlaylists(tidalSessionId);
      setTidalPlaylists(data);
      setFilteredTidalPlaylists(data);

      // Clear selection
      setSelectedTidalPlaylist(null);
      setTidalTracks([]);
      setActiveView(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting playlist:", error);
      alert("Failed to delete playlist: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const startMergeMode = () => {
    if (!selectedTidalPlaylist) return;
    setMergeMode(true);
    setMergeTarget(selectedTidalPlaylist);
    setMergeResult(null);
  };

  const cancelMergeMode = () => {
    setMergeMode(false);
    setMergeTarget(null);
  };

  const handleMerge = async (sourcePlaylist: TidalPlaylist) => {
    if (!tidalSessionId || !mergeTarget) return;

    setIsMerging(true);

    try {
      const result = await mergeTidalPlaylists(
        tidalSessionId,
        sourcePlaylist.id,  // Source (will be deleted)
        mergeTarget.id      // Target (will keep)
      );
      setMergeResult(result);

      // Refresh Tidal playlists
      const data = await fetchTidalPlaylists(tidalSessionId);
      setTidalPlaylists(data);
      setFilteredTidalPlaylists(data);

      // Refresh the target playlist tracks
      const tracks = await fetchTidalPlaylistTracks(tidalSessionId, mergeTarget.id);
      setTidalTracks(tracks);

      // Update selected playlist with new data
      const updatedTarget = data.find(p => p.id === mergeTarget.id);
      if (updatedTarget) {
        setSelectedTidalPlaylist(updatedTarget);
      }

      // Exit merge mode
      setMergeMode(false);
      setMergeTarget(null);
    } catch (error) {
      console.error("Error merging playlists:", error);
      alert("Failed to merge playlists: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsMerging(false);
    }
  };

  const refreshTidalPlaylists = async () => {
    if (!tidalSessionId) return;

    setIsLoadingTidal(true);
    try {
      const data = await fetchTidalPlaylists(tidalSessionId);
      setTidalPlaylists(data);
      setFilteredTidalPlaylists(data);
    } catch (error) {
      console.error("Error refreshing Tidal playlists:", error);
    } finally {
      setIsLoadingTidal(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  const PlaylistSkeleton = () => (
    <div className="p-4 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-800 rounded animate-pulse" />
          <div className="flex-1">
            <div className="w-32 h-4 bg-gray-800 rounded animate-pulse mb-2" />
            <div className="w-20 h-3 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );

  const TrackSkeleton = () => (
    <div className="divide-y divide-gray-800">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 p-4 items-center"
        >
          <div className="w-8 h-4 bg-gray-800 rounded animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-800 rounded animate-pulse" />
            <div>
              <div className="w-32 h-4 bg-gray-800 rounded animate-pulse mb-2" />
              <div className="w-24 h-3 bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-24 h-4 bg-gray-800 rounded animate-pulse" />
          <div className="w-12 h-4 bg-gray-800 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Merge Mode Banner */}
      {mergeMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-purple-600 text-white py-3 px-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <Merge className="w-5 h-5" />
            <span>
              <strong>Merge Mode:</strong> Select a playlist to merge INTO "{mergeTarget?.name}".
              The selected playlist's tracks will be added and it will be deleted.
            </span>
          </div>
          <button
            onClick={cancelMergeMode}
            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Spotify Playlists Column */}
      <div className={`w-72 border-r border-gray-800 flex flex-col ${mergeMode ? 'mt-14' : ''}`}>
        <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-green-500/10 to-transparent">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <ListMusic className="w-4 h-4 text-black" />
            </div>
            Spotify Playlists
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              value={spotifySearchQuery}
              onChange={(e) => setSpotifySearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoadingSpotify ? (
            <PlaylistSkeleton />
          ) : filteredSpotifyPlaylists.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <ListMusic className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No playlists found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredSpotifyPlaylists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleSelectSpotifyPlaylist(playlist)}
                  disabled={mergeMode}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left ${
                    selectedSpotifyPlaylist?.id === playlist.id ? "bg-green-500/10 border-l-2 border-green-500" : ""
                  } ${mergeMode ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {playlist.image ? (
                    <img
                      src={playlist.image}
                      alt={playlist.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
                      <ListMusic className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{playlist.name}</p>
                    <p className="text-xs text-gray-400">
                      {playlist.tracks_total} tracks
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t border-gray-800 bg-gray-900/50">
          <p className="text-xs text-gray-500 text-center">
            {spotifyPlaylists.length} playlists
          </p>
        </div>
      </div>

      {/* Center - Selected Playlist Details */}
      <div className={`flex-1 overflow-auto ${mergeMode ? 'mt-14' : ''}`}>
        {selectedSpotifyPlaylist && activeView === "spotify" ? (
          <div className="p-6">
            {/* Spotify Playlist Header */}
            <div className="flex items-start gap-6 mb-8">
              {selectedSpotifyPlaylist.image ? (
                <img
                  src={selectedSpotifyPlaylist.image}
                  alt={selectedSpotifyPlaylist.name}
                  className="w-40 h-40 rounded-xl object-cover shadow-xl"
                />
              ) : (
                <div className="w-40 h-40 bg-gray-800 rounded-xl flex items-center justify-center">
                  <ListMusic className="w-12 h-12 text-gray-600" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                    Spotify
                  </span>
                </div>
                <h1 className="text-3xl font-bold mb-2">{selectedSpotifyPlaylist.name}</h1>
                <p className="text-gray-400 mb-4">
                  {selectedSpotifyPlaylist.owner} • {selectedSpotifyPlaylist.tracks_total} tracks
                </p>

                {/* Migration Button */}
                {isTidalConnected ? (
                  <button
                    onClick={handleMigrate}
                    disabled={isMigrating || spotifyTracks.length === 0}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-black font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMigrating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-full transition-all"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Connect Tidal to migrate
                  </button>
                )}
              </div>
            </div>

            {/* Migration Result */}
            {migrationResult && (
              <div
                className={`p-4 rounded-xl mb-6 ${
                  migrationResult.success
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  {migrationResult.success ? (
                    <Check className="w-6 h-6 text-green-400 flex-shrink-0" />
                  ) : (
                    <X className="w-6 h-6 text-red-400 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="font-semibold mb-1">
                      {migrationResult.success
                        ? "Migration Complete!"
                        : "Migration Failed"}
                    </h3>
                    {migrationResult.success ? (
                      <p className="text-gray-400 text-sm">
                        Successfully migrated {migrationResult.migrated} of{" "}
                        {migrationResult.total_tracks} tracks.
                        {migrationResult.not_found > 0 && (
                          <span className="text-yellow-400">
                            {" "}
                            {migrationResult.not_found} tracks could not be found on
                            Tidal.
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-red-400 text-sm">{migrationResult.error}</p>
                    )}
                    {migrationResult.not_found_tracks.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-400 cursor-pointer hover:text-white">
                          Show tracks not found ({migrationResult.not_found_tracks.length})
                        </summary>
                        <ul className="mt-2 space-y-1">
                          {migrationResult.not_found_tracks.map((track, i) => (
                            <li key={i} className="text-sm text-gray-500">
                              • {track.name} - {track.artist}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Spotify Tracks */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 p-4 border-b border-gray-800 text-gray-400 text-sm">
                <span className="w-8">#</span>
                <span>Title</span>
                <span>Album</span>
                <span>Duration</span>
              </div>

              {isLoadingSpotifyTracks ? (
                <TrackSkeleton />
              ) : (
                <div className="divide-y divide-gray-800 max-h-[500px] overflow-auto">
                  {spotifyTracks.map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 p-4 items-center hover:bg-gray-800/50 transition-colors"
                    >
                      <span className="w-8 text-gray-500 text-sm">{index + 1}</span>
                      <div className="flex items-center gap-3 min-w-0">
                        {track.image ? (
                          <img
                            src={track.image}
                            alt={track.album}
                            className="w-10 h-10 rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
                            <Music className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{track.name}</p>
                          <p className="text-sm text-gray-400 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-400 truncate">{track.album}</p>
                      <p className="text-gray-500 text-sm">
                        {formatDuration(track.duration_ms)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : selectedTidalPlaylist && activeView === "tidal" ? (
          <div className="p-6">
            {/* Tidal Playlist Header */}
            <div className="flex items-start gap-6 mb-8">
              {selectedTidalPlaylist.image ? (
                <img
                  src={selectedTidalPlaylist.image}
                  alt={selectedTidalPlaylist.name}
                  className="w-40 h-40 rounded-xl object-cover shadow-xl"
                />
              ) : (
                <div className="w-40 h-40 bg-gray-800 rounded-xl flex items-center justify-center">
                  <ListMusic className="w-12 h-12 text-gray-600" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full font-medium">
                    Tidal
                  </span>
                </div>
                <h1 className="text-3xl font-bold mb-2">{selectedTidalPlaylist.name}</h1>
                <p className="text-gray-400 mb-4">
                  {selectedTidalPlaylist.tracks_total} tracks
                  {selectedTidalPlaylist.description && (
                    <span className="block text-sm mt-1">{selectedTidalPlaylist.description}</span>
                  )}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={startMergeMode}
                    disabled={isMerging}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-semibold rounded-full transition-all disabled:opacity-50"
                  >
                    <Merge className="w-4 h-4" />
                    Merge Another Playlist
                  </button>

                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 text-sm">Delete this playlist?</span>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-full transition-all disabled:opacity-50"
                      >
                        {isDeleting ? "Deleting..." : "Yes, Delete"}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-full transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-full transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Playlist
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Merge Result */}
            {mergeResult && (
              <div
                className={`p-4 rounded-xl mb-6 ${
                  mergeResult.success
                    ? "bg-purple-500/10 border border-purple-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  {mergeResult.success ? (
                    <Check className="w-6 h-6 text-purple-400 flex-shrink-0" />
                  ) : (
                    <X className="w-6 h-6 text-red-400 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="font-semibold mb-1">
                      {mergeResult.success ? "Merge Complete!" : "Merge Failed"}
                    </h3>
                    {mergeResult.success ? (
                      <p className="text-gray-400 text-sm">
                        Added {mergeResult.tracks_added} tracks to this playlist.
                        {mergeResult.tracks_skipped > 0 && (
                          <span className="text-yellow-400">
                            {" "}{mergeResult.tracks_skipped} duplicate tracks were skipped.
                          </span>
                        )}
                        {" "}The source playlist has been deleted.
                      </p>
                    ) : (
                      <p className="text-red-400 text-sm">{mergeResult.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tidal Tracks */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 p-4 border-b border-gray-800 text-gray-400 text-sm">
                <span className="w-8">#</span>
                <span>Title</span>
                <span>Album</span>
                <span>Duration</span>
              </div>

              {isLoadingTidalTracks ? (
                <TrackSkeleton />
              ) : (
                <div className="divide-y divide-gray-800 max-h-[500px] overflow-auto">
                  {tidalTracks.map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 p-4 items-center hover:bg-gray-800/50 transition-colors"
                    >
                      <span className="w-8 text-gray-500 text-sm">{index + 1}</span>
                      <div className="flex items-center gap-3 min-w-0">
                        {track.image ? (
                          <img
                            src={track.image}
                            alt={track.album}
                            className="w-10 h-10 rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
                            <Music className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{track.name}</p>
                          <p className="text-sm text-gray-400 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-400 truncate">{track.album}</p>
                      <p className="text-gray-500 text-sm">
                        {formatDuration(track.duration_ms)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500/20 to-cyan-500/20 flex items-center justify-center mb-6">
              <ListMusic className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Select a Playlist</h2>
            <p className="text-gray-400 max-w-md">
              Choose a playlist from Spotify or Tidal to view its tracks. Select a Spotify playlist to migrate it to Tidal.
            </p>
            {!isTidalConnected && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3 max-w-md">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium text-yellow-400">Connect Tidal</p>
                  <p className="text-sm text-gray-400">
                    Go to Settings to connect your Tidal account to see your Tidal playlists and migrate from Spotify.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tidal Playlists Column */}
      <div className={`w-72 border-l border-gray-800 flex flex-col ${mergeMode ? 'mt-14' : ''}`}>
        <div className="p-4 border-b border-gray-800 bg-gradient-to-l from-cyan-500/10 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                <ListMusic className="w-4 h-4 text-black" />
              </div>
              Tidal Playlists
            </h2>
            {isTidalConnected && (
              <button
                onClick={refreshTidalPlaylists}
                disabled={isLoadingTidal}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh playlists"
              >
                <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoadingTidal ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
          {isTidalConnected ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={tidalSearchQuery}
                onChange={(e) => setTidalSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          ) : (
            <button
              onClick={() => navigate("/settings")}
              className="w-full py-2 px-4 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium transition-colors"
            >
              Connect Tidal
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {!isTidalConnected ? (
            <div className="p-4 text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-800 flex items-center justify-center">
                <ListMusic className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-sm mb-2">Not connected</p>
              <p className="text-xs text-gray-600">
                Connect your Tidal account in Settings to see your playlists
              </p>
            </div>
          ) : isLoadingTidal ? (
            <PlaylistSkeleton />
          ) : filteredTidalPlaylists.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <ListMusic className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No playlists found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredTidalPlaylists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleSelectTidalPlaylist(playlist)}
                  disabled={isMerging || (mergeMode && playlist.id === mergeTarget?.id)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left ${
                    selectedTidalPlaylist?.id === playlist.id && !mergeMode ? "bg-cyan-500/10 border-r-2 border-cyan-500" : ""
                  } ${mergeMode && playlist.id === mergeTarget?.id ? "bg-purple-500/20 border-r-2 border-purple-500" : ""}
                  ${mergeMode && playlist.id !== mergeTarget?.id ? "hover:bg-purple-500/10 cursor-pointer" : ""}
                  ${isMerging || (mergeMode && playlist.id === mergeTarget?.id) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {playlist.image ? (
                    <img
                      src={playlist.image}
                      alt={playlist.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
                      <ListMusic className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{playlist.name}</p>
                    <p className="text-xs text-gray-400">
                      {playlist.tracks_total} tracks
                    </p>
                  </div>
                  {mergeMode && playlist.id === mergeTarget?.id && (
                    <span className="px-2 py-1 bg-purple-500/30 text-purple-300 text-xs rounded-full">
                      Target
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {isTidalConnected && (
          <div className="p-3 border-t border-gray-800 bg-gray-900/50">
            <p className="text-xs text-gray-500 text-center">
              {tidalPlaylists.length} playlists
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
