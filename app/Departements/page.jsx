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

// Schéma de validation pour l'ajout de département
const addUserSchema = Yup.object().shape({
  nom: Yup.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .required('Le nom du département est requis'),
  id_company: Yup.number()
    .required('L\'entreprise est requise'),
});

// Schéma de validation pour la modification de département
const editUserSchema = Yup.object().shape({
  nom: Yup.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .required('Le nom du département est requis'),
  id_company: Yup.number()
    .required('L\'entreprise est requise'),
});

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    if (user) {
      return JSON.parse(user)?.token;
    }
  }
  return null;
};

const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        role: user?.role || '', 
        id_company: user?.companyId || user?.id_company || ''
      };
    }
  }
  return { role: '', id_company: '' };
};

export default function Departements() {
  const [departements, setDepartements] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartement, setSelectedDepartement] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ role: '', id_company: '' });
  
  // Récupérer l'utilisateur actuel seulement côté client
  useEffect(() => {
    // S'assurer que le code s'exécute uniquement côté client
    if (typeof window !== 'undefined') {
      const user = getCurrentUser();
      setCurrentUser(user);
      
      // Initialiser selectedEntrepriseId pour les admins
      if (user.role === 'admin') {
        setSelectedEntrepriseId('');
      } else {
        setSelectedEntrepriseId(user.id_company);
      }
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

  // Récupérer les départements
  const fetchDepartements = async (companyId) => {
    if (!companyId && !isAdmin) {
      // Si pas d'ID d'entreprise et pas admin, utiliser l'ID de l'entreprise de l'utilisateur
      companyId = currentUser.id_company;
    }
    
    if (!companyId && isAdmin) {
      // Si admin sans entreprise sélectionnée, ne rien afficher
      setDepartements([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/departement/${companyId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setDepartements(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des départements:', error);
      toast.error('Erreur lors de la récupération des départements', {
        position: "top-right",
        autoClose: 5000
      });
      setDepartements([]);
    } finally {
      setLoading(false);
    }
  };

  // Effet initial pour charger les départements
  useEffect(() => {
    // On attend que currentUser soit défini correctement
    if (currentUser.role) {
      if (isAdmin) {
        // Pour les admins, attendre qu'une entreprise soit sélectionnée
        if (selectedEntrepriseId) {
          fetchDepartements(selectedEntrepriseId);
        } else {
          setDepartements([]);
          setLoading(false);
        }
      } else {
        // Pour les utilisateurs normaux, charger directement les départements de leur entreprise
        fetchDepartements(currentUser.id_company);
      }
    }
  }, [currentUser, selectedEntrepriseId]);

  const formik = useFormik({
    initialValues: {
      nom: '',
      id_company: isAdmin ? selectedEntrepriseId : currentUser.id_company
    },
    enableReinitialize: true, // Important pour mettre à jour les valeurs quand currentUser change
    validationSchema: isEditing ? editUserSchema : addUserSchema,
    onSubmit: async (values) => {
      try {
        // Assurer que id_company est un nombre
        const submissionValues = {
          ...values,
          id_company: Number(values.id_company)
        };
        
        console.log('Submitting form with values:', submissionValues);
        
        if (isEditing) {
          await axios.put(`http://localhost:5000/api/departement/${selectedDepartement.id_departement}`, submissionValues, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          toast.success('Département modifié avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        } else {
          await axios.post('http://localhost:5000/api/departement', submissionValues, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          toast.success('Département ajouté avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        }
        
        // Rafraîchir la liste des départements
        if (isAdmin) {
          fetchDepartements(selectedEntrepriseId);
        } else {
          fetchDepartements(currentUser.id_company);
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

  // Mettre à jour les valeurs du formulaire quand l'utilisateur ou l'entreprise sélectionnée change
  useEffect(() => {
    formik.setValues({
      nom: formik.values.nom,
      id_company: isAdmin ? selectedEntrepriseId : currentUser.id_company
    });
  }, [currentUser, selectedEntrepriseId, isAdmin]);

  const handleEdit = (departement) => {
    setSelectedDepartement(departement);
    formik.setValues({
      nom: departement.nom,
      id_company: departement.id_company
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (departement) => {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer le département "${departement.nom}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:5000/api/departement/${departement.id_departement}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          
          // Rafraîchir la liste des départements
          if (isAdmin) {
            fetchDepartements(selectedEntrepriseId);
          } else {
            fetchDepartements(currentUser.id_company);
          }
          
          toast.success('Département supprimé avec succès', {
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
    setSelectedDepartement(null);
  };

  const handleAddDepartement = () => {
    // Réinitialiser le formulaire avec les valeurs par défaut
    formik.resetForm();
    formik.setValues({
      nom: '',
      id_company: isAdmin ? selectedEntrepriseId : currentUser.id_company
    });
    setIsEditing(false);
    setIsModalOpen(true);
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
          <h1 className="text-2xl font-bold text-gray-800">Départements</h1>
          <button
            onClick={handleAddDepartement}
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

        {/* Message si aucune entreprise n'est sélectionnée (admin uniquement) */}
        {isAdmin && !selectedEntrepriseId && !loading && (
          <div className="text-center py-10">
            <p className="text-gray-500">Veuillez sélectionner une entreprise pour voir ses départements.</p>
          </div>
        )}

        {/* Indicateur de chargement */}
        {loading && (
          <div className="text-center py-10">
            <p className="text-gray-500">Chargement des départements...</p>
          </div>
        )}

        {/* Tableau */}
        {(!loading && (!isAdmin || (isAdmin && selectedEntrepriseId))) && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {departements.length > 0 ? (
                  departements.map((departement) => (
                    <tr key={departement.id_departement} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{departement.id_departement}</td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getEntrepriseName(departement.id_company)}</td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{departement.nom}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(departement)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(departement)}
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
                      Aucun département trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

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
                    {isEditing ? "Modifier un département" : "Ajouter un département"}
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
                    {!isAdmin && (
                      <input
                        type="hidden"
                        name="id_company"
                        value={formik.values.id_company}
                      />
                    )}

                    {/* Nom du département */}
                    <div>
                      <label
                        htmlFor="nom"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nom du département
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
                        placeholder="Saisir le nom du département"
                      />
                      {formik.touched.nom && formik.errors.nom && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.nom}
                        </div>
                      )}
                    </div>
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
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
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