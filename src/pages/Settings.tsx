import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Link2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { startTidalLogin, checkTidalAuth, getSpotifyLoginUrl } from "../lib/api";

export default function Settings() {
  const {
    spotifyUser,
    tidalUser,
    isSpotifyConnected,
    isTidalConnected,
    setTidalSession,
    logout,
    isLoading: authLoading,
  } = useAuth();
  const navigate = useNavigate();

  const [tidalLoginData, setTidalLoginData] = useState<{
    verification_uri: string;
    user_code: string;
    session_id: string;
    expires_in: number;
  } | null>(null);
  const [isCheckingTidal, setIsCheckingTidal] = useState(false);
  const [tidalError, setTidalError] = useState<string | null>(null);
  const checkIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isSpotifyConnected) {
      navigate("/");
    }
  }, [authLoading, isSpotifyConnected, navigate]);

  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  const handleConnectTidal = async () => {
    setTidalError(null);
    try {
      const data = await startTidalLogin();

      if (!data || !data.verification_uri) {
        setTidalError("Failed to get Tidal login URL. Please try again.");
        return;
      }

      setTidalLoginData(data);

      // Don't auto-open popup - let user click the button manually
      // This avoids browser popup blocking issues

      // Start polling for auth completion
      setIsCheckingTidal(true);
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5-second intervals

      checkIntervalRef.current = window.setInterval(async () => {
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(checkIntervalRef.current!);
          setIsCheckingTidal(false);
          setTidalLoginData(null);
          setTidalError("Authorization timed out. Please try again.");
          return;
        }

        try {
          const status = await checkTidalAuth(data.session_id);
          if (status.authenticated && status.user) {
            clearInterval(checkIntervalRef.current!);
            setIsCheckingTidal(false);
            setTidalLoginData(null);
            setTidalSession(data.session_id, status.user);
          }
        } catch (error) {
          // Continue polling, don't log out or navigate away
          console.log("Tidal auth check error, continuing to poll:", error);
        }
      }, 5000);
    } catch (error) {
      console.error("Tidal login error:", error);
      setTidalError(error instanceof Error ? error.message : "Failed to start Tidal login");
    }
  };

  const handleCancelTidalLogin = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    setTidalLoginData(null);
    setIsCheckingTidal(false);
  };

  const handleReconnectSpotify = async () => {
    try {
      const data = await getSpotifyLoginUrl();
      window.location.href = data.auth_url;
    } catch (error) {
      console.error("Error getting Spotify login URL:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-gray-400">Manage your connected accounts</p>
      </div>

      {/* Connected Accounts */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Link2 className="w-5 h-5 text-gray-400" />
          Connected Accounts
        </h2>

        {/* Spotify Connection */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Spotify</h3>
                {isSpotifyConnected && spotifyUser ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Connected as {spotifyUser.display_name}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <XCircle className="w-4 h-4 text-red-400" />
                    Not connected
                  </div>
                )}
              </div>
            </div>
            {isSpotifyConnected ? (
              <button
                onClick={handleReconnectSpotify}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reconnect
              </button>
            ) : (
              <button
                onClick={handleReconnectSpotify}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition-colors"
              >
                Connect
              </button>
            )}
          </div>
          {spotifyUser && (
            <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Account Type</p>
                <p className="capitalize">{spotifyUser.product || "Free"}</p>
              </div>
              <div>
                <p className="text-gray-500">Country</p>
                <p>{spotifyUser.country || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500">Followers</p>
                <p>{spotifyUser.followers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">User ID</p>
                <p className="truncate">{spotifyUser.id}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tidal Connection */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996l4.004 4.004L0 16.004l4.004 4.004 4.004-4.004 4.004 4.004 4.004-4.004-4.004-4.004 4.004-4.004-4.004-4.004zm4.004 4.004l4.004-4.004L24.024 7.996l-4.004 4.004 4.004 4.004-4.004 4.004-4.004-4.004z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Tidal</h3>
                {isTidalConnected && tidalUser ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    Connected as {tidalUser.name}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <XCircle className="w-4 h-4 text-red-400" />
                    Not connected
                  </div>
                )}
              </div>
            </div>
            {!isTidalConnected && !tidalLoginData && (
              <button
                onClick={handleConnectTidal}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition-colors"
              >
                Connect
              </button>
            )}
          </div>

          {/* Tidal Login Flow */}
          {tidalLoginData && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="bg-gray-800 rounded-xl p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Complete Tidal Authorization
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  Click the button below to open Tidal login, then authorize the app:
                </p>

                {/* Big clickable button to open Tidal */}
                <a
                  href={tidalLoginData.verification_uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg transition-colors mb-4"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open Tidal Login Page
                </a>

                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-400">Your code:</span>
                  <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-sm text-cyan-400 font-mono font-bold text-center">
                    {tidalLoginData.user_code}
                  </code>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Code expires in ~5 minutes. Click the button above to open Tidal and authorize.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    {isCheckingTidal && (
                      <>
                        <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                        Waiting for authorization...
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleCancelTidalLogin}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {tidalError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {tidalError}
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-12">
        <div className="bg-gray-900 rounded-2xl border border-red-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Disconnect All Accounts</h3>
              <p className="text-sm text-gray-400">
                This will log you out and disconnect all connected services
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
