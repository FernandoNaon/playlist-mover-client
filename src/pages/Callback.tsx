import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Callback() {
  const [searchParams] = useSearchParams();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("No code found");
      return;
    }

    fetch("http://127.0.0.1:5000/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ code })
    })
      .then(res => res.json())
      .then(data => {
        setPlaylists(data);
        setStatus("Playlists fetched");
      })
      .catch(err => {
        console.error(err);
        setStatus("Error fetching playlists");
      });
  }, [searchParams]);

  return (
    <div>
      <h1>{status}</h1>
      <ul>
        {playlists.map((p) => (
          <li key={p.id}>{p.name} ({p.tracks_total} tracks)</li>
        ))}
      </ul>
    </div>
  );
}
