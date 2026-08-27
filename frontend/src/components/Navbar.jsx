import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Recycle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
    isActive
      ? 'text-[#059669] bg-[#e6f4ec]'
      : 'text-[#5f655f] hover:text-[#1c1f1c]'
  }`;

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, []);

  function handleNav() {
    setOpen(false);
  }

  function handleLogout() {
    setOpen(false);
    logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-20 bg-[#faf9f7] border-b border-[#e4e4e0]">
      <div className="w-[90%] max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link to="/" onClick={handleNav} className="flex items-center gap-2 font-bold text-[#1c1f1c] font-display">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-[#e6f4ec] text-[#047857]">
            <Recycle className="w-4 h-4" />
          </span>
          <span className="text-lg tracking-tight">EcoPlan</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" className={linkClass} end>
            Feed
          </NavLink>
          {user && (
            <>
              <NavLink to="/assistant" className={linkClass}>
                AI Assistant
              </NavLink>
              <NavLink to="/my-plans" className={linkClass}>
                My Plans
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className={linkClass}>
                  Admin
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-[#5f655f]">{user.name}</span>
              <button onClick={handleLogout} className="btn-ghost !py-1.5 !px-3">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost !py-1.5 !px-3">
                Log in
              </Link>
              <Link to="/register" className="btn-primary !py-1.5 !px-3">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="md:hidden grid place-items-center w-10 h-10 rounded-xl text-[#1c1f1c] neu-raised"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#faf9f7] border-t border-[#e4e4e0] px-4 py-3 space-y-1">
          <NavLink to="/" className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#5f655f] hover:text-[#1c1f1c]" end onClick={handleNav}>
            Feed
          </NavLink>
          {user && (
            <>
              <NavLink to="/assistant" className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#5f655f] hover:text-[#1c1f1c]" onClick={handleNav}>
                AI Assistant
              </NavLink>
              <NavLink to="/my-plans" className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#5f655f] hover:text-[#1c1f1c]" onClick={handleNav}>
                My Plans
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin" className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#5f655f] hover:text-[#1c1f1c]" onClick={handleNav}>
                  Admin
                </NavLink>
              )}
            </>
          )}
          <div className="pt-2 mt-2">
            {user ? (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-[#5f655f]">{user.name}</span>
                <button onClick={handleLogout} className="btn-ghost !py-1.5 !px-3">
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 px-3 py-2">
                <Link to="/login" onClick={handleNav} className="btn-ghost flex-1">
                  Log in
                </Link>
                <Link to="/register" onClick={handleNav} className="btn-primary flex-1">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}