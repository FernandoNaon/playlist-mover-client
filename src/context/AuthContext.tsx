import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getUserProfile, type SpotifyUser } from "../lib/api";

interface AuthState {
  spotifyCode: string | null;
  spotifyUser: SpotifyUser | null;
  tidalSessionId: string | null;
  tidalUser: { id: string; name: string } | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  setSpotifyCode: (code: string) => void;
  setTidalSession: (sessionId: string, user: { id: string; name: string }) => void;
  logout: () => void;
  isSpotifyConnected: boolean;
  isTidalConnected: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    spotifyCode: localStorage.getItem("spotify_code"),
    spotifyUser: null,
    tidalSessionId: localStorage.getItem("tidal_session_id"),
    tidalUser: null,
    isLoading: true,
  });

  useEffect(() => {
    const code = state.spotifyCode;
    if (code && !state.spotifyUser) {
      getUserProfile(code)
        .then((user) => {
          setState((prev) => ({ ...prev, spotifyUser: user, isLoading: false }));
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem("spotify_code");
          setState((prev) => ({ ...prev, spotifyCode: null, isLoading: false }));
        });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.spotifyCode]);

  const setSpotifyCode = (code: string) => {
    localStorage.setItem("spotify_code", code);
    setState((prev) => ({ ...prev, spotifyCode: code }));
  };

  const setTidalSession = (sessionId: string, user: { id: string; name: string }) => {
    localStorage.setItem("tidal_session_id", sessionId);
    setState((prev) => ({ ...prev, tidalSessionId: sessionId, tidalUser: user }));
  };

  const logout = () => {
    localStorage.removeItem("spotify_code");
    localStorage.removeItem("tidal_session_id");
    setState({
      spotifyCode: null,
      spotifyUser: null,
      tidalSessionId: null,
      tidalUser: null,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        setSpotifyCode,
        setTidalSession,
        logout,
        isSpotifyConnected: !!state.spotifyUser,
        isTidalConnected: !!state.tidalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
