import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSpotifyCode } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;

    const code = searchParams.get("code");
    if (code) {
      hasProcessed.current = true;
      setSpotifyCode(code);
      navigate("/dashboard", { replace: true });
    } else {
      hasProcessed.current = true;
      navigate("/", { replace: true });
    }
  }, [searchParams, setSpotifyCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Connecting to Spotify...</p>
      </div>
    </div>
  );
}
