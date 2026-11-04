import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Toast from './components/Toast';
import AuthModal from './components/AuthModal';
import HelpButton from './components/HelpButton';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import IncomeEntry from './pages/IncomeEntry';
import ResetTransactions from './pages/ResetTransactions';
import Admin from './pages/Admin';
import ResetPassword from './pages/ResetPassword';
import { useApp } from './context/AppContext';

function Protected({ children }) {
  const { user } = useApp();
  return user.isLoggedIn ? children : <Navigate to="/" replace />;
}

function AdminProtected({ children }) {
  const { user } = useApp();
  return user.isLoggedIn && user.isAdmin ? children : <Navigate to={user.isLoggedIn ? '/dashboard' : '/'} replace />;
}

export default function App() {
  return (
    <div className="min-h-screen font-sans antialiased bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      <Toast />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/income" element={<Protected><IncomeEntry /></Protected>} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/admin" element={<AdminProtected><Admin /></AdminProtected>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset" element={<Protected><ResetTransactions /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      <AuthModal />
      <HelpButton />
    </div>
  );
}
