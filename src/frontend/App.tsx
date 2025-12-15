import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from "./context/AuthContext";
import { Login } from "./components/Login";
import { NoteApp } from "./pages/NoteApp";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Loader2 } from "lucide-react";

function App() {
  const { user, token, login, isLoading } = useAuth();

  if (isLoading) {
    console.log("App: Loading Auth...");
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Not Logged In -> Login Screen
  if (!user || !token) {
    return <Login onSuccess={login} />;
  }

  return (
    <Routes>
      <Route path="/" element={<NoteApp />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
