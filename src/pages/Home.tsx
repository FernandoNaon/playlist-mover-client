import { useEffect, useState } from "react";

export default function Home() {
  const [loginUrl, setLoginUrl] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/login")
      .then(res => res.json())
      .then(data => setLoginUrl(data.auth_url))
      .catch(err => console.error("Error fetching login URL:", err));
  }, []);

  return (
    <div>
      <h1>Login with Spotify</h1>
      {loginUrl && (
        <a href={loginUrl}>
          <button>Login</button>
        </a>
      )}
    </div>
  );
}
