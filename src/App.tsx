import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SubjectsPage } from './pages/SubjectsPage';
import { TestsListPage } from './pages/TestsListPage';

import { AuthProvider } from './components/AuthProvider';
import { LoginPage } from './pages/LoginPage';

import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout, AdminDashboard } from './pages/admin/AdminDashboard';

import { AdminSubjectsPage } from './pages/admin/AdminSubjectsPage';
import { AdminTestsPage } from './pages/admin/AdminTestsPage';
import { AdminSessionsPage } from './pages/admin/AdminSessionsPage';
import { AdminStatsPage } from './pages/admin/AdminStatsPage';

import { StudentLobbyPage } from './pages/StudentLobbyPage';
import { StudentSessionPage } from './pages/StudentSessionPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Student Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<SubjectsPage />} />
              <Route path="live" element={<StudentLobbyPage />} />
              <Route path="session/:sessionId" element={<StudentSessionPage />} />
              <Route path="tests/:subjectId" element={<TestsListPage />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin={true} />}>
            <Route element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="subjects" element={<AdminSubjectsPage />} />
              <Route path="tests" element={<AdminTestsPage />} />
              <Route path="sessions" element={<AdminSessionsPage />} />
              <Route path="stats" element={<AdminStatsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
