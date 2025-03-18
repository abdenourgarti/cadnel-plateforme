'use client'
import React, { useState, useEffect, Suspense } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import axios from 'axios';

// Composant avec useSearchParams
function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();

  // Vérifier si déjà connecté au chargement de la page
  useEffect(() => {
    if (user) {
      router.push('/Dashboard');
    }
    
    // Vérifier si la session a expiré (paramètre URL)
    const expired = searchParams.get('expired');
    if (expired === 'true') {
      setSessionExpired(true);
      setLoginError('Votre session a expiré. Veuillez vous reconnecter.');
      
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, '/');
    }
  }, [user, router, searchParams]);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Adresse email invalide')
      .required('L\'email est requis'),
    password: Yup.string()
      .required('Le mot de passe est requis')
  });

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      // Réinitialiser les messages d'erreur
      setLoginError('');
      setSessionExpired(false);
      setLoading(true);
      
      try {
        // Appel API avec axios
        const response = await axios.post('http://localhost:5000/api/auth', {
          email: values.email,
          password: values.password
        });
        
        // Si la requête réussit, on récupère les données utilisateur et le token
        const userData = response.data;
        console.log('user', userData)
        
        // Utiliser la fonction login du contexte avec le token
        login({
          id: userData.data.data.id_user,
          name: userData.data.data.nomcomplet,
          email: userData.data.data.email,
          role: userData.data.data.role,
          companyId: userData.data.data.id_company,
          companyName: userData.data.data.nomcompany,
          token: userData.data.accessToken
        });
        
      } catch (error) {
        console.error('Erreur de connexion:', error);
        
        // Afficher le message d'erreur approprié
        if (error.response) {
          // L'API a répondu avec un statut d'erreur
          setLoginError(error.response.data.message || 'Email ou mot de passe incorrect');
        } else if (error.request) {
          // La requête a été faite mais pas de réponse
          setLoginError('Impossible de joindre le serveur. Veuillez réessayer plus tard.');
        } else {
          // Erreur pendant la préparation de la requête
          setLoginError('Une erreur s\'est produite. Veuillez réessayer.');
        }
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <>
      {sessionExpired && (
        <div className="mb-4 p-3 bg-amber-100 text-amber-700 rounded-lg text-center">
          Votre session a expiré. Veuillez vous reconnecter.
        </div>
      )}

      {loginError && !sessionExpired && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
          {loginError}
        </div>
      )}

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Email field */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FaEnvelope className="h-5 w-5 text-emerald-500" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email ou nom d'utilisateur"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-gray-50"
                {...formik.getFieldProps('email')}
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <div className="text-red-500 text-sm mt-1 ml-2">{formik.errors.email}</div>
            )}
          </div>

          {/* Password field */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FaLock className="h-5 w-5 text-emerald-500" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mot de passe"
                className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-gray-50"
                {...formik.getFieldProps('password')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <div className="text-red-500 text-sm mt-1 ml-2">{formik.errors.password}</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <Link
            href="/Forget-password"
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium rounded-lg ${
            loading ? 'opacity-70 cursor-not-allowed' : 'hover:from-emerald-700 hover:to-emerald-600 hover:scale-[1.02]'
          } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform transition-all duration-200 shadow-lg`}
        >
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>
    </>
  );
}

// Chargement pendant le suspense
function LoginLoading() {
  return <div className="animate-pulse text-center py-4">Chargement...</div>;
}

// Page de login principale
const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Demi-cercle supérieur droit */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-full transform translate-x-1/2 -translate-y-1/2 opacity-20"></div>
      
      {/* Demi-cercle inférieur gauche */}
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-full transform -translate-x-1/2 translate-y-1/2 opacity-20"></div>

      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">
        {/* Section gauche - Formulaire */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="mb-12">
            <div className="flex justify-center mb-8">
              <Image
                src="/logo.png"
                alt="Check Time Logo"
                width={280}
                height={100}
                className="h-20 w-auto"
              />
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Bienvenue</h2>
            <p className="text-center text-gray-600">Connectez-vous à votre espace personnel</p>
          </div>

          <Suspense fallback={<LoginLoading />}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Section droite - Décoration */}
        <div className="hidden md:block w-1/2 bg-gradient-to-br from-emerald-600 to-emerald-400 p-12">
          <div className="h-full flex flex-col justify-center items-center text-white space-y-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Check Time</h1>
              <p className="text-lg opacity-90">
                Gérez efficacement vos ressources humaines et obtenez des rapports personnalisables
              </p>
            </div>
            <div className="w-full max-w-md">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg">
                <p className="text-white/90 italic">
                  "Une solution complète pour optimiser la gestion de vos ressources humaines et améliorer la productivité de votre entreprise."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;