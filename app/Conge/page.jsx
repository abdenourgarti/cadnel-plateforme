'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog } from '@headlessui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, MagnifyingGlassIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/layouts/MainLayout';

// Schéma de validation pour la recherche
const rechercheSchema = Yup.object().shape({
  entrepriseId: Yup.number().nullable(),
  employeId: Yup.number().nullable(),
  dateDebut: Yup.date().nullable(),
  dateFin: Yup.date().nullable()
    .when('dateDebut', {
      is: (val) => val !== null,
      then: (schema) => schema.min(
        Yup.ref('dateDebut'),
        'La date de fin doit être postérieure à la date de début'
      )
    })
});

// Schéma de validation pour l'ajout/modification de congé
const congeSchema = Yup.object().shape({
  entrepriseId: Yup.number().nullable(),
  employeId: Yup.number().required('L\'employé est requis'),
  dateDebut: Yup.date().required('La date de début est requise'),
  dateFin: Yup.date()
    .required('La date de fin est requise')
    .min(Yup.ref('dateDebut'), 'La date de fin doit être postérieure à la date de début'),
});

// Schéma de validation pour l'exportation
const exportSchema = Yup.object().shape({
  entrepriseId: Yup.number()
    .when('isAdmin', {
      is: true,
      then: (schema) => schema.required('L\'entreprise est requise'),
      otherwise: (schema) => schema.notRequired(),
    }),
  dateDebut: Yup.date()
    .nullable()
    .test(
      'at-least-one-date',
      'Au moins une date doit être renseignée',
      function (value) {
        const { dateFin } = this.parent;
        return value !== null || dateFin !== null;
      }
    ),
  dateFin: Yup.date()
    .nullable()
    .test(
      'at-least-one-date',
      'Au moins une date doit être renseignée',
      function (value) {
        const { dateDebut } = this.parent;
        return value !== null || dateDebut !== null;
      }
    )
});

// Puis ajoutez cette ligne après la définition du schéma pour résoudre la dépendance cyclique
exportSchema.fields.dateDebut = exportSchema.fields.dateDebut.test(
  'date-order',
  'La date de début doit être antérieure à la date de fin',
  function(value) {
    const { dateFin } = this.parent;
    if (!value || !dateFin) return true; // Si l'une des dates est null, pas de validation
    return new Date(value) <= new Date(dateFin);
  }
);

exportSchema.fields.dateFin = exportSchema.fields.dateFin.test(
  'date-order',
  'La date de fin doit être postérieure à la date de début',
  function(value) {
    const { dateDebut } = this.parent;
    if (!value || !dateDebut) return true; // Si l'une des dates est null, pas de validation
    return new Date(value) >= new Date(dateDebut);
  }
);

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

