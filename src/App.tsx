import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { ArticlePage } from './pages/ArticlePage';
import { QueuePage } from './pages/QueuePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<LoginPage />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="minha-lista" element={<QueuePage />} />
          <Route path="artigo/:id" element={<ArticlePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
