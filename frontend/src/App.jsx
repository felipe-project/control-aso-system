import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EmployeeForm from './pages/EmployeeForm.jsx';
import Settings from './pages/Settings.jsx';
import Users from './pages/Users.jsx';
import Layout from './components/Layout.jsx';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="funcionarios/novo" element={<EmployeeForm />} />
        <Route path="funcionarios/:id/editar" element={<EmployeeForm />} />
        <Route path="configuracoes" element={<Settings />} />
        <Route path="usuarios" element={<Users />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
