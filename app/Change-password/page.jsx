'use client';

import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layouts/MainLayout';
import axios from 'axios';

// Schéma de validation pour le changement de mot de passe
const changePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('Le mot de passe actuel est requis'),
  newPassword: Yup.string()
    .min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères')
    .notOneOf([Yup.ref('currentPassword')], 'Le nouveau mot de passe doit être différent de l\'ancien')
    .required('Le nouveau mot de passe est requis'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Les mots de passe doivent correspondre')
    .required('La confirmation du mot de passe est requise')
});

// Fonctions d'authentification
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token;
  }
  return null;
};

const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const user = JSON.parse(localStorage.getItem('user'));
    return user || { role: '', id: '' }; // Valeur par défaut
  }
  return { role: '', id: '' }; // Valeur par défaut
};

export default function ChangePassword() {
  const router = useRouter();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState({ role: '', id: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer l'utilisateur actuel seulement côté client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = getCurrentUser();
      setCurrentUser(user);
    }
  }, []);

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: changePasswordSchema,
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        const userId = currentUser.id;
        
        if (!userId) {
          toast.error('Utilisateur non connecté', {
            position: "top-right",
            autoClose: 5000
          });
          return;
        }

        // Envoi de la requête au backend
        const response = await axios.put(
          `http://localhost:5000/api/auth/editpassword/${userId}`, 
          {
            oldpassword: values.currentPassword,
            newpassword: values.newPassword
          },
          {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          }
        );

        // Vérification de la réponse
        if (response.status === 200) {
          toast.success('Mot de passe modifié avec succès', {
            position: "top-right",
            autoClose: 5000
          });
          
          // Réinitialisation du formulaire
          formik.resetForm();
          
          // Redirection après quelques secondes
          setTimeout(() => {
            router.push('/Dashboard');
          }, 2000);
        }
      } catch (error) {
        // Gestion des erreurs
        const errorMessage = error.response?.data?.message || 'Une erreur est survenue lors du changement de mot de passe';
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000
        });
        console.error('Erreur lors du changement de mot de passe:', error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleCancel = () => {
    router.push('/Dashboard');
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Changer votre mot de passe</h1>
          <p className="text-gray-600 mt-2">
            Veuillez saisir votre mot de passe actuel et votre nouveau mot de passe
          </p>
        </div>
        
        {/* Formulaire */}
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <form onSubmit={formik.handleSubmit}>
            <div className="space-y-4">
              {/* Mot de passe actuel */}
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mot de passe actuel
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    {...formik.getFieldProps('currentPassword')}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                      formik.touched.currentPassword && formik.errors.currentPassword
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                    placeholder="Saisir votre mot de passe actuel"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
                {formik.touched.currentPassword && formik.errors.currentPassword && (
                  <div className="mt-1 text-sm text-red-600">
                    {formik.errors.currentPassword}
                  </div>
                )}
              </div>

              {/* Nouveau mot de passe */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nouveau mot de passe
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    {...formik.getFieldProps('newPassword')}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                      formik.touched.newPassword && formik.errors.newPassword
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                    placeholder="Saisir votre nouveau mot de passe"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
                {formik.touched.newPassword && formik.errors.newPassword && (
                  <div className="mt-1 text-sm text-red-600">
                    {formik.errors.newPassword}
                  </div>
                )}
              </div>

              {/* Confirmation du nouveau mot de passe */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirmer le nouveau mot de passe
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    {...formik.getFieldProps('confirmPassword')}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                      formik.touched.confirmPassword && formik.errors.confirmPassword
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                    placeholder="Saisir à nouveau votre nouveau mot de passe"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <div className="mt-1 text-sm text-red-600">
                    {formik.errors.confirmPassword}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-emerald-300"
                disabled={isLoading}
              >
                {isLoading ? 'Modification en cours...' : 'Modifier le mot de passe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}