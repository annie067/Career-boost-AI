import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Briefcase, Mic, Globe, LogOut, Menu, X, Moon, Sun, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { signOut, user, token } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    if (token) {
      fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if(d.level) { setLevel(d.level); setXp(d.xp); } })
        .catch(() => {});
    }
  }, [token, location.pathname]); // Refresh level on navigation

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Resume Analyzer', path: '/resume', icon: FileText },
    { name: 'Interview Simulator', path: '/interview', icon: Mic },
    { name: 'Job Matcher', path: '/jobs', icon: Briefcase },
    { name: 'Career Roadmap', path: '/roadmap', icon: Map },
    { name: 'Portfolio Builder', path: '/portfolio', icon: Globe },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 border-r border-border bg-card/50 backdrop-blur-xl z-20">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3 font-bold text-2xl text-primary">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            CareerBoost
          </Link>
        </div>
        
        <div className="px-6 mb-6">
          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-4 rounded-2xl border border-primary/20">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-primary">Lvl {level}</span>
              <span className="text-xs text-muted-foreground">{xp} XP</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-purple-500" style={{ width: `${(xp % 100)}%` }} />
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all relative overflow-hidden ${
                  isActive ? 'text-primary font-semibold' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && <motion.div layoutId="nav-bg" className="absolute inset-0 bg-primary/10 -z-10" />}
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border space-y-4 bg-card">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user?.email?.split('@')[0]}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
            </div>
            <button onClick={() => setIsDark(!isDark)} className="p-2.5 rounded-full hover:bg-muted text-muted-foreground transition-colors">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={signOut} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-destructive hover:bg-destructive/10 transition-all font-medium">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header & Menu */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Decorative background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-lg z-30">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Briefcase className="w-6 h-6" />
            CareerBoost
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsDark(!isDark)} className="p-3 rounded-full text-muted-foreground">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-3 text-foreground">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-[73px] left-0 right-0 bottom-0 bg-background/95 backdrop-blur-xl z-50 p-4 md:hidden overflow-y-auto"
            >
              <nav className="flex flex-col space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-muted text-lg font-medium"
                    >
                      <Icon className="w-6 h-6 text-primary" />
                      {item.name}
                    </Link>
                  );
                })}
                <div className="my-4 h-px bg-border" />
                <button onClick={signOut} className="flex items-center gap-4 px-4 py-4 rounded-xl text-destructive hover:bg-destructive/10 text-lg font-medium">
                  <LogOut className="w-6 h-6" />
                  Sign Out
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-6xl mx-auto h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
