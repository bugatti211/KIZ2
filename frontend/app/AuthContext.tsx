import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextProps {
  showAuthModal: boolean;
  setShowAuthModal: (v: boolean) => void;
  authMode: 'login' | 'register';
  setAuthMode: (m: 'login' | 'register') => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  return (
    <AuthContext.Provider value={{ showAuthModal, setShowAuthModal, authMode, setAuthMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthModal = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthModal must be used within AuthProvider');
  return ctx;
};

// Добавляем пустой default export для устранения ошибки импорта/роутинга
export default {};
