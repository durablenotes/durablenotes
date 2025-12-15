import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext.tsx';
import { BrandProvider } from './context/BrandContext.tsx';
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.tsx'

const CLIENT_ID = "535840949824-8lmqcvd7s9ucrdmc7pvvjcnt037qbslu.apps.googleusercontent.com"; // Consider moving to env

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
