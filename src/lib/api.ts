const API_BASE = "http://127.0.0.1:5000";

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== SPOTIFY AUTH ====================

export async function getSpotifyLoginUrl(): Promise<{ auth_url: string }> {
  return fetchApi("/login");
}

// ==================== SPOTIFY USER ====================

export interface SpotifyUser {
  id: string;
  display_name: string;
  email?: string;
  image?: string;
  country?: string;
  product?: string;
  followers: number;
}

export async function getUserProfile(code: string): Promise<SpotifyUser> {
  return fetchApi("/user_profile", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

// ==================== SPOTIFY PLAYLISTS ====================

export interface Playlist {
  id: string;
  name: string;
  tracks_total: number;
  image?: string;
  owner: string;
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  artists: string[];
  album: string;
  duration_ms: number;
  image?: string;
}

export async function fetchPlaylists(code: string): Promise<Playlist[]> {
  return fetchApi("/fetch_playlists", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function fetchPlaylistTracks(code: string, playlistId: string): Promise<Track[]> {
  return fetchApi("/playlist_tracks", {
    method: "POST",
    body: JSON.stringify({ code, playlist_id: playlistId }),
  });
}

// ==================== SPOTIFY INSIGHTS ====================

export interface TopTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  image?: string;
  popularity: number;
}

export interface TopArtist {
  id: string;
  name: string;
  genres: string[];
  image?: string;
  popularity: number;
  followers: number;
}

export interface RecentTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  image?: string;
  played_at: string;
}

export interface LibraryStats {
  saved_tracks: number;
  playlists: number;
  saved_albums: number;
  followed_artists: number;
}

export type TimeRange = "short_term" | "medium_term" | "long_term";

export async function getTopTracks(
  code: string,
  timeRange: TimeRange = "medium_term",
  limit: number = 20
): Promise<TopTrack[]> {
  return fetchApi("/top_tracks", {
    method: "POST",
    body: JSON.stringify({ code, time_range: timeRange, limit }),
  });
}

export async function getTopArtists(
  code: string,
  timeRange: TimeRange = "medium_term",
  limit: number = 20
): Promise<TopArtist[]> {
  return fetchApi("/top_artists", {
    method: "POST",
    body: JSON.stringify({ code, time_range: timeRange, limit }),
  });
}

export async function getRecentlyPlayed(code: string, limit: number = 20): Promise<RecentTrack[]> {
  return fetchApi("/recently_played", {
    method: "POST",
    body: JSON.stringify({ code, limit }),
  });
}

export async function getLibraryStats(code: string): Promise<LibraryStats> {
  return fetchApi("/library_stats", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

// ==================== TIDAL ====================

export interface TidalLoginResponse {
  verification_uri: string;
  user_code: string;
  session_id: string;
  expires_in: number;
}

export interface TidalAuthStatus {
  authenticated: boolean;
  user?: {
    id: string;
    name: string;
  };
  error?: string;
}

export async function startTidalLogin(): Promise<TidalLoginResponse> {
  return fetchApi("/tidal/login", { method: "POST" });
}

export async function checkTidalAuth(sessionId: string): Promise<TidalAuthStatus> {
  return fetchApi("/tidal/check_auth", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId }),
  });
}

// ==================== MIGRATION ====================

export interface MigrationResult {
  success: boolean;
  playlist_id?: string;
  playlist_name?: string;
  total_tracks: number;
  migrated: number;
  not_found: number;
  not_found_tracks: Array<{ name: string; artist: string; album: string }>;
  error?: string;
}

export async function migratePlaylist(
  spotifyCode: string,
  tidalSessionId: string,
  playlistId: string,
  playlistName: string
): Promise<MigrationResult> {
  return fetchApi("/migrate_playlist", {
    method: "POST",
    body: JSON.stringify({
      spotify_code: spotifyCode,
      tidal_session_id: tidalSessionId,
      playlist_id: playlistId,
      playlist_name: playlistName,
    }),
  });
}
