import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Music2, ArrowRight, Headphones, Zap, Shield } from "lucide-react";
import { getSpotifyLoginUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const [loginUrl, setLoginUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { isSpotifyConnected } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSpotifyConnected) {
      navigate("/dashboard");
    }
  }, [isSpotifyConnected, navigate]);

  useEffect(() => {
    getSpotifyLoginUrl()
      .then((data) => setLoginUrl(data.auth_url))
      .catch((err) => console.error("Error fetching login URL:", err));
  }, []);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = loginUrl;
  };

  const features = [
    {
      icon: Headphones,
      title: "Transfer Playlists",
      description: "Move your playlists from Spotify to Tidal seamlessly",
    },
    {
      icon: Zap,
      title: "Smart Matching",
      description: "Intelligent track matching finds your songs on the new platform",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data stays safe with OAuth2 authentication",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center">
            <Music2 className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl">Playlist Mover</span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Move Your Music, Anywhere
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Transfer your playlists between Spotify and Tidal. Keep your music library wherever you
            go.
          </p>

          {loginUrl ? (
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                  Continue with Spotify
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          ) : (
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-gray-800 text-gray-400 font-semibold rounded-full">
              <div className="w-5 h-5 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
              Loading...
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 bg-gray-900 rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-gray-500 text-sm">
        <p>Built with React, Flask, and love for music</p>
      </footer>
    </div>
  );
}
