import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SubmitTicket from './pages/SubmitTicket';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ERPDashboard from './pages/ERPDashboard';
import HRModule from './pages/HRModule';
import InventoryModule from './pages/InventoryModule';
import AgentWorkboard from './pages/AgentWorkboard';
import './App.css';

function AuthGuard() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ERPDashboard />} />
        <Route path="tickets" element={<Dashboard />} />
        <Route path="agent-work" element={<AgentWorkboard />} />
        <Route path="submit" element={<SubmitTicket />} />
        <Route path="manage-users" element={<UserManagement />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AuthGuard />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
