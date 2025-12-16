import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext.tsx';
import { BrandProvider } from './context/BrandContext.tsx';
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.tsx'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!CLIENT_ID) {
  console.error("Missing VITE_GOOGLE_CLIENT_ID environment variable. Google OAuth will not work.");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <AuthProvider>
        <BrandProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </BrandProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