export default function Conges() {
  const [conges, setConges] = useState([]);
  const [filteredConges, setFilteredConges] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConge, setSelectedConge] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ role: '', companyId: '' });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Récupérer l'utilisateur actuel seulement côté client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = getCurrentUser();
      setCurrentUser(user);
      
      // Pour les utilisateurs non-admin, définir automatiquement leur companyId
      if (user && user.role !== 'admin' && user.companyId) {
        setSelectedEntrepriseId(user.companyId);
        
        // Récupérer les employés de cette entreprise directement
        fetchEmployeesByCompany(user.companyId);
      }
    }
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  // Fonction pour récupérer les employés d'une entreprise
  const fetchEmployeesByCompany = async (companyId) => {
    try {
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
    }
  };

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

  // Récupérer les congés en fonction de l'entreprise
  useEffect(() => {
    const fetchConges = async () => {
      try {
        setLoading(true);
        const companyId = isAdmin ? selectedEntrepriseId : currentUser.companyId;
        if (companyId) {
          const response = await axios.get(`http://localhost:5000/api/conge/company/${companyId}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          setConges(response.data.data);
          setFilteredConges(response.data.data);
        } else {
          setConges([]);
          setFilteredConges([]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des congés:', error);
        toast.error('Erreur lors de la récupération des congés', {
          position: "top-right",
          autoClose: 5000
        });
      } finally {
        setLoading(false);
      }
    };

    if (selectedEntrepriseId || (!isAdmin && currentUser.companyId)) {
      fetchConges();
    }
  }, [selectedEntrepriseId, isAdmin, currentUser.companyId]);

  // Formulaire de recherche
  const rechercheFormik = useFormik({
    initialValues: {
      entrepriseId: '',
      employeId: '',
      dateDebut: '',
      dateFin: ''
    },
    validationSchema: rechercheSchema,
    onSubmit: (values) => {
      applyFilters(conges, values);
      toast.info('Recherche effectuée', {
        position: "top-right",
        autoClose: 3000
      });
    }
  });

  // Mettre à jour les employés quand une entreprise est sélectionnée dans le formulaire de recherche
  useEffect(() => {
    if (isAdmin && rechercheFormik.values.entrepriseId) {
      fetchEmployeesByCompany(rechercheFormik.values.entrepriseId);
    } else if (!isAdmin && currentUser.companyId && employes.length === 0) {
      // Pour les utilisateurs non-admin, charger les employés de leur entreprise
      fetchEmployeesByCompany(currentUser.companyId);
    }
  }, [rechercheFormik.values.entrepriseId, isAdmin, currentUser.companyId]);

  // Formulaire pour l'exportation
  const exportFormik = useFormik({
    initialValues: {
      entrepriseId: '',
      dateDebut: '',
      dateFin: ''
    },
    validationSchema: exportSchema,
    onSubmit: async (values) => {
      try {
        const payload = {
          id_company: isAdmin ? values.entrepriseId : currentUser.companyId,
          datedebut: values.dateDebut,
          datefin: values.dateFin
        };

        // Utiliser axios avec responseType 'blob' pour recevoir le fichier
        const response = await axios.post('http://localhost:5000/api/conge/export', payload, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
          responseType: 'blob' // Important pour recevoir des fichiers binaires
        });
        
        // Créer un objet URL pour le blob reçu
        const url = window.URL.createObjectURL(new Blob([response.data]));
        
        // Créer un élément <a> temporaire pour déclencher le téléchargement
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'conges.pdf');
        document.body.appendChild(link);
        link.click();
        
        // Nettoyer les ressources après le téléchargement
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);

        toast.success('Exportation réussie', {
          position: "top-right",
          autoClose: 5000
        });

        handleCloseExportModal();
      } catch (error) {
        console.error('Erreur lors de l\'exportation:', error);
        toast.error(`Erreur: ${error.response?.data?.message || 'Une erreur est survenue'}`, {
          position: "top-right",
          autoClose: 5000
        });
      }
    },
  });

  // Appliquer les filtres de recherche
  const applyFilters = (congeList, filters = rechercheFormik.values) => {
    let filtered = [...congeList];
    
    if (filters.entrepriseId) {
      filtered = filtered.filter(conge => conge.id_company === parseInt(filters.entrepriseId));
    }
    
    if (filters.employeId) {
      filtered = filtered.filter(conge => conge.id_employe === parseInt(filters.employeId));
    }
    
    if (filters.dateDebut) {
      const dateDebut = new Date(filters.dateDebut);
      filtered = filtered.filter(conge => new Date(conge.datedebut) >= dateDebut);
    }
    
    if (filters.dateFin) {
      const dateFin = new Date(filters.dateFin);
      filtered = filtered.filter(conge => new Date(conge.datefin) <= dateFin);
    }
    
    setFilteredConges(filtered);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    rechercheFormik.resetForm();
    setFilteredConges(conges);
    toast.info('Filtres réinitialisés', {
      position: "top-right",
      autoClose: 3000
    });
  };

  // Formulaire pour ajouter/modifier un congé
  const formik = useFormik({
    initialValues: {
      entrepriseId: '',
      employeId: '',
      dateDebut: '',
      dateFin: ''
    },
    validationSchema: congeSchema,
    onSubmit: async (values) => {
      try {       
        const selectedEmploye = employes.find(emp => emp.id_employe == values.employeId);
        const payload = {
          id_employe: values.employeId,
          id_company: isAdmin ? selectedEmploye.id_company : currentUser.companyId, // Utiliser l'entreprise de l'utilisateur pour les non-admin
          datedebut: values.dateDebut,
          datefin: values.dateFin
        };

        if (isEditing) {
          await axios.put(`http://localhost:5000/api/conge/${selectedConge.id_conge}`, payload, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          toast.success('Congé modifié avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        } else {
          await axios.post('http://localhost:5000/api/conge', payload, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          toast.success('Congé ajouté avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        }

        // Recharger les congés après l'ajout/modification
        const companyId = isAdmin ? selectedEntrepriseId : currentUser.companyId;
        if (companyId) {
          const response = await axios.get(`http://localhost:5000/api/conge/company/${companyId}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          setConges(response.data.data);
          setFilteredConges(response.data.data);
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

  // Ouvrir le modal pour ajouter/modifier un congé
  const handleAddOrEdit = (conge = null) => {
    setSelectedConge(conge);
    
    // Si on est en mode édition
    if (conge) {
      formik.setValues({
        entrepriseId: conge.id_company,
        employeId: conge.id_employe,
        dateDebut: conge.datedebut.split('T')[0], // Convertir la date au format YYYY-MM-DD
        dateFin: conge.datefin.split('T')[0] // Convertir la date au format YYYY-MM-DD
      });
      setIsEditing(true);
    } else {
      // En mode ajout, pour un utilisateur non-admin, définir l'entreprise automatiquement
      if (!isAdmin && currentUser.companyId) {
        formik.setValues({
          entrepriseId: currentUser.companyId,
          employeId: '',
          dateDebut: '',
          dateFin: ''
        });
      } else {
        formik.resetForm();
      }
      setIsEditing(false);
    }
    
    // Si l'utilisateur n'est pas admin, charger les employés de son entreprise
    if (!isAdmin && currentUser.companyId) {
      fetchEmployeesByCompany(currentUser.companyId);
    }
    
    setIsModalOpen(true);
  };

  // Supprimer un congé
  const handleDelete = (id) => {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Vous ne pourrez pas revenir en arrière!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:5000/api/conge/${id}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          const updatedConges = conges.filter(conge => conge.id_conge !== id);
          setConges(updatedConges);
          setFilteredConges(updatedConges);
          toast.success('Congé supprimé avec succès', {
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

  // Fermer le modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    formik.resetForm();
    setSelectedConge(null);
  };

  // Ouvrir le modal d'exportation
  const handleOpenExportModal = () => {
    setIsExportModalOpen(true);
  };

  // Fermer le modal d'exportation
  const handleCloseExportModal = () => {
    setIsExportModalOpen(false);
    exportFormik.resetForm();
  };

  // Fonction pour déterminer le statut du congé
  const getStatus = (dateDebut, dateFin) => {
    const today = new Date();
    const startDate = new Date(dateDebut);
    const endDate = new Date(dateFin);

    if (today < startDate) {
      return "à venir";
    } else if (today >= startDate && today <= endDate) {
      return "en cours";
    } else {
      return "terminé";
    }
  };

  // Fonction pour formater la date en format local
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Couleurs de fond pour les statuts
  const statusColors = {
    "à venir": "bg-blue-100 text-blue-800",
    "en cours": "bg-yellow-100 text-yellow-800",
    "terminé": "bg-green-100 text-green-800"
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Congés</h1>
          <div className="flex gap-2">
            <button
              onClick={() => handleAddOrEdit()}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Ajouter un congé
            </button>
            {/* Afficher le bouton d'export pour les utilisateurs non-admin ou si une entreprise est sélectionnée pour les admins */}
            {(!isAdmin || rechercheFormik.values.entrepriseId) && (
              <button
                onClick={handleOpenExportModal}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Exporter PDF
              </button>
            )}
          </div>
        </div>

        {/* Formulaire de recherche */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Recherche de congés</h2>
          
          <form onSubmit={rechercheFormik.handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Sélection d'entreprise (uniquement pour les admins) */}
              {isAdmin && (
                <div>
                  <label htmlFor="entrepriseId" className="block text-sm font-medium text-gray-700 mb-1">
                    Entreprise
                  </label>
                  <select
                    id="entrepriseId"
                    {...rechercheFormik.getFieldProps('entrepriseId')}
                    onChange={(e) => {
                      rechercheFormik.setFieldValue('entrepriseId', e.target.value);
                      setSelectedEntrepriseId(e.target.value);
                    }}
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
              )}

              {/* Sélection d'employé */}
              <div>
                <label htmlFor="employeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Employé
                </label>
                <select
                  id="employeId"
                  {...rechercheFormik.getFieldProps('employeId')}
                  disabled={isAdmin && !rechercheFormik.values.entrepriseId} // Désactivé uniquement si admin et pas d'entreprise sélectionnée
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Tous les employés</option>
                  {employes.map((employe) => (
                    <option key={employe.id_employe} value={employe.id_employe}>
                      {employe.nomcomplet}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Date de début */}
              <div>
                <label htmlFor="dateDebut" className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  id="dateDebut"
                  {...rechercheFormik.getFieldProps('dateDebut')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                />
                {rechercheFormik.touched.dateDebut && rechercheFormik.errors.dateDebut && (
                  <div className="mt-1 text-sm text-red-600">
                    {rechercheFormik.errors.dateDebut}
                  </div>
                )}
              </div>
              
              {/* Date de fin */}
              <div>
                <label htmlFor="dateFin" className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  id="dateFin"
                  {...rechercheFormik.getFieldProps('dateFin')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                />
                {rechercheFormik.touched.dateFin && rechercheFormik.errors.dateFin && (
                  <div className="mt-1 text-sm text-red-600">
                    {rechercheFormik.errors.dateFin}
                  </div>
                )}
              </div>
            </div>
            
            {/* Boutons de recherche */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Réinitialiser
              </button>
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                Rechercher
              </button>
            </div>
          </form>
        </div>

        {/* Tableau des congés */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date début</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date fin</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : filteredConges.length > 0 ? (
                filteredConges.map((conge) => (
                  <tr key={conge.id_conge} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{conge.employe.nomcomplet}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(conge.datedebut)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(conge.datefin)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[getStatus(conge.datedebut, conge.datefin)]}`}>
                        {getStatus(conge.datedebut, conge.datefin)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleAddOrEdit(conge)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                        title="Modifier ce congé"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(conge.id_conge)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer ce congé"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="no-data">
                  <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    Aucun congé trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Ajouter/Modifier un congé */}
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
                    {isEditing ? 'Modifier un congé' : 'Ajouter un congé'}
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
                    {/* Sélection d'entreprise (uniquement pour les admins) */}
                    {isAdmin && (
                      <div>
                        <label htmlFor="entrepriseId" className="block text-sm font-medium text-gray-700">
                          Entreprise <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="entrepriseId"
                          {...formik.getFieldProps('entrepriseId')}
                          onChange={(e) => {
                            formik.setFieldValue('entrepriseId', e.target.value);
                          }}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="">Sélectionnez une entreprise</option>
                          {entreprises.map((entreprise) => (
                            <option key={entreprise.id_company} value={entreprise.id_company}>
                              {entreprise.nom}
                            </option>
                          ))}
                        </select>
                        {formik.touched.entrepriseId && formik.errors.entrepriseId && (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.entrepriseId}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sélection d'employé */}
                    <div>
                      <label htmlFor="employeId" className="block text-sm font-medium text-gray-700">
                        Employé <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="employeId"
                        {...formik.getFieldProps('employeId')}
                        disabled={!formik.values.entrepriseId}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      >
                      {console.log('employes', employes)}
                        <option value="">Sélectionnez un employé</option>
                        {employes.map((employe) => (
                          <option key={employe.id_employe} value={employe.id_employe}>
                            {employe.nomcomplet}
                          </option>
                        ))}
                      </select>
                      {formik.touched.employeId && formik.errors.employeId && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.employeId}
                        </div>
                      )}
                    </div>

                    {/* Date de début */}
                    <div>
                      <label htmlFor="dateDebut" className="block text-sm font-medium text-gray-700">
                        Date de début <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="dateDebut"
                        {...formik.getFieldProps('dateDebut')}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      {formik.touched.dateDebut && formik.errors.dateDebut && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.dateDebut}
                        </div>
                      )}
                    </div>

                    {/* Date de fin */}
                    <div>
                      <label htmlFor="dateFin" className="block text-sm font-medium text-gray-700">
                        Date de fin <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="dateFin"
                        {...formik.getFieldProps('dateFin')}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      {formik.touched.dateFin && formik.errors.dateFin && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.dateFin}
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
                      {isEditing ? 'Modifier' : 'Ajouter'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'exportation */}
        {isExportModalOpen && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" aria-hidden="true" />

              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
                &#8203;
              </span>

              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Exporter les congés
                  </h3>
                  <button
                    onClick={handleCloseExportModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={exportFormik.handleSubmit}>
                  <div className="space-y-4">
                    {/* Sélection d'entreprise (uniquement pour les admins) */}
                    {isAdmin && (
                      <div>
                        <label htmlFor="entrepriseId" className="block text-sm font-medium text-gray-700 mb-1">
                          Entreprise
                        </label>
                        <select
                          id="entrepriseId"
                          {...exportFormik.getFieldProps('entrepriseId')}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="">Sélectionnez une entreprise</option>
                          {entreprises.map((entreprise) => (
                            <option key={entreprise.id_company} value={entreprise.id_company}>
                              {entreprise.nom}
                            </option>
                          ))}
                        </select>
                        {exportFormik.touched.entrepriseId && exportFormik.errors.entrepriseId && (
                          <div className="mt-1 text-sm text-red-600">
                            {exportFormik.errors.entrepriseId}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Date de début */}
                    <div>
                      <label htmlFor="dateDebut" className="block text-sm font-medium text-gray-700 mb-1">
                        Date de début
                      </label>
                      <input
                        type="date"
                        id="dateDebut"
                        {...exportFormik.getFieldProps('dateDebut')}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      {exportFormik.touched.dateDebut && exportFormik.errors.dateDebut && (
                        <div className="mt-1 text-sm text-red-600">
                          {exportFormik.errors.dateDebut}
                        </div>
                      )}
                    </div>

                    {/* Date de fin */}
                    <div>
                      <label htmlFor="dateFin" className="block text-sm font-medium text-gray-700 mb-1">
                        Date de fin
                      </label>
                      <input
                        type="date"
                        id="dateFin"
                        {...exportFormik.getFieldProps('dateFin')}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      {exportFormik.touched.dateFin && exportFormik.errors.dateFin && (
                        <div className="mt-1 text-sm text-red-600">
                          {exportFormik.errors.dateFin}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
                    >
                      Exporter
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