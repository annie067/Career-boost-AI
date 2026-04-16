import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import  supabase from './lib/supabase';

import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import PortfolioBuilder from './pages/PortfolioBuilder';
import PortfolioView from './pages/PortfolioView';
import InterviewSimulator from './pages/InterviewSimulator';
import JobMatcher from './pages/JobMatcher';
import RoadmapGenerator from './pages/RoadmapGenerator';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" />;

  return <Layout>{children}</Layout>;
}

export default function App() {

  // ✅ Supabase test connection
  useEffect(() => {
    const test = async () => {
      const { data, error } = await supabase.from('jobs').select('*');
      console.log("SUPABASE DATA:", data);
      console.log("SUPABASE ERROR:", error);
    };

    test();
  }, []);

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/p/:slug" element={<PortfolioView />} />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/resume" element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />
      <Route path="/portfolio" element={<ProtectedRoute><PortfolioBuilder /></ProtectedRoute>} />
      <Route path="/interview" element={<ProtectedRoute><InterviewSimulator /></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><JobMatcher /></ProtectedRoute>} />
      <Route path="/roadmap" element={<ProtectedRoute><RoadmapGenerator /></ProtectedRoute>} />
    </Routes>
  );
}