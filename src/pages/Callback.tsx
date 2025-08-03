import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

type Playlist = {
  id: string;
  name: string;
  tracks_total: number;
};

type Track = {
  name: string;
  artist: string;
  album: string;
};

export default function Callback() {
  const [searchParams] = useSearchParams();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [selectedTracks, setSelectedTracks] = useState<Track[] | null>(null);
  const [selectedPlaylistName, setSelectedPlaylistName] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("No code found");
      return;
    }

    fetch("http://127.0.0.1:5000/fetch_playlists", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ code }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPlaylists(data);
        setStatus("Playlists fetched");
      })
      .catch((err) => {
        console.error(err);
        setStatus("Error fetching playlists");
      });
  }, [searchParams]);

  const fetchTracks = (playlistId: string, playlistName: string) => {
    setSelectedTracks(null);
    setSelectedPlaylistName(playlistName);
    setStatus("Fetching tracks...");

    fetch("http://127.0.0.1:5000/playlist_tracks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ playlist_id: playlistId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setSelectedTracks(data);
        setStatus("Tracks loaded");
      })
      .catch((err) => {
        console.error(err);
        setStatus("Error loading tracks");
      });
  };

  return (
    <div>
      <h1>{status}</h1>

      <h2>Playlists</h2>
      <ul>
        {playlists.map((p) => (
          <li key={p.id}>
            <button onClick={() => fetchTracks(p.id, p.name)}>
              {p.name} ({p.tracks_total} tracks)
            </button>
          </li>
        ))}
      </ul>

      {selectedTracks && (
        <>
          <h3>Tracks in "{selectedPlaylistName}"</h3>
          <ul>
            {selectedTracks.map((track, index) => (
              <li key={index}>
                <strong>{track.name}</strong> – {track.artist} ({track.album})
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
