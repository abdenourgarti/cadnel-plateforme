'use client';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';

// Créer le contexte
const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => useContext(AuthContext);

// Durée de la session en millisecondes (15 minutes)
const SESSION_DURATION = 15 * 60 * 1000;

// Fournisseur du contexte
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const sessionTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const isRedirectingRef = useRef(false);

  // Fonction pour vider complètement le localStorage
  const clearLocalStorage = () => {
    localStorage.clear();
  };

  // Configurer axios avec le token d'authentification
  useEffect(() => {
    if (user && user.token) {
      // Définir le token dans les headers par défaut pour toutes les futures requêtes
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
    } else {
      // Supprimer le header d'autorisation si l'utilisateur n'est pas connecté
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [user]);

  // Fonction pour rafraîchir le timer de session
  const refreshSession = () => {
    if (!user) return;
    
    lastActivityRef.current = Date.now();
    
    // Stocker le timestamp de dernière activité
    localStorage.setItem('lastActivity', lastActivityRef.current.toString());
    
    // Mettre à jour les cookies d'authentification
    document.cookie = `user=true; path=/; max-age=${SESSION_DURATION / 1000}`;
    document.cookie = `userRole=${user.role}; path=/; max-age=${SESSION_DURATION / 1000}`;
  };

  // Fonction pour vérifier si la session a expiré
  const checkSessionExpiration = () => {
    if (!user || isRedirectingRef.current) return;
    
    const currentTime = Date.now();
    const lastActivity = parseInt(localStorage.getItem('lastActivity') || lastActivityRef.current);
    const timeSinceLastActivity = currentTime - lastActivity;
    
    if (timeSinceLastActivity > SESSION_DURATION) {
      console.log('Session expirée après inactivité');
      isRedirectingRef.current = true;
      logout(true);
    }
  };

  // Configurer les écouteurs d'événements pour l'activité de l'utilisateur
  useEffect(() => {
    if (!user) return;
    
    // Définir les événements d'activité utilisateur à écouter
    const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    
    // Gérer l'activité de l'utilisateur
    const handleUserActivity = () => {
      refreshSession();
    };
    
    // Ajouter des écouteurs d'événements pour chaque type d'activité
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    // Configurer le timer qui vérifie l'expiration de session toutes les 30 secondes
    sessionTimerRef.current = setInterval(checkSessionExpiration, 30000);
    
    // Nettoyer les écouteurs d'événements et le timer lors du démontage du composant
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [user]);

  // Reset l'état de redirection quand le chemin change
  useEffect(() => {
    isRedirectingRef.current = false;
  }, [pathname]);

  // Vérifier si l'utilisateur est connecté au chargement initial
  useEffect(() => {
    // Vérifier s'il y a un utilisateur dans localStorage
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      // Vérifier si la session a expiré pendant l'absence de l'utilisateur
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
      const currentTime = Date.now();
      
      if (currentTime - lastActivity > SESSION_DURATION) {
        // La session a expiré, déconnecter l'utilisateur
        console.log('Session expirée après rechargement');
        clearLocalStorage();
        
        // Supprimer les cookies
        document.cookie = 'user=; path=/; max-age=0';
        document.cookie = 'userRole=; path=/; max-age=0';
        
        setUser(null);
        
        // Rediriger uniquement si on est sur une page protégée
        const isOnProtectedPage = !['/', '/login'].includes(pathname);
        if (isOnProtectedPage) {
          isRedirectingRef.current = true;
          router.push('/?expired=true');
        }
      } else {
        // La session est encore valide
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Configurer axios avec le token stocké
        if (userData.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        }
        
        refreshSession();
      }
    }
    
    setLoading(false);
  }, [pathname, router]);

  // Fonction de connexion
  const login = (userData) => {
    // Vider d'abord le localStorage
    clearLocalStorage();
    
    // Puis définir le nouvel utilisateur
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Initialiser le timestamp de dernière activité
    lastActivityRef.current = Date.now();
    localStorage.setItem('lastActivity', lastActivityRef.current.toString());
    
    // Définir les cookies pour le middleware avec une durée de 15 minutes
    document.cookie = `user=true; path=/; max-age=${SESSION_DURATION / 1000}`;
    document.cookie = `userRole=${userData.role}; path=/; max-age=${SESSION_DURATION / 1000}`;
    
    // Configurer axios avec le token
    if (userData.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    }
    
    router.push('/Dashboard');
  };

  // Fonction de déconnexion
  const logout = (isSessionExpired = false) => {
    setUser(null);
    
    // Vider complètement le localStorage
    clearLocalStorage();
    
    // Supprimer les cookies
    document.cookie = 'user=; path=/; max-age=0';
    document.cookie = 'userRole=; path=/; max-age=0';
    
    // Supprimer le header d'autorisation
    delete axios.defaults.headers.common['Authorization'];
    
    // Nettoyer le timer de session
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    
    // Rediriger avec un paramètre si la session a expiré
    if (isSessionExpired) {
      router.push('/?expired=true');
    } else {
      router.push('/');
    }
  };

  // Vérifier si l'utilisateur est admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // Récupérer le token d'authentification
  const getToken = () => {
    return user?.token || null;
  };

  // Valeurs à partager dans le contexte
  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin,
    refreshSession,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;