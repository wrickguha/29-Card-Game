import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import Splash from './pages/Splash';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import { useUIStore } from './stores/useUIStore';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            p-4 rounded-xl border shadow-xl flex justify-between items-start animate-in slide-in-from-bottom-5 duration-200
            ${toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' : ''}
            ${toast.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-400' : ''}
            ${toast.type === 'info' ? 'bg-blue-950/90 border-blue-500/30 text-blue-400' : ''}
            ${toast.type === 'warning' ? 'bg-amber-950/90 border-amber-500/30 text-amber-400' : ''}
          `}
        >
          <div className="text-left">
            <h4 className="text-xs font-black uppercase tracking-wider">{toast.title}</h4>
            <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-200 text-xs ml-4 cursor-pointer"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Splash screen standalone page */}
        <Route path="/splash" element={<Splash />} />

        {/* Public auth screen */}
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthLayout>
                <Auth />
              </AuthLayout>
            </PublicRoute>
          }
        />

        {/* Private views inside MainLayout */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout>
                <Home />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <PrivateRoute>
              <MainLayout>
                <Friends />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/lobby/:roomId"
          element={
            <PrivateRoute>
              <MainLayout>
                <Lobby />
              </MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/game/:roomId"
          element={
            <PrivateRoute>
              <MainLayout>
                <Game />
              </MainLayout>
            </PrivateRoute>
          }
        />

        {/* Standard fallbacks */}
        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
};

export default App;
