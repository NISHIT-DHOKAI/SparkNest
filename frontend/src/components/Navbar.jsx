import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificationsAPI } from "../services/api";
import { FiBell, FiLogOut, FiMessageCircle, FiPlus, FiSearch } from "react-icons/fi";

const NAV_LINKS = [
  { to: "/", label: "Discover" },
  { to: "/reels", label: "Reels" },
  { to: "/posts", label: "Photos" },
  { to: "/boards", label: "Collections" },
];

const navStyles = `
  .spark-navbar {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between; gap: 20px;
    height: 66px; padding: 0 max(28px, calc((100vw - 1180px) / 2));
    background: rgba(250, 249, 246, .92); border-bottom: 1px solid #e9e8e1;
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    font-family: 'DM Sans', sans-serif;
  }
  .spark-logo { flex-shrink: 0; color: #202820; font-family: 'Manrope', sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -.07em; text-decoration: none; }
  .spark-logo span { color: #d56f4d; }
  .spark-nav-links { position: absolute; left: 50%; display: flex; align-items: center; gap: 5px; transform: translateX(-50%); }
  .spark-nav-link { padding: 8px 12px; border-radius: 999px; color: #777e76; font-size: 12px; font-weight: 500; text-decoration: none; transition: background .18s, color .18s; }
  .spark-nav-link:hover, .spark-nav-link.active { color: #202820; background: #efeee8; }
  .spark-nav-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .spark-search-form { display: flex; align-items: center; gap: 5px; width: 190px; padding: 5px 6px 5px 12px; border: 1px solid #e9e8e1; border-radius: 999px; background: #fff; }
  .spark-search-input { width: 100%; min-width: 0; border: 0; outline: 0; color: #202820; background: transparent; font: inherit; font-size: 11px; }
  .spark-search-btn, .spark-icon-btn { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid transparent; border-radius: 50%; color: #646b64; background: transparent; cursor: pointer; font-size: 14px; text-decoration: none; }
  .spark-search-btn:hover, .spark-icon-btn:hover { color: #202820; background: #efeee8; }
  .spark-icon-btn { position: relative; width: 36px; height: 36px; }
  .notification-badge { position: absolute; top: -2px; right: -2px; display: grid; min-width: 16px; height: 16px; place-items: center; padding: 0 4px; border-radius: 99px; color: white; background: #d56f4d; font-size: 9px; font-weight: 700; }
  .spark-create-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 999px; color: white; background: #d56f4d; font-size: 11px; font-weight: 600; text-decoration: none; transition: background .18s; }
  .spark-create-btn:hover { color: white; background: #b75537; }
  .spark-avatar-btn { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 50%; color: #fff; background: #788e78; font-size: 11px; font-weight: 700; text-decoration: none; }
  .spark-login-btn, .spark-register-btn { padding: 9px 14px; border-radius: 999px; font-size: 11px; font-weight: 600; text-decoration: none; }
  .spark-login-btn { color: #4e574f; }
  .spark-register-btn { color: #fff; background: #d56f4d; }
  .spark-register-btn:hover { color: white; background: #b75537; }
  @media (max-width: 940px) { .spark-search-form { width: 145px; } .spark-nav-links { position: static; transform: none; margin-left: auto; } }
  @media (max-width: 760px) { .spark-navbar { height: 60px; padding: 0 18px; } .spark-nav-links, .spark-search-form, .spark-create-label { display: none; } .spark-nav-right { gap: 4px; } }
`;

function Navbar() {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const fetchUnreadCount = async () => {
      try {
        const data = await notificationsAPI.getUnreadCount();
        setUnreadCount(data.count || 0);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    setSearchTerm("");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading) {
    return <><style>{navStyles}</style><nav className="spark-navbar spark-navbar-loading"><Link to="/" className="spark-logo">Spark<span>Nest</span></Link></nav></>;
  }

  const initials = user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <>
      <style>{navStyles}</style>
      <nav className="spark-navbar" aria-label="Main navigation">
        <Link to="/" className="spark-logo">Spark<span>Nest</span></Link>
        <div className="spark-nav-links">
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className={`spark-nav-link${location.pathname === to ? " active" : ""}`}>{label}</Link>
          ))}
        </div>
        <div className="spark-nav-right">
          {isAuthenticated ? (
            <>
              <form className="spark-search-form" onSubmit={handleSearchSubmit} role="search">
                <input className="spark-search-input" type="search" placeholder="Search SparkNest" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} aria-label="Search SparkNest" />
                <button type="submit" className="spark-search-btn" aria-label="Search"><FiSearch /></button>
              </form>
              <Link to="/create" className="spark-create-btn" title="Create a post or reel"><FiPlus /><span className="spark-create-label">Create</span></Link>
              <Link to="/notifications" className="spark-icon-btn" title="Notifications" aria-label="Notifications"><FiBell />{unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}</Link>
              <Link to="/chat" className="spark-icon-btn" title="Messages" aria-label="Messages"><FiMessageCircle /></Link>
              <Link to={`/profile/${user?._id}`} className="spark-avatar-btn" title={user?.name || "Profile"}>{initials}</Link>
              <button className="spark-icon-btn logout-btn" onClick={handleLogout} type="button" title="Log out" aria-label="Log out"><FiLogOut /></button>
            </>
          ) : (
            <><Link to="/login" className="spark-login-btn">Log in</Link><Link to="/register" className="spark-register-btn">Sign up</Link></>
          )}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
