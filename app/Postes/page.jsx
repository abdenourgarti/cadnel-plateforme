'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog } from '@headlessui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/layouts/MainLayout';

// Schéma de validation pour l'ajout de poste
const addPosteSchema = Yup.object().shape({
  nom: Yup.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .required('Le nom du poste est requis'),
  id_company: Yup.number()
    .required('L\'entreprise est requise'),
});

// Schéma de validation pour la modification de poste
const editPosteSchema = Yup.object().shape({
  nom: Yup.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .required('Le nom du poste est requis'),
  id_company: Yup.number()
    .required('L\'entreprise est requise'),
});

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.token;
  }
  return null;
};

const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (!userStr) return { role: '', companyId: '' };
    try {
      const user = JSON.parse(userStr);
      return user;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return { role: '', companyId: '' };
    }
  }
  return { role: '', companyId: '' };
};

export default function Postes() {
  const [postes, setPostes] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPoste, setSelectedPoste] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ role: '', companyId: '' });
  const [userInitialized, setUserInitialized] = useState(false);
  
  // Récupérer l'utilisateur actuel seulement côté client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = getCurrentUser();
      setCurrentUser(user);
      setUserInitialized(true);
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
          setEntreprises(response.data.data.map(company => ({
            id: company.id_company,
            nom: company.nom
          })));
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

  // Récupérer les postes
  const fetchPostes = async (companyId) => {
    if (!companyId) {
      // Si aucun ID d'entreprise n'est disponible, ne rien faire
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/poste/${companyId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setPostes(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des postes:', error);
      toast.error('Erreur lors de la récupération des postes', {
        position: "top-right",
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les postes
  useEffect(() => {
    if (!userInitialized) return; // Attendre que l'utilisateur soit initialisé

    if (isAdmin) {
      if (selectedEntrepriseId) {
        fetchPostes(selectedEntrepriseId);
      }
    } else if (currentUser.companyId) {
      fetchPostes(currentUser.companyId);
    }
  }, [selectedEntrepriseId, isAdmin, currentUser.companyId, userInitialized]);

  // Initialiser le formulaire avec des valeurs par défaut
  const formik = useFormik({
    initialValues: {
      nom: '',
      id_company: isAdmin ? '' : currentUser.companyId
    },
    enableReinitialize: true, // Important pour mettre à jour les valeurs quand currentUser change
    validationSchema: isEditing ? editPosteSchema : addPosteSchema,
    onSubmit: async (values) => {
      try {
        // S'assurer que id_company est correctement défini pour les utilisateurs non-admin
        const dataToSubmit = { 
          ...values,
          id_company: isAdmin ? values.id_company : currentUser.companyId
        };
        
        if (isEditing) {
          await axios.put(`http://localhost:5000/api/poste/${selectedPoste.id_poste}`, dataToSubmit, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          toast.success('Poste modifié avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        } else {
          await axios.post('http://localhost:5000/api/poste', dataToSubmit, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          toast.success('Poste ajouté avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        }
        
        // Recharger les postes après l'opération
        if (isAdmin) {
          if (selectedEntrepriseId) {
            fetchPostes(selectedEntrepriseId);
          }
        } else {
          fetchPostes(currentUser.companyId);
        }
        
        handleCloseModal();
      } catch (error) {
        console.error('Erreur lors de l\'opération:', error);
        toast.error(`Erreur: ${error.response?.data?.message || 'Une erreur est survenue'}`, {
          position: "top-right",
          autoClose: 5000
        });
      }
    },
  });

  // Mettre à jour le formulaire quand l'utilisateur est initialisé
  useEffect(() => {
    if (userInitialized && !isAdmin) {
      formik.setFieldValue('id_company', currentUser.companyId);
    }
  }, [userInitialized, currentUser.companyId, isAdmin]);

  const handleEdit = (poste) => {
    setSelectedPoste(poste);
    formik.setValues({
      nom: poste.nom,
      id_company: isAdmin ? poste.id_company : currentUser.companyId
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (poste) => {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer le poste "${poste.nom}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:5000/api/poste/${poste.id_poste}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          
          // Recharger les postes après la suppression
          if (isAdmin) {
            if (selectedEntrepriseId) {
              fetchPostes(selectedEntrepriseId);
            }
          } else {
            fetchPostes(currentUser.companyId);
          }
          
          toast.success('Poste supprimé avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
          toast.error(`Erreur: ${error.response?.data?.message || 'Une erreur est survenue lors de la suppression'}`, {
            position: "top-right",
            autoClose: 5000
          });
        }
      }
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    formik.resetForm();
    setSelectedPoste(null);
  };

  const getEntrepriseName = (id) => {
    const entreprise = entreprises.find(ent => ent.id === id);
    return entreprise ? entreprise.nom : 'Non défini';
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Postes</h1>
          <button
            onClick={() => {
              // Reset le formulaire avant d'ouvrir le modal
              formik.resetForm({
                values: {
                  nom: '',
                  id_company: isAdmin ? '' : currentUser.companyId
                }
              });
              setIsEditing(false);
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Ajouter
          </button>
        </div>

        {/* Filtre par entreprise (uniquement pour les admins) */}
        {isAdmin && (
          <div className="mb-6">
            <label 
              htmlFor="entrepriseFilter" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Filtrer par entreprise
            </label>
            <select
              id="entrepriseFilter"
              value={selectedEntrepriseId}
              onChange={(e) => setSelectedEntrepriseId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Sélectionner une entreprise</option>
              {entreprises.map((entreprise) => (
                <option key={entreprise.id} value={entreprise.id}>
                  {entreprise.nom}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Message de chargement ou d'erreur */}
        {(!isAdmin && !currentUser.companyId) ? (
          <div className="text-center py-4 text-red-500">Impossible de charger les postes. ID d'entreprise non disponible.</div>
        ) : (isAdmin && !selectedEntrepriseId) ? (
          <div className="text-center py-4">Veuillez sélectionner une entreprise pour voir les postes.</div>
        ) : null}

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {postes.length > 0 ? (
                postes.map((poste, index) => (
                  <tr key={poste.id_poste} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getEntrepriseName(poste.id_company)}</td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{poste.nom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(poste)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(poste)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="no-data">
                  <td colSpan={isAdmin ? 4 : 3} className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucun poste trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Ajout/Modification */}
        {isModalOpen && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" aria-hidden="true" />

              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
                &#8203;
              </span>

              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {isEditing ? "Modifier un poste" : "Ajouter un poste"}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={formik.handleSubmit}>
                  <div className="space-y-4">
                    {/* Entreprise (uniquement pour les admins) */}
                    {isAdmin && (
                      <div>
                        <label
                          htmlFor="id_company"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Entreprise
                        </label>
                        <select
                          id="id_company"
                          name="id_company"
                          value={formik.values.id_company}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                            formik.touched.id_company && formik.errors.id_company
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                        >
                          <option value="">Sélectionner une entreprise</option>
                          {entreprises.map((entreprise) => (
                            <option key={entreprise.id} value={entreprise.id}>
                              {entreprise.nom}
                            </option>
                          ))}
                        </select>
                        {formik.touched.id_company && formik.errors.id_company && (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.id_company}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nom du poste */}
                    <div>
                      <label
                        htmlFor="nom"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nom du poste
                      </label>
                      <input
                        type="text"
                        id="nom"
                        name="nom"
                        value={formik.values.nom}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.nom && formik.errors.nom
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        placeholder="Saisir le nom du poste"
                      />
                      {formik.touched.nom && formik.errors.nom && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.nom}
                        </div>
                      )}
                    </div>

                    {/* Champ caché pour id_company pour les non-admin */}
                    {!isAdmin && (
                      <input 
                        type="hidden" 
                        name="id_company" 
                        value={currentUser.companyId || ''} 
                      />
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      onClick={handleCloseModal}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={formik.isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-emerald-400"
                    >
                      {isEditing ? "Modifier" : "Ajouter"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}