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

// Schéma de validation pour l'ajout/modification de zone
const zoneSchema = Yup.object().shape({
  nom: Yup.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .required('Le nom de la zone est requis'),
  id_company: Yup.number()
    .required('L\'entreprise est requise'),
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
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return { role: '', companyId: null };
      
      const user = JSON.parse(userStr);
      return {
        role: user.role || '',
        companyId: user.companyId || null,
        token: user.token || null
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return { role: '', companyId: null };
    }
  }
  return { role: '', companyId: null };
};

export default function Zones() {
  const [zones, setZones] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ role: '', companyId: null });
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Récupérer l'utilisateur actuel seulement côté client
  useEffect(() => {
    // S'assurer que le code s'exécute uniquement côté client
    if (typeof window !== 'undefined') {
      const user = getCurrentUser();
      setCurrentUser(user);
      setIsInitialized(true);
      
      // Si l'utilisateur est un admin, définir l'entreprise sélectionnée à vide
      // Sinon, utiliser directement l'entreprise de l'utilisateur
      if (user.role !== 'admin' && user.companyId) {
        setSelectedEntrepriseId(user.companyId.toString());
      }
    }
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  // Récupérer les entreprises (uniquement pour les admins)
  useEffect(() => {
    if (isAdmin && isInitialized) {
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
  }, [isAdmin, isInitialized]);

  // Récupérer les zones
  const fetchZones = async (companyId) => {
    if (!companyId) {
      setZones([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/zone/${companyId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setZones(response.data.data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des zones:', error);
      toast.error('Erreur lors de la récupération des zones', {
        position: "top-right",
        autoClose: 5000
      });
      setZones([]);
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les zones lorsque l'entreprise sélectionnée change ou que currentUser est initialisé
  useEffect(() => {
    if (isInitialized) {
      if (isAdmin) {
        if (selectedEntrepriseId) {
          fetchZones(selectedEntrepriseId);
        } else {
          setZones([]);
          setLoading(false);
        }
      } else if (currentUser.companyId) {
        fetchZones(currentUser.companyId.toString());
      }
    }
  }, [selectedEntrepriseId, isAdmin, currentUser.companyId, isInitialized]);

  // Initialisation du formulaire
  const formik = useFormik({
    initialValues: {
      nom: '',
      id_company: isAdmin ? selectedEntrepriseId : currentUser.companyId ? currentUser.companyId.toString() : ''
    },
    validationSchema: zoneSchema,
    enableReinitialize: true, // Important pour mettre à jour les valeurs quand currentUser change
    onSubmit: async (values) => {
      try {
        // Assurez-vous que id_company est un nombre
        const submitData = {
          ...values,
          id_company: parseInt(values.id_company, 10)
        };

        if (isEditing) {
          await axios.put(`http://localhost:5000/api/zone/${selectedZone.id_zone}`, submitData, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          toast.success('Zone modifiée avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        } else {
          await axios.post('http://localhost:5000/api/zone', submitData, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          toast.success('Zone ajoutée avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        }
        
        const companyIdToFetch = isAdmin ? selectedEntrepriseId : currentUser.companyId.toString();
        fetchZones(companyIdToFetch);
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

  // Met à jour les valeurs du formulaire lorsque currentUser change
  useEffect(() => {
    if (isInitialized) {
      formik.setValues({
        ...formik.values,
        id_company: isAdmin ? selectedEntrepriseId : currentUser.companyId ? currentUser.companyId.toString() : ''
      });
    }
  }, [currentUser, isAdmin, selectedEntrepriseId, isInitialized]);

  const handleEdit = (zone) => {
    setSelectedZone(zone);
    formik.setValues({
      nom: zone.nom,
      id_company: zone.id_company.toString()
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (zone) => {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer la zone "${zone.nom}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:5000/api/zone/${zone.id_zone}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          
          const companyIdToFetch = isAdmin ? selectedEntrepriseId : currentUser.companyId.toString();
          fetchZones(companyIdToFetch);
          
          toast.success('Zone supprimée avec succès', {
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
    
    // Réinitialiser correctement le formulaire avec les valeurs par défaut
    formik.resetForm({
      values: {
        nom: '',
        id_company: isAdmin ? selectedEntrepriseId : currentUser.companyId ? currentUser.companyId.toString() : ''
      }
    });
    
    setSelectedZone(null);
  };

  const handleOpenModal = () => {
    // Pour les admins, vérifier si une entreprise est sélectionnée
    if (isAdmin && !selectedEntrepriseId) {
      toast.warning('Veuillez sélectionner une entreprise avant d\'ajouter une zone', {
        position: "top-right",
        autoClose: 5000
      });
      return;
    }
    
    // Réinitialiser correctement le formulaire avec les valeurs par défaut
    formik.resetForm({
      values: {
        nom: '',
        id_company: isAdmin ? selectedEntrepriseId : currentUser.companyId ? currentUser.companyId.toString() : ''
      }
    });
    
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const getEntrepriseName = (id) => {
    const entreprise = entreprises.find(ent => ent.id === parseInt(id));
    return entreprise ? entreprise.nom : 'Non défini';
  };

  // Afficher un écran de chargement si les données ne sont pas encore initialisées
  if (!isInitialized) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center h-screen">
          <p>Chargement...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Zones</h1>
          <button
            onClick={handleOpenModal}
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

        {/* Afficher un message si aucune entreprise n'est sélectionnée (admin uniquement) */}
        {isAdmin && !selectedEntrepriseId && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Veuillez sélectionner une entreprise pour voir ses zones.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tableau */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p>Chargement des zones...</p>
          </div>
        ) : (
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
                {zones.length > 0 ? (
                  zones.map((zone) => (
                    <tr key={zone.id_zone} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{zone.id_zone}</td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getEntrepriseName(zone.id_company)}</td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{zone.nom}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(zone)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(zone)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="px-6 py-4 text-center text-sm text-gray-500">
                      Aucune zone trouvée.
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
                    {isEditing ? "Modifier une zone" : "Ajouter une zone"}
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
                          {...formik.getFieldProps('id_company')}
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

                    {/* Afficher l'entreprise en lecture seule pour les utilisateurs simples */}
                    {!isAdmin && (
                      <input 
                        type="hidden" 
                        id="id_company" 
                        name="id_company" 
                        value={currentUser.companyId || ''} 
                      />
                    )}

                    {/* Nom de la zone */}
                    <div>
                      <label
                        htmlFor="nom"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nom de la zone
                      </label>
                      <input
                        type="text"
                        id="nom"
                        {...formik.getFieldProps('nom')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.nom && formik.errors.nom
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        placeholder="Saisir le nom de la zone"
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
                      disabled={formik.isSubmitting}
                    >
                      {formik.isSubmitting ? "En cours..." : (isEditing ? "Modifier" : "Ajouter")}
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