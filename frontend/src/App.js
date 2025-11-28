import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="app-container">
          <ProtectedRoute>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/crear-empresa" element={<Dashboard />} />
              <Route path="/mis-empresas" element={<Dashboard />} />
              <Route path="/editar-empresa/:id" element={<Dashboard />} />
              <Route path="/configuracion-empresa/:id" element={<Dashboard />} />
              <Route path="/gestionar-empresa/:id" element={<Dashboard />} />
              <Route path="/configuracion" element={<Dashboard />} />
              <Route path="/admin" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
