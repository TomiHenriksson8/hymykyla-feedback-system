
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';

import FeedbackPage from './feedback/pages/FeedbackPage';

import AdminLayout from './admin/pages/AdminLayout';
import DashboardPage from './admin/pages/DashboardPage';
import ResponsesPage from './admin/pages/ResponsesPage';
import AnalyticsPage from './admin/pages/AnalyticsPage';
import SettingsPage from './admin/pages/SettingsPage';

import LoginPage from './admin/pages/LoginPage';
import RequireAuth from './auth/RequireAuth';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/palaute" replace /> },
      { path: '/palaute', element: <FeedbackPage /> },

      { path: '/hallinta/kirjaudu', element: <LoginPage /> },

      {
        path: '/hallinta',
        element: <RequireAuth />,
        children: [
          {
            path: '/hallinta',
            element: <AdminLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'vastaukset', element: <ResponsesPage /> },
              { path: 'analytiikka', element: <AnalyticsPage /> },
              { path: 'asetukset', element: <SettingsPage /> },
              // (Add kyselyt pages later)
            ],
          },
        ],
      },

      { path: '*', element: <div className="p-6">Sivua ei löytynyt</div> },
    ],
  },
]);
