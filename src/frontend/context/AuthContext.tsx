import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { jwtDecode } from "jwt-decode";
import { googleLogout } from '@react-oauth/google';

interface User {
    sub: string;
    email: string;
    name: string;
    picture: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (credential: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
            try {
                const decoded = jwtDecode<User>(storedToken);
                setToken(storedToken);
                setUser(decoded);
            } catch (e) {
                console.error("Invalid token found", e);
                localStorage.removeItem('auth_token');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (credential: string) => {
        const decoded = jwtDecode<User>(credential);
        setToken(credential);
        setUser(decoded);
        localStorage.setItem('auth_token', credential);
    };

    const logout = () => {
        googleLogout();
        setToken(null);
        setUser(null);
        localStorage.removeItem('auth_token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
