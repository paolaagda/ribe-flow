import React, { createContext, useContext, useState } from 'react';
import { UserRole, User, AppProfile, mockUsers } from '@/data/mock-data';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  profile: AppProfile | null;
  isAuthenticated: boolean;
  login: (cargo: UserRole, appProfile: AppProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  profile: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ribercred_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (cargo: UserRole, appProfile: AppProfile) => {
    const foundUser = mockUsers.find(u => u.role === cargo) || mockUsers[0];
    const userWithProfile = { ...foundUser, profile: appProfile };
    setUser(userWithProfile);
    localStorage.setItem('ribercred_user', JSON.stringify(userWithProfile));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ribercred_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || null,
      profile: user?.profile || null,
      isAuthenticated: !!user,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
