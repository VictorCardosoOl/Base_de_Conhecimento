import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { MainLayout } from './layouts/MainLayout';

// Lazy loading pages to reduce FCP and split the main bundle
const HomePage = React.lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ArticlePage = React.lazy(() => import('./pages/ArticlePage').then(m => ({ default: m.ArticlePage })));
const QueuePage = React.lazy(() => import('./pages/QueuePage').then(m => ({ default: m.QueuePage })));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const AdminPage = React.lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const EditorPage = React.lazy(() => import('./pages/EditorPage').then(m => ({ default: m.EditorPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Um loader simples para o Suspense
const PageLoader = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={({ error }) => (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-serif text-text-main mb-2">Ops! Ocorreu uma instabilidade inesperada.</h2>
        <p className="text-sm text-text-muted mb-4 max-w-md">O erro foi registrado para análise da nossa equipe de engenharia.</p>
        <button
          onClick={() => window.location.assign('/')}
          className="px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 transition-opacity hover:opacity-80"
        >
          Recarregar Aplicação
        </button>
      </div>
    )}>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="minha-lista" element={<QueuePage />} />
              <Route path="artigo/:id" element={<ArticlePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="admin" element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              } />
              <Route path="admin/editor" element={
                <ProtectedRoute>
                  <EditorPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </Sentry.ErrorBoundary>
  );
}
