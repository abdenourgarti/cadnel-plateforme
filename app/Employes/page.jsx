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

// Schéma de validation pour l'ajout/modification d'employé
const employeSchema = Yup.object().shape({
  nomcomplet: Yup.string()
    .min(2, 'Le nom complet doit contenir au moins 2 caractères')
    .max(100, 'Le nom complet ne doit pas dépasser 100 caractères')
    .required('Le nom complet est requis'),
  id_departement: Yup.number()
    .required('Le département est requis'),
  id_poste: Yup.number()
    .required('Le poste est requis'),
  id_zone: Yup.number()
    .required('La zone est requise'),
  id_company: Yup.number()
    .required('L\'entreprise est requise'),
  id_planning: Yup.number()
    .required('Le planning est requis'),
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
  return { role: '', companyId: '' }; // Valeur par défaut
};

export default function Employes() {
  const [employes, setEmployes] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [plannings, setPlannings] = useState([]);
  const [postes, setPostes] = useState([]);
  const [zones, setZones] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmploye, setSelectedEmploye] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ role: '', companyId: '' });
  
  // Stockage local de tous les départements, postes et zones pour filtrage
  const [allDepartements, setAllDepartements] = useState([]);
  const [allPlannings, setAllPlannings] = useState([]);
  const [allPostes, setAllPostes] = useState([]);
  const [allZones, setAllZones] = useState([]);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = getCurrentUser();
      setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchEntreprises();
      fetchAllDepartements();
      fetchAllPlannings();
      fetchAllPostes();
      fetchAllZones();
    } else {
      fetchEmployes(currentUser.companyId);
      fetchDepartements(currentUser.companyId);
      fetchPlannings(currentUser.companyId);
      fetchPostes(currentUser.companyId);
      fetchZones(currentUser.companyId);
    }
  }, [isAdmin, currentUser.companyId]);

  // Récupérer tous les départements, postes et zones (pour l'admin)
  const fetchAllDepartements = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/departement', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setAllDepartements(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des départements:', error);
      toast.error('Erreur lors de la récupération des départements', {
        position: "top-right",
        autoClose: 5000
      });
    }
  };

  const fetchAllPlannings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/planning', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setAllPlannings(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des plannings:', error);
      toast.error('Erreur lors de la récupération des plannings', {
        position: "top-right",
        autoClose: 5000
      });
    }
  };

  const fetchAllPostes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/poste', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setAllPostes(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des postes:', error);
      toast.error('Erreur lors de la récupération des postes', {
        position: "top-right",
        autoClose: 5000
      });
    }
  };

  const fetchAllZones = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/zone', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setAllZones(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des zones:', error);
      toast.error('Erreur lors de la récupération des zones', {
        position: "top-right",
        autoClose: 5000
      });
    }
  };

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

  const fetchEmployes = async (companyId) => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/employe/${companyId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setEmployes(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des employés:', error);
      toast.error('Erreur lors de la récupération des employés', {
        position: "top-right",
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartements = async (companyId) => {
    if (!companyId) return;
    
    try {
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
    }
  };

  const fetchPlannings = async (companyId) => {
    if (!companyId) return;
    
    try {
      const response = await axios.get(`http://localhost:5000/api/planning/${companyId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setPlannings(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des plannings:', error);
      toast.error('Erreur lors de la récupération des plannings', {
        position: "top-right",
        autoClose: 5000
      });
    }
  };

  const fetchPostes = async (companyId) => {
    if (!companyId) return;
    
    try {
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
    }
  };

  const fetchZones = async (companyId) => {
    if (!companyId) return;
    
    try {
      const response = await axios.get(`http://localhost:5000/api/zone/${companyId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setZones(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des zones:', error);
      toast.error('Erreur lors de la récupération des zones', {
        position: "top-right",
        autoClose: 5000
      });
    }
  };

  // Formik setup avec des valeurs initiales correctes
  const formik = useFormik({
    initialValues: {
      nomcomplet: '',
      id_departement: '',
      id_poste: '',
      id_zone: '',
      id_planning: '',
      id_company: isAdmin ? '' : currentUser.companyId,
      datedebutrotation: null,
    },
    validationSchema: employeSchema,
    onSubmit: async (values) => {
      try {
        // Convertir les chaînes en nombres pour l'API
        const formattedValues = {
          ...values,
          id_departement: Number(values.id_departement),
          id_poste: Number(values.id_poste),
          id_zone: Number(values.id_zone),
          id_planning: Number(values.id_planning),
          id_company: Number(values.id_company),
          datedebutrotation: values.datedebutrotation || null
        };
        
        console.log('paramètres:', formattedValues);
        
        if (isEditing) {
          await axios.put(`http://localhost:5000/api/employe/${selectedEmploye.id_employe}`, formattedValues, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          toast.success('Employé modifié avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        } else {
          await axios.post('http://localhost:5000/api/employe', formattedValues, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          toast.success('Employé ajouté avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        }
        
        // Utiliser la bonne id_company pour rafraîchir la liste
        const companyIdToFetch = isAdmin ? formattedValues.id_company : currentUser.companyId;
        fetchEmployes(companyIdToFetch);
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

  // Filtrage des options en fonction de l'entreprise sélectionnée dans le formulaire
  const getFilteredDepartements = () => {
    if (!isAdmin) return departements;
    
    const companyId = formik.values.id_company;
    if (!companyId) return [];
    
    return allDepartements.filter(dept => dept.id_company === parseInt(companyId));
  };

  const getFilteredPlannings = () => {
    if (!isAdmin) return plannings;
    
    const companyId = formik.values.id_company;
    if (!companyId) return [];
    
    return allPlannings.filter(plan => plan.id_company === parseInt(companyId));
  };

  const getFilteredPostes = () => {
    if (!isAdmin) return postes;
    
    const companyId = formik.values.id_company;
    if (!companyId) return [];
    
    return allPostes.filter(poste => poste.id_company === parseInt(companyId));
  };

  const getFilteredZones = () => {
    if (!isAdmin) return zones;
    
    const companyId = formik.values.id_company;
    if (!companyId) return [];
    
    return allZones.filter(zone => zone.id_company === parseInt(companyId));
  };

  // Réinitialiser les valeurs du formulaire lorsque l'entreprise change
  useEffect(() => {
    if (isAdmin && formik.values.id_company) {
      formik.setFieldValue('id_departement', '');
      formik.setFieldValue('id_planning', '');
      formik.setFieldValue('id_poste', '');
      formik.setFieldValue('id_zone', '');
      
      // Charger les données spécifiques à cette entreprise pour l'admin
      fetchDepartements(formik.values.id_company);
      fetchPlannings(formik.values.id_company);
      fetchPostes(formik.values.id_company);
      fetchZones(formik.values.id_company);
    }
  }, [formik.values.id_company, isAdmin]);

  const handleEdit = (employe) => {
    setSelectedEmploye(employe);
    
    // Pour l'édition, s'assurer que les données de référence sont chargées
    if (isAdmin) {
      fetchDepartements(employe.id_company);
      fetchPlannings(employe.id_company);
      fetchPostes(employe.id_company);
      fetchZones(employe.id_company);
    }
    
    // Utiliser setTimeout pour s'assurer que les données sont chargées avant de définir les valeurs
    setTimeout(() => {
      formik.setValues({
        nomcomplet: employe.nomcomplet,
        id_departement: employe.id_departement.toString(),
        id_poste: employe.id_poste.toString(),
        id_zone: employe.id_zone.toString(),
        id_planning: employe.id_planning.toString(),
        id_company: employe.id_company.toString()
      });
      setIsEditing(true);
      setIsModalOpen(true);
    }, 500);
  };

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedEmploye(null);
    formik.resetForm();
    
    // Définir la valeur de l'entreprise pour les utilisateurs non-admin
    if (!isAdmin) {
      formik.setFieldValue('id_company', currentUser.companyId.toString());
    }
    
    setIsModalOpen(true);
  };

  const handleDelete = (employe) => {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer l'employé "${employe.nomcomplet}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:5000/api/employe/${employe.id_employe}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          fetchEmployes(employe.id_company);
          toast.success('Employé supprimé avec succès', {
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
    setSelectedEmploye(null);
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Employés</h1>
          <button
            onClick={handleAdd}
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
              onChange={(e) => {
                const companyId = e.target.value;
                setSelectedEntrepriseId(companyId);
                if (companyId) {
                  fetchEmployes(companyId);
                  fetchDepartements(companyId);
                  fetchPlannings(companyId);
                  fetchPostes(companyId);
                  fetchZones(companyId);
                } else {
                  setEmployes([]);
                }
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Sélectionner une entreprise</option>
              {entreprises.map((entreprise) => (
                <option key={entreprise.id_company} value={entreprise.id_company}>
                  {entreprise.nom}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom complet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Département</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poste</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planning</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Empreinte</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr key="loading-data">
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Chargement...</td>
                </tr>
              ) : isAdmin && !selectedEntrepriseId ? (
                <tr key="choose-data">
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Veuillez sélectionner une entreprise</td>
                </tr>
              ) : employes.length === 0 ? (
                <tr key="no-data">
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Aucun employé trouvé</td>
                </tr>
              ) : (
                employes.map((employe) => {
                  // Trouver les noms pour l'affichage
                  const departementName = departements.find(d => d.id_departement === employe.id_departement)?.nom || 
                                        allDepartements.find(d => d.id_departement === employe.id_departement)?.nom || 
                                        employe.id_departement;
                  
                  const planningName = plannings.find(p => p.id_planning === employe.id_planning)?.nom || 
                                     allPlannings.find(p => p.id_planning === employe.id_planning)?.nom || 
                                     employe.id_planning;
                  
                  const posteName = postes.find(p => p.id_poste === employe.id_poste)?.nom || 
                                  allPostes.find(p => p.id_poste === employe.id_poste)?.nom || 
                                  employe.id_poste;
                  
                  const zoneName = zones.find(z => z.id_zone === employe.id_zone)?.nom || 
                                 allZones.find(z => z.id_zone === employe.id_zone)?.nom || 
                                 employe.id_zone;
                  
                  return (
                    <tr key={employe.id_employe} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employe.nomcomplet}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{departementName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{posteName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{zoneName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{planningName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {employe.empreinte ? 
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Oui</span> : 
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Non</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(employe)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(employe)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
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

              <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {isEditing ? "Modifier un employé" : "Ajouter un employé"}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={formik.handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Entreprise (uniquement pour les admins) */}
                    {isAdmin && (
                      <div>
                        <label
                          htmlFor="id_company"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Entreprise *
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
                            <option key={entreprise.id_company} value={entreprise.id_company.toString()}>
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

                    {/* Nom complet */}
                    <div>
                      <label
                        htmlFor="nomcomplet"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        id="nomcomplet"
                        {...formik.getFieldProps('nomcomplet')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.nomcomplet && formik.errors.nomcomplet
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        placeholder="Saisir le nom complet"
                      />
                      {formik.touched.nomcomplet && formik.errors.nomcomplet && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.nomcomplet}
                        </div>
                      )}
                    </div>

                    {/* Département */}
                    <div>
                      <label
                        htmlFor="id_departement"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Département *
                      </label>
                      <select
                        id="id_departement"
                        {...formik.getFieldProps('id_departement')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.id_departement && formik.errors.id_departement
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        disabled={isAdmin && !formik.values.id_company}
                      >
                        <option value="">Sélectionner un département</option>
                        {getFilteredDepartements().map((departement) => (
                          <option key={departement.id_departement} value={departement.id_departement.toString()}>
                            {departement.nom}
                          </option>
                        ))}
                      </select>
                      {formik.touched.id_departement && formik.errors.id_departement && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.id_departement}
                        </div>
                      )}
                    </div>

                    {/* Poste */}
                    <div>
                      <label
                        htmlFor="id_poste"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Poste *
                      </label>
                      <select
                        id="id_poste"
                        {...formik.getFieldProps('id_poste')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.id_poste && formik.errors.id_poste
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        disabled={isAdmin && !formik.values.id_company}
                      >
                        <option value="">Sélectionner un poste</option>
                        {getFilteredPostes().map((poste) => (
                          <option key={poste.id_poste} value={poste.id_poste}>
                            {poste.nom}
                          </option>
                        ))}
                      </select>
                      {formik.touched.id_poste && formik.errors.id_poste && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.id_poste}
                        </div>
                      )}
                    </div>

                    {/* Zone */}
                    <div>
                      <label
                        htmlFor="id_zone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Zone *
                      </label>
                      <select
                        id="id_zone"
                        {...formik.getFieldProps('id_zone')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.id_zone && formik.errors.id_zone
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        disabled={isAdmin && !formik.values.id_company}
                      >
                        <option value="">Sélectionner une zone</option>
                        {getFilteredZones().map((zone) => (
                          <option key={zone.id_zone} value={zone.id_zone}>
                            {zone.nom}
                          </option>
                        ))}
                      </select>
                      {formik.touched.id_zone && formik.errors.id_zone && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.id_zone}
                        </div>
                      )}
                    </div>

                    {/* Planning */}
                    <div>
                      <label
                        htmlFor="id_zone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Planning *
                      </label>
                      <select
                        id="id_planning"
                        {...formik.getFieldProps('id_planning')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.id_zone && formik.errors.id_zone
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        disabled={isAdmin && !formik.values.id_company}
                      >
                        <option value="">Sélectionner un planning</option>
                        {getFilteredPlannings().map((planning) => (
                          <option key={planning.id_planning} value={planning.id_planning}>
                            {planning.nom}
                          </option>
                        ))}
                      </select>
                      {formik.touched.id_planning && formik.errors.id_planning && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.id_planning}
                        </div>
                      )}
                    </div>

                    {/* Empreinte (toggle switch) 
                    <div className="mt-4">
                      <div className="flex items-center">
                        <label htmlFor="empreinte" className="inline-flex relative items-center cursor-pointer">
                          <input
                            type="checkbox"
                            id="empreinte"
                            checked={formik.values.empreinte}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-700">Empreinte digitale enregistrée</span>
                        </label>
                      </div>
                      {formik.touched.empreinte && formik.errors.empreinte && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.empreinte}
                        </div>
                      )}
                    </div>
                    */}
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
                      disabled={isAdmin && !formik.values.id_company}
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