'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/layouts/MainLayout';
import { Switch } from '@headlessui/react';

// Options pour la fréquence d'envoi d'emails
const frequenceOptions = [
  { id: 1, value: "journalier", label: "Journalier" },
  { id: 2, value: "hebdo", label: "Hebdomadaire" },
  { id: 3, value: "mensuel", label: "Mensuel" },
];

// Types de rapports disponibles
const typesRapports = [
  { id: 1, nom: "Rapport d'absence", key: "absc" },
  { id: 2, nom: "Rapport de retard", key: "retard" },
  { id: 3, nom: "Rapport de congé", key: "conge" },
  { id: 4, nom: "Rapport des employés", key: "pointretardabsc" },
  { id: 5, nom: "État de ponctualité", key: "etatponct" },
];

// Schéma de validation
const parametresSchema = Yup.object().shape({
  type: Yup.string()
    .required('Le type est requis'),
  absc: Yup.boolean()
    .required('Le champ absc est requis'),
  retard: Yup.boolean()
    .required('Le champ retard est requis'),
  conge: Yup.boolean()
    .required('Le champ conge est requis'),
  pointretardabsc: Yup.boolean()
    .required('Le champ pointretardabsc est requis'),
  etatponct: Yup.boolean()
    .required('Le champ etatponct est requis'),
});

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
    return user;
  }
  return { role: '', id: '' }; // Valeur par défaut
};

