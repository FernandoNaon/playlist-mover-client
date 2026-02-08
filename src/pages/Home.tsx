import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Music, Disc3, Heart } from "lucide-react";
import { getSpotifyLoginUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

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

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-cream)" }}>
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-40 animate-float"
          style={{ background: "var(--green-pale)" }}
        />
        <div
          className="absolute top-1/3 -left-32 w-64 h-64 rounded-full opacity-30"
          style={{ background: "var(--peach)", animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-20 right-1/4 w-48 h-48 rounded-full opacity-30 animate-float"
          style={{ background: "var(--blue-soft)", animationDelay: "2s" }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 md:px-12 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--green-primary)" }}
            >
              <Disc3 className="w-5 h-5 text-white" />
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="link-hover text-sm">
              Features
            </a>
            <a href="#how-it-works" className="link-hover text-sm">
              How it works
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 px-6 md:px-12 pt-12 md:pt-24 pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Hero content */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div
              className="inline-flex items-center gap-2 tag mb-6 animate-fade-in-up"
              style={{
                opacity: 0,
                animationDelay: "0.1s",
                animationFillMode: "forwards",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Free & Open Source
            </div>

            <h1
              className="heading-xl mb-6 animate-fade-in-up"
              style={{
                opacity: 0,
                animationDelay: "0.2s",
                animationFillMode: "forwards",
              }}
            >
              Migrate Beats
              <br />
              <span
                className="italic"
                style={{ color: "var(--green-primary)" }}
              >
                Move your music anywhere you go
              </span>
            </h1>

            <p
              className="text-lg md:text-xl mb-10 max-w-xl mx-auto animate-fade-in-up"
              style={{
                color: "var(--text-medium)",
                opacity: 0,
                animationDelay: "0.3s",
                animationFillMode: "forwards",
              }}
            >
              Transfer your carefully curated playlists from Spotify to Tidal.
              Keep your music collection wherever life takes you.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
              style={{
                opacity: 0,
                animationDelay: "0.4s",
                animationFillMode: "forwards",
              }}
            >
              {loginUrl ? (
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="btn-primary group"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                      </svg>
                      Connect with Spotify
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              ) : (
                <button className="btn-primary opacity-50 cursor-not-allowed">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading...
                </button>
              )}
              <a href="#how-it-works" className="btn-secondary">
                See how it works
              </a>
            </div>
          </div>

          {/* Decorative illustration area */}
          <div
            className="relative max-w-4xl mx-auto animate-fade-in-up"
            style={{
              opacity: 0,
              animationDelay: "0.5s",
              animationFillMode: "forwards",
            }}
          >
            <div
              className="rounded-3xl p-8 md:p-12"
              style={{ background: "var(--bg-warm)" }}
            >
              <div className="grid md:grid-cols-3 gap-6">
                {/* Spotify side */}
                <div className="card text-center py-8">
                  <div
                    className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background: "#1DB95420" }}
                  >
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#1DB954">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-medium mb-2">
                    Spotify
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-medium)" }}
                  >
                    Your playlists
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center animate-float"
                    style={{ background: "var(--coral)", color: "white" }}
                  >
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </div>

                {/* Tidal side */}
                <div className="card text-center py-8">
                  <div
                    className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background: "var(--border-light)" }}
                  >
                    <svg
                      className="w-8 h-8"
                      viewBox="0 0 24 24"
                      fill="var(--text-dark)"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="
    M6 4 L3 7 L6 10 L9 7 Z
    M12 4 L9 7 L12 10 L15 7 Z
    M18 4 L15 7 L18 10 L21 7 Z
    M12 10 L9 13 L12 16 L15 13 Z
  "
                      />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-medium mb-2">
                    Tidal
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-medium)" }}
                  >
                    Hi-Fi destination
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 px-6 md:px-12 py-24"
        style={{ background: "var(--bg-warm)" }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="tag tag-coral mb-4">Features</span>
            <h2 className="heading-lg">
              Everything you need to
              <br />
              <span className="italic" style={{ color: "var(--coral)" }}>
                switch with ease
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Music,
                title: "Smart Matching",
                desc: "Our algorithm finds your tracks on Tidal with high accuracy, even for obscure songs.",
                color: "var(--green-primary)",
                bg: "var(--green-pale)",
              },
              {
                icon: Heart,
                title: "Keep Everything",
                desc: "Transfer all your playlists, saved tracks, and carefully curated collections.",
                color: "var(--coral)",
                bg: "var(--peach)",
              },
              {
                icon: Sparkles,
                title: "Hi-Fi Ready",
                desc: "Move to Tidal's lossless audio and experience your music the way it was meant to be heard.",
                color: "var(--blue-accent)",
                bg: "var(--blue-soft)",
              },
            ].map((feature) => (
              <div key={feature.title} className="card text-center py-8 px-6">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                  style={{ background: feature.bg }}
                >
                  <feature.icon
                    className="w-6 h-6"
                    style={{ color: feature.color }}
                  />
                </div>
                <h3 className="font-display text-xl font-medium mb-3">
                  {feature.title}
                </h3>
                <p style={{ color: "var(--text-medium)" }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="tag tag-blue mb-4">How it works</span>
            <h2 className="heading-lg">Three simple steps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                title: "Connect Spotify",
                desc: "Link your Spotify account securely. We only read your library data.",
              },
              {
                num: "02",
                title: "Choose playlists",
                desc: "Select which playlists you want to transfer. Preview tracks before moving.",
              },
              {
                num: "03",
                title: "Transfer to Tidal",
                desc: "Connect Tidal and watch your playlists appear in your new library.",
              },
            ].map((step) => (
              <div key={step.num} className="relative">
                <div
                  className="text-6xl font-display font-bold mb-4"
                  style={{ color: "var(--green-pale)" }}
                >
                  {step.num}
                </div>
                <h3 className="font-display text-xl font-medium mb-3">
                  {step.title}
                </h3>
                <p style={{ color: "var(--text-medium)" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="rounded-3xl p-12 md:p-16"
            style={{ background: "var(--green-primary)" }}
          >
            <h2 className="heading-lg text-white mb-6">
              Ready to move your music?
            </h2>
            <p
              className="text-lg mb-8"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              Join thousands of music lovers who've made the switch.
            </p>
            {loginUrl ? (
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="btn-primary"
                style={{ background: "white", color: "var(--green-primary)" }}
              >
                {isLoading ? "Connecting..." : "Get started for free"}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                className="btn-primary opacity-50"
                style={{ background: "white", color: "var(--green-primary)" }}
              >
                Loading...
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 px-6 md:px-12 py-8"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Disc3
              className="w-5 h-5"
              style={{ color: "var(--green-primary)" }}
            />
            <span className="font-display font-medium">Migrate Beats</span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-light)" }}>
            Made with love for music lovers everywhere
          </p>
        </div>
      </footer>
    </div>
  );
}
