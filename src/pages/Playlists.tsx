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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fetchPlaylists,
  fetchPlaylistTracks,
  migratePlaylist,
  type Playlist,
  type Track,
  type MigrationResult,
} from "../lib/api";

export default function Playlists() {
  const { spotifyCode, isSpotifyConnected, tidalSessionId, isTidalConnected, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [filteredPlaylists, setFilteredPlaylists] = useState<Playlist[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  useEffect(() => {
    if (!authLoading && !isSpotifyConnected) {
      navigate("/");
    }
  }, [authLoading, isSpotifyConnected, navigate]);

  useEffect(() => {
    if (!spotifyCode) return;

    const loadPlaylists = async () => {
      try {
        const data = await fetchPlaylists(spotifyCode);
        setPlaylists(data);
        setFilteredPlaylists(data);
      } catch (error) {
        console.error("Error fetching playlists:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaylists();
  }, [spotifyCode]);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    setFilteredPlaylists(
      playlists.filter((p) => p.name.toLowerCase().includes(query))
    );
  }, [searchQuery, playlists]);

  const handleSelectPlaylist = async (playlist: Playlist) => {
    if (!spotifyCode) return;

    setSelectedPlaylist(playlist);
    setTracks([]);
    setMigrationResult(null);
    setIsLoadingTracks(true);

    try {
      const data = await fetchPlaylistTracks(spotifyCode, playlist.id);
      setTracks(data);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const handleMigrate = async () => {
    if (!spotifyCode || !tidalSessionId || !selectedPlaylist) return;

    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const result = await migratePlaylist(
        spotifyCode,
        tidalSessionId,
        selectedPlaylist.id,
        selectedPlaylist.name
      );
      setMigrationResult(result);
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

  return (
    <div className="flex h-full">
      {/* Playlist List */}
      <div className="w-80 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-green-400" />
            Your Playlists
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-800 rounded animate-pulse" />
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-gray-800 rounded animate-pulse mb-2" />
                    <div className="w-20 h-3 bg-gray-800 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredPlaylists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleSelectPlaylist(playlist)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left ${
                    selectedPlaylist?.id === playlist.id ? "bg-gray-800/50" : ""
                  }`}
                >
                  {playlist.image ? (
                    <img
                      src={playlist.image}
                      alt={playlist.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
                      <ListMusic className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{playlist.name}</p>
                    <p className="text-sm text-gray-400">
                      {playlist.tracks_total} tracks • {playlist.owner}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Playlist Details */}
      <div className="flex-1 overflow-auto">
        {selectedPlaylist ? (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start gap-6 mb-8">
              {selectedPlaylist.image ? (
                <img
                  src={selectedPlaylist.image}
                  alt={selectedPlaylist.name}
                  className="w-48 h-48 rounded-xl object-cover shadow-xl"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-800 rounded-xl flex items-center justify-center">
                  <ListMusic className="w-16 h-16 text-gray-600" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm text-gray-400 uppercase tracking-wide mb-2">
                  Playlist
                </p>
                <h1 className="text-4xl font-bold mb-2">{selectedPlaylist.name}</h1>
                <p className="text-gray-400 mb-4">
                  {selectedPlaylist.owner} • {selectedPlaylist.tracks_total} tracks
                </p>

                {/* Migration Button */}
                {isTidalConnected ? (
                  <button
                    onClick={handleMigrate}
                    disabled={isMigrating || tracks.length === 0}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Tracks */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 p-4 border-b border-gray-800 text-gray-400 text-sm">
                <span className="w-8">#</span>
                <span>Title</span>
                <span>Album</span>
                <span>Duration</span>
              </div>

              {isLoadingTracks ? (
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
              ) : (
                <div className="divide-y divide-gray-800">
                  {tracks.map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 p-4 items-center hover:bg-gray-800/50 transition-colors group"
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
            <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-6">
              <ListMusic className="w-12 h-12 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Select a Playlist</h2>
            <p className="text-gray-400 max-w-md">
              Choose a playlist from the left to view its tracks and migrate it to Tidal
            </p>
            {!isTidalConnected && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium text-yellow-400">Connect Tidal</p>
                  <p className="text-sm text-gray-400">
                    Go to Settings to connect your Tidal account before migrating playlists.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
