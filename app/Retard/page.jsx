'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog } from '@headlessui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { PencilIcon, ArrowDownTrayIcon, MagnifyingGlassIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/layouts/MainLayout';

// Schéma de validation pour la modification d'un retard
const retardSchema = Yup.object().shape({
  status: Yup.boolean()
    .default(false),
  motif: Yup.string()
    .when('status', {
      is: true,
      then: (schema) => schema.required('Le motif est requis lorsque le retard est justifié'),
      otherwise: (schema) => schema.notRequired(),
    }),
  document: Yup.string()
    .notRequired(),
});

// Schéma de validation pour le formulaire de recherche
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

export default function Retards() {
  const [retards, setRetards] = useState([]);
  const [filteredRetards, setFilteredRetards] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRetard, setSelectedRetard] = useState(null);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ role: '', companyId: '' });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Récupérer l'utilisateur actuel seulement côté client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = getCurrentUser();
      setCurrentUser(user);
      
      // Pour les utilisateurs non-admin, définir automatiquement l'entreprise sélectionnée
      if (user && user.role !== 'admin' && user.companyId) {
        setSelectedEntrepriseId(user.companyId);
        rechercheFormik.setFieldValue('entrepriseId', user.companyId);
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

  // Récupérer les retards en fonction de l'entreprise sélectionnée dans le filtre
  useEffect(() => {
    const fetchRetards = async () => {
      try {
        setLoading(true);
        const companyId = isAdmin ? selectedEntrepriseId : currentUser.companyId;
        if (companyId) {
          const response = await axios.get(`http://localhost:5000/api/retard/company/${companyId}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          setRetards(response.data.data);
          setFilteredRetards(response.data.data);
        } else {
          setRetards([]);
          setFilteredRetards([]);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des retards:', error);
        toast.error('Erreur lors de la récupération des retards', {
          position: "top-right",
          autoClose: 5000
        });
      } finally {
        setLoading(false);
      }
    };

    // Exécuter fetchRetards si companyId est disponible
    if (isAdmin ? selectedEntrepriseId : currentUser.companyId) {
      fetchRetards();
    }
  }, [selectedEntrepriseId, isAdmin, currentUser.companyId]);

  // Formulaire pour modifier un retard
  const formik = useFormik({
    initialValues: {
      status: false,
      motif: '',
      document: '',
    },
    validationSchema: retardSchema,
    onSubmit: async (values) => {
      try {
        const formData = new FormData();
        formData.append('status', values.status);
        formData.append('motif', values.status ? values.motif : '');
        
        if (formik.values.document && document.getElementById('file-upload').files.length > 0) {
          formData.append('file-upload', document.getElementById('file-upload').files[0]);
        }
        
        const response = await axios.put(
          `http://localhost:5000/api/retard/${selectedRetard.id_retard}`, 
          formData, 
          {
            headers: { 
              Authorization: `Bearer ${getAuthToken()}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        const companyId = isAdmin ? selectedEntrepriseId : currentUser.companyId;
        if (companyId) {
          const response = await axios.get(`http://localhost:5000/api/retard/company/${companyId}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          setRetards(response.data.data);
          setFilteredRetards(response.data.data);
        }

        toast.success('Retard modifié avec succès', {
          position: "top-right",
          autoClose: 5000
        });

        handleCloseModal();
      } catch (error) {
        console.error('Erreur lors de la modification du retard:', error);
        toast.error(`Erreur: ${error.response?.data?.message || 'Une erreur est survenue'}`, {
          position: "top-right",
          autoClose: 5000
        });
      }
    },
  });

  // Formulaire pour la recherche
  const rechercheFormik = useFormik({
    initialValues: {
      entrepriseId: '',
      employeId: '',
      dateDebut: '',
      dateFin: ''
    },
    validationSchema: rechercheSchema,
    onSubmit: (values) => {
      applyFilters(retards, values);
      toast.info('Recherche effectuée', {
        position: "top-right",
        autoClose: 3000
      });
    }
  });

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
        const response = await axios.post('http://localhost:5000/api/retard/export', payload, {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
          responseType: 'blob' // Important pour recevoir des fichiers binaires
        });
        
        // Créer un objet URL pour le blob reçu
        const url = window.URL.createObjectURL(new Blob([response.data]));
        
        // Créer un élément <a> temporaire pour déclencher le téléchargement
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'retards.pdf');
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
    }
  });

  // Récupérer les employés en fonction de l'entreprise sélectionnée (ou automatiquement pour un utilisateur non-admin)
  useEffect(() => {
    const fetchEmployes = async (companyId) => {
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

    // Pour les utilisateurs non-admin, charger leurs employés automatiquement
    if (!isAdmin && currentUser.companyId) {
      fetchEmployes(currentUser.companyId);
    } 
    // Pour les admins, charger les employés quand une entreprise est sélectionnée
    else if (isAdmin && rechercheFormik.values.entrepriseId) {
      fetchEmployes(rechercheFormik.values.entrepriseId);
    }
  }, [rechercheFormik.values.entrepriseId, isAdmin, currentUser.companyId]);

  // Appliquer les filtres de recherche
  const applyFilters = (retardList, filters = rechercheFormik.values) => {
    let filtered = [...retardList];
    
    if (filters.entrepriseId && isAdmin) {
      filtered = filtered.filter(retard => retard.id_company === parseInt(filters.entrepriseId));
    }
    
    if (filters.employeId) {
      filtered = filtered.filter(retard => retard.id_employe === parseInt(filters.employeId));
    }
    
    if (filters.dateDebut) {
      const dateDebut = new Date(filters.dateDebut);
      filtered = filtered.filter(retard => new Date(retard.date) >= dateDebut);
    }
    
    if (filters.dateFin) {
      const dateFin = new Date(filters.dateFin);
      filtered = filtered.filter(retard => new Date(retard.date) <= dateFin);
    }
    
    setFilteredRetards(filtered);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    rechercheFormik.resetForm();
    
    // Pour les utilisateurs non-admin, restaurer leur ID d'entreprise
    if (!isAdmin && currentUser.companyId) {
      rechercheFormik.setFieldValue('entrepriseId', currentUser.companyId);
    }
    
    setFilteredRetards(retards);
    toast.info('Filtres réinitialisés', {
      position: "top-right",
      autoClose: 3000
    });
  };

  // Ouvrir le modal pour modification
  const handleEdit = (retard) => {
    setSelectedRetard(retard);
    formik.setValues({
      status: Boolean(retard.status),
      motif: retard.motif || '',
      document: retard.document || ''
    });
    setIsModalOpen(true);
  };

  // Télécharger un document
  const handleDownload = (documentFilename) => {
    if (!documentFilename) return;
    
    axios({
      url: `http://localhost:5000/api/retard/document/${documentFilename}`,
      method: 'GET',
      responseType: 'blob',
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', documentFilename);
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        
        toast.success('Téléchargement démarré', {
          position: "top-right",
          autoClose: 3000
        });
      })
      .catch((error) => {
        console.error('Erreur lors du téléchargement:', error);
        toast.error('Erreur lors du téléchargement du document', {
          position: "top-right",
          autoClose: 5000
        });
      });
  };

  // Fermer le modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    formik.resetForm();
    setSelectedRetard(null);
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

  // Fonction pour formater la date en format local
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Gestion de l'upload de fichier (simulation)
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      formik.setFieldValue('document', file.name);
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Retards</h1>
          {/* Afficher le bouton d'export pour tous les utilisateurs si l'entreprise est sélectionnée ou disponible */}
          {(isAdmin ? selectedEntrepriseId : currentUser.companyId) && (
            <button
              onClick={handleOpenExportModal}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Exporter PDF
            </button>
          )}
        </div>

        {/* Formulaire de recherche */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Recherche de retards</h2>
          
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

              {/* Sélection d'employé - Actif pour les utilisateurs non-admin, ou pour les admins avec une entreprise sélectionnée */}
              <div>
                <label htmlFor="employeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Employé
                </label>
                <select
                  id="employeId"
                  {...rechercheFormik.getFieldProps('employeId')}
                  disabled={isAdmin && !rechercheFormik.values.entrepriseId}
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

        {/* Tableau des retards */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Département</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heure d'entrée</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motif</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    Chargement des données...
                  </td>
                </tr>
              ) : filteredRetards.length > 0 ? (
                filteredRetards.map((retard) => (
                  <tr key={retard.id_retard} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{retard.employe.nomcomplet}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{retard?.employe?.departement?.nom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{retard?.employe?.zone?.nom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(retard.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{retard.heureentree}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {retard.status ? 
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Justifié</span> : 
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Non justifié</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{retard.motif || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {retard.document ? (
                        <button
                          onClick={() => handleDownload(retard.document)}
                          className="text-blue-600 hover:text-blue-900 flex items-center justify-center"
                          title="Télécharger le document"
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(retard)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Modifier ce retard"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="no-data">
                  <td colSpan="9" className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    Aucun retard trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Modification de retard */}
        {isModalOpen && selectedRetard && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" aria-hidden="true" />

              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
                &#8203;
              </span>

              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Modifier le retard de {selectedRetard.employeNom}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={formik.handleSubmit} encType="multipart/form-data">
                  <div className="space-y-4">
                    {/* Informations générales */}
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-600"><span className="font-medium">Date:</span> {formatDate(selectedRetard.date)}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">Heure d'entrée:</span> {selectedRetard.heureentree}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">Département:</span> {selectedRetard.departement}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">Zone:</span> {selectedRetard.zone}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">Appareil:</span> {selectedRetard.appareil}</p>
                    </div>

                    {/* Statut (Toggle Switch) */}
                    <div className="mt-4">
                      <div className="flex items-center">
                        <label htmlFor="status" className="inline-flex relative items-center cursor-pointer">
                          <input
                            type="checkbox"
                            id="status"
                            checked={formik.values.status}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-700">Justifié ?</span>
                        </label>
                      </div>
                    </div>

                    {/* Motif (visible seulement si justifié) */}
                    {formik.values.status && (
                      <div>
                        <label
                          htmlFor="motif"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Motif <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="motif"
                          {...formik.getFieldProps('motif')}
                          placeholder="Saisissez le motif du retard"
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                            formik.touched.motif && formik.errors.motif
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                        />
                        {formik.touched.motif && formik.errors.motif && (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.motif}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Document (visible seulement si justifié) */}
                    {formik.values.status && (
                      <div>
                        <label
                          htmlFor="document"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Document justificatif (optionnel)
                        </label>
                        <div className="mt-1 flex items-center">
                          <input
                            type="text"
                            id="document"
                            name="document"
                            value={formik.values.document}
                            readOnly
                            placeholder="Aucun document sélectionné"
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                          />
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Parcourir
                          </label>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            onChange={handleFileChange}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Formats acceptés: PDF, JPG, PNG (max: 5MB)
                        </p>
                      </div>
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
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
                    >
                      Enregistrer
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
                    Exporter les retards
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