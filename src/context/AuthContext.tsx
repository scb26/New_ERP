import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'cashier' | 'accountant';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, passwordOrRole?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'unidex_auth_token';
const USER_KEY = 'unidex_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    // If no token or user, automatically perform initial session login as admin
    const initializeAuth = async () => {
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUser(data.user);
              localStorage.setItem(USER_KEY, JSON.stringify(data.user));
              return;
            }
          }
        } catch (e) {
          console.error("Auth verification failed:", e);
        }
      }
      // Re-login with default credentials
      await login('admin', 'admin123');
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password?: string): Promise<boolean> => {
    try {
      const defaultPasswords: Record<string, string> = {
        admin: 'admin123',
        cashier: 'cashier123',
        accountant: 'acct123'
      };
      const roleNames = ['admin', 'cashier', 'accountant'];
      const pwd = (password && !roleNames.includes(password)) 
        ? password 
        : (defaultPasswords[username] || 'admin123');

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pwd })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return true;
      } else {
        const err = await res.json();
        alert(err.error || 'Authentication failed');
        return false;
      }
    } catch (e) {
      console.error('Login error:', e);
      return false;
    }
  };

  const logout = () => {
    // Switch to cashier or prompt login
    setIsLoginModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user,
        isLoginModalOpen,
        setIsLoginModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