export default function Settings() {
  const [parametres, setParametres] = useState(null);
  const [entreprises, setEntreprises] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ role: '', id: '' });

  // Récupérer l'utilisateur actuel seulement côté client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = getCurrentUser();
      setCurrentUser(user);
    }
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  // Récupérer les entreprises (uniquement pour les admins)
  useEffect(() => {
    if (isAdmin) {
      const fetchEntreprises = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/company', {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          setEntreprises(response.data.data);
        } catch (error) {
          console.error('Erreur lors de la récupération des entreprises:', error);
          toast.error('Erreur lors de la récupération des entreprises', {
            position: "top-right",
            autoClose: 5000
          });
        }
      };

      fetchEntreprises();
    }
  }, [isAdmin]);

  // Récupérer les utilisateurs d'une entreprise (uniquement pour les admins)
  useEffect(() => {
    if (isAdmin && selectedEntrepriseId) {
      const fetchUtilisateurs = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/user/${selectedEntrepriseId}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          setUtilisateurs(response.data.data);
        } catch (error) {
          console.error('Erreur lors de la récupération des utilisateurs:', error);
          toast.error('Erreur lors de la récupération des utilisateurs', {
            position: "top-right",
            autoClose: 5000
          });
        }
      };

      fetchUtilisateurs();
    } else {
      setUtilisateurs([]);
    }
  }, [selectedEntrepriseId, isAdmin]);

  // Récupérer les paramètres de l'utilisateur sélectionné
  const fetchParametres = async () => {
    try {
      setLoading(true);
      const userId = isAdmin ? selectedUserId : currentUser.id;
      if (userId) {
        const response = await axios.get(`http://localhost:5000/api/parametre/user/${userId}`, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        setParametres(response.data.data[0]); // Prendre le premier élément du tableau
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      toast.error('Erreur lors de la récupération des paramètres', {
        position: "top-right",
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParametres();
  }, [selectedUserId, isAdmin, currentUser.id]);

  // Formulaire pour modifier les paramètres
  const formik = useFormik({
    initialValues: {
      type: '',
      absc: false,
      retard: false,
      conge: false,
      pointretardabsc: false,
      etatponct: false
    },
    validationSchema: parametresSchema,
    onSubmit: async (values) => {
      try {
        const userId = isAdmin ? selectedUserId : currentUser.id;
        const payload = {
          id_user: userId,
          type: values.type,
          absc: values.absc ? 1 : 0,
          retard: values.retard ? 1 : 0,
          conge: values.conge ? 1 : 0,
          pointretardabsc: values.pointretardabsc ? 1 : 0,
          etatponct: values.etatponct ? 1 : 0
        };
        await axios.put(`http://localhost:5000/api/parametre/${parametres.id_parametre}`, payload, {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        toast.success('Paramètres mis à jour avec succès', {
          position: "top-right",
          autoClose: 5000
        });
        setIsEditing(false);
        // Rafraîchir les paramètres après modification
        fetchParametres();
      } catch (error) {
        console.error('Erreur lors de la mise à jour des paramètres:', error);
        toast.error(`Erreur: ${error.response?.data?.message || 'Une erreur est survenue'}`, {
          position: "top-right",
          autoClose: 5000
        });
      }
    },
  });

  // Ouvrir le mode édition
  const handleEdit = () => {
    if (parametres) {
      formik.setValues({
        type: parametres.type,
        absc: parametres.absc,
        retard: parametres.retard,
        conge: parametres.conge,
        pointretardabsc: parametres.pointretardabsc,
        etatponct: parametres.etatponct
      });
      setIsEditing(true);
    }
  };

  // Annuler l'édition
  const handleCancel = () => {
    formik.resetForm();
    setIsEditing(false);
  };

  // Gérer le changement d'état des rapports
  const handleRapportChange = (key, value) => {
    formik.setFieldValue(key, value);
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
          {parametres && !isEditing && (
            <button
              onClick={handleEdit}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PencilIcon className="w-5 h-5 mr-2" />
              Modifier
            </button>
          )}
          {isEditing && (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 mr-2" />
                Annuler
              </button>
              <button
                onClick={formik.handleSubmit}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          )}
        </div>

        {/* Filtres pour les admins */}
        {isAdmin && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Filtres</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sélection d'entreprise */}
              <div>
                <label htmlFor="entrepriseId" className="block text-sm font-medium text-gray-700 mb-1">
                  Entreprise
                </label>
                <select
                  id="entrepriseId"
                  value={selectedEntrepriseId}
                  onChange={(e) => setSelectedEntrepriseId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Sélectionnez une entreprise</option>
                  {entreprises.map((entreprise) => (
                    <option key={entreprise.id_company} value={entreprise.id_company}>
                      {entreprise.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélection d'utilisateur */}
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                  Utilisateur
                </label>
                <select
                  id="userId"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={!selectedEntrepriseId}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Sélectionnez un utilisateur</option>
                  {utilisateurs.map((utilisateur) => (
                    <option key={utilisateur.id_user} value={utilisateur.id_user}>
                      {utilisateur.nomcomplet}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Contenu principal */}
        {loading ? (
          <div className="text-center">Chargement...</div>
        ) : parametres ? (
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={formik.handleSubmit}>
              {/* Fréquence d'envoi d'emails */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Fréquence d'envoi d'emails</h2>
                <div className="max-w-md">
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Envoyer les rapports
                  </label>
                  <select
                    id="type"
                    value={isEditing ? formik.values.type : parametres.type}
                    onChange={formik.handleChange}
                    disabled={!isEditing}
                    className={`block w-full pl-3 pr-10 py-2 text-base border rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                      formik.touched.type && formik.errors.type
                        ? 'border-red-300'
                        : 'border-gray-300'
                    } ${!isEditing ? 'bg-gray-50' : ''}`}
                  >
                    {frequenceOptions.map((option) => (
                      <option key={option.id} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {formik.touched.type && formik.errors.type && (
                    <div className="mt-1 text-sm text-red-600">
                      {formik.errors.type}
                    </div>
                  )}
                </div>
              </div>

              {/* Rapports à envoyer */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Rapports à envoyer</h2>
                <div className="space-y-4">
                  {typesRapports.map((rapport) => (
                    <div key={rapport.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">{rapport.nom}</span>
                      <Switch
                        checked={isEditing ? formik.values[rapport.key] : parametres[rapport.key]}
                        onChange={(checked) => handleRapportChange(rapport.key, checked)}
                        disabled={!isEditing}
                        className={`${
                          (isEditing ? formik.values[rapport.key] : parametres[rapport.key]) ? 'bg-emerald-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full ${
                          !isEditing ? 'opacity-80' : ''
                        }`}
                      >
                        <span className="sr-only">Activer/désactiver {rapport.nom}</span>
                        <span
                          className={`${
                            (isEditing ? formik.values[rapport.key] : parametres[rapport.key]) ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                        />
                      </Switch>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center">Aucun paramètre trouvé.</div>
        )}
      </div>
    </MainLayout>
  );
}