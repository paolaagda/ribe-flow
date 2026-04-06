import React, { createContext, useContext, useState } from 'react';
import { UserRole, User, CompanyCargo, mockUsers } from '@/data/mock-data';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (cargo: CompanyCargo) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ribercred_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (cargo: CompanyCargo) => {
    const foundUser = mockUsers.find(u => u.role === cargo) || mockUsers[0];
    setUser(foundUser);
    localStorage.setItem('ribercred_user', JSON.stringify(foundUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ribercred_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || null,
      isAuthenticated: !!user,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
