'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Créer le contexte
const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => useContext(AuthContext);

// Fournisseur du contexte
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fonction pour vider complètement le localStorage
  const clearLocalStorage = () => {
    localStorage.clear();
  };

  // Vérifier si l'utilisateur est connecté au chargement initial
  useEffect(() => {
    // Vérifier s'il y a un utilisateur dans localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // Définir les cookies pour le middleware
      document.cookie = `user=true; path=/; max-age=86400`; // expire dans 24h
      document.cookie = `userRole=${userData.role}; path=/; max-age=86400`; // cookie pour le rôle
    }
    setLoading(false);
  }, []);

  // Fonction de connexion
  const login = (userData) => {
    // Vider d'abord le localStorage
    clearLocalStorage();
    
    // Puis définir le nouvel utilisateur
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Définir les cookies pour le middleware
    document.cookie = `user=true; path=/; max-age=86400`;
    document.cookie = `userRole=${userData.role}; path=/; max-age=86400`; // cookie pour le rôle
    
    router.push('/Dashboard');
  };

  // Fonction de déconnexion
  const logout = () => {
    setUser(null);
    
    // Vider complètement le localStorage
    clearLocalStorage();
    
    // Supprimer les cookies
    document.cookie = 'user=; path=/; max-age=0';
    document.cookie = 'userRole=; path=/; max-age=0';
    
    router.push('/');
  };

  // Vérifier si l'utilisateur est admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Valeurs à partager dans le contexte
  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};