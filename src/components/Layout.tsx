import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, ListMusic, Settings, LogOut, Music2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/playlists", icon: ListMusic, label: "Playlists" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Layout() {
  const { spotifyUser, logout, isSpotifyConnected } = useAuth();

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center">
              <Music2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Playlist Mover</h1>
              <p className="text-xs text-gray-400">Transfer your music</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        {isSpotifyConnected && spotifyUser && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              {spotifyUser.image ? (
                <img
                  src={spotifyUser.image}
                  alt={spotifyUser.display_name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400 font-medium">
                    {spotifyUser.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{spotifyUser.display_name}</p>
                <p className="text-xs text-gray-400 capitalize">{spotifyUser.product || "Free"}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
