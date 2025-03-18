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

// Options pour le fuseau horaire
const timezoneOptions = [
  { id: 1, value: "Etc/GMT-12", label: "GMT-12:00" },
  { id: 2, value: "Etc/GMT-11", label: "GMT-11:00" },
  { id: 3, value: "Etc/GMT-10", label: "GMT-10:00" },
  { id: 4, value: "Etc/GMT-9", label: "GMT-09:00" },
  { id: 5, value: "Etc/GMT-8", label: "GMT-08:00" },
  { id: 6, value: "Etc/GMT-7", label: "GMT-07:00" },
  { id: 7, value: "Etc/GMT-6", label: "GMT-06:00" },
  { id: 8, value: "Etc/GMT-5", label: "GMT-05:00" },
  { id: 9, value: "Etc/GMT-4", label: "GMT-04:00" },
  { id: 10, value: "Etc/GMT-3", label: "GMT-03:00" },
  { id: 11, value: "Etc/GMT-2", label: "GMT-02:00" },
  { id: 12, value: "Etc/GMT-1", label: "GMT-01:00" },
  { id: 13, value: "Etc/GMT", label: "GMT±00:00" },
  { id: 14, value: "Etc/GMT+1", label: "GMT+01:00" },
  { id: 15, value: "Etc/GMT+2", label: "GMT+02:00" },
  { id: 16, value: "Etc/GMT+3", label: "GMT+03:00" },
  { id: 17, value: "Etc/GMT+4", label: "GMT+04:00" },
  { id: 18, value: "Etc/GMT+5", label: "GMT+05:00" },
  { id: 19, value: "Etc/GMT+6", label: "GMT+06:00" },
  { id: 20, value: "Etc/GMT+7", label: "GMT+07:00" },
  { id: 21, value: "Etc/GMT+8", label: "GMT+08:00" },
  { id: 22, value: "Etc/GMT+9", label: "GMT+09:00" },
  { id: 23, value: "Etc/GMT+10", label: "GMT+10:00" },
  { id: 24, value: "Etc/GMT+11", label: "GMT+11:00" },
  { id: 25, value: "Etc/GMT+12", label: "GMT+12:00" },
];

// Schéma de validation pour l'ajout/modification d'appareil
const appareilSchema = Yup.object().shape({
  nom: Yup.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne doit pas dépasser 50 caractères')
    .required('Le nom de l\'appareil est requis'),
  numeroserie: Yup.string()
    .required('Le numéro de série est requis'),
  addresseip: Yup.string()
    .matches(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})?$/, 'Adresse IP invalide'),
  id_zone: Yup.number()
    .required('La zone est requise'),
  modetransfert: Yup.string()
    .required('Le mode de transfert est requis'),
  fuseauhoraire: Yup.string()
    .required('Le fuseau horaire est requis'),
  battement: Yup.number()
    .min(1, 'La valeur doit être supérieure à 0')
    .required('L\'intervalle de battement de cœur est requis'),
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
    const user = JSON.parse(localStorage.getItem('user'));
    return user;
  }
  return { role: '', companyId: '' }; // Valeur par défaut
};

export default function Appareils() {
  const [allAppareils, setAllAppareils] = useState([]);
  const [appareils, setAppareils] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [zones, setZones] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppareil, setSelectedAppareil] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ role: '', companyId: '' });
  
  // Récupérer l'utilisateur actuel seulement côté client
  useEffect(() => {
    // S'assurer que le code s'exécute uniquement côté client
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
          setEntreprises(response.data.data.map(company => ({
            id_company: company.id_company,
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

  // Récupérer les zones
  const fetchZones = async (companyId) => {
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

  const fetchAllAppareils = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/appareil`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setAllAppareils(response.data.data);
      setAppareils(response.data.data); // Initialement, affichez tous les appareils
    } catch (error) {
      console.error('Erreur lors de la récupération des appareils:', error);
      toast.error('Erreur lors de la récupération des appareils', {
        position: "top-right",
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Pour les utilisateurs normaux, gardez le fetchAppareils d'origine
  const fetchCompanyAppareils = async (companyId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/appareil/${companyId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setAppareils(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des appareils:', error);
      toast.error('Erreur lors de la récupération des appareils', {
        position: "top-right",
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Modifiez le useEffect
  useEffect(() => {
    if (isAdmin) {
      fetchAllAppareils();
    } else {
      fetchCompanyAppareils(currentUser.companyId);
    }
  }, [isAdmin, currentUser.companyId]);

  useEffect(() => {
    if (isAdmin) {
      if (selectedEntrepriseId) {
        // Filtrer les appareils par entreprise
        const filteredAppareils = allAppareils.filter(
          appareil => appareil.id_company === parseInt(selectedEntrepriseId) || 
                      appareil.id_company === selectedEntrepriseId
        );
        setAppareils(filteredAppareils);
      } else {
        // Si aucune entreprise n'est sélectionnée, montrer tous les appareils
        setAppareils(allAppareils);
      }
    }
  }, [selectedEntrepriseId, allAppareils, isAdmin]);

  const formik = useFormik({
    initialValues: {
      nom: '',
      numeroserie: '',
      addresseip: '0.0.0.0',
      id_zone: '',
      modetransfert: 'Temps réel',
      fuseauhoraire: 'Etc/GMT+1',
      battement: 60,
      id_company: isAdmin ? '' : currentUser.companyId
    },
    validationSchema: appareilSchema,
    onSubmit: async (values) => {
      try {
        let updatedAppareil;
        
        if (isEditing) {
          // Modification d'un appareil existant
          const response = await axios.put(`http://localhost:5000/api/appareil/${selectedAppareil.id_appareil}`, values, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          updatedAppareil = response.data.data || { ...values, id_appareil: selectedAppareil.id_appareil };
          
          // Mettre à jour les listes localement
          if (isAdmin) {
            // Mettre à jour l'appareil dans allAppareils
            setAllAppareils(prev => prev.map(a => 
              a.id_appareil === selectedAppareil.id_appareil ? updatedAppareil : a
            ));
            
            // Mettre à jour appareils également
            setAppareils(prev => prev.map(a => 
              a.id_appareil === selectedAppareil.id_appareil ? updatedAppareil : a
            ));
          } else {
            // Pour les non-admin, actualiser depuis l'API
            fetchCompanyAppareils(currentUser.companyId);
          }
          
          toast.success('Appareil modifié avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        } else {
          // Ajout d'un nouvel appareil
          const response = await axios.post('http://localhost:5000/api/appareil', values, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          updatedAppareil = response.data.data || { ...values, id_appareil: Date.now() }; // Fallback ID si l'API ne le renvoie pas
          
          // Ajouter le nouvel appareil aux listes
          if (isAdmin) {
            // Ajouter à allAppareils
            setAllAppareils(prev => [...prev, updatedAppareil]);
            
            // Si on a un filtre actif, mettre à jour appareils seulement si l'appareil correspond
            if (!selectedEntrepriseId || selectedEntrepriseId === values.id_company.toString()) {
              setAppareils(prev => [...prev, updatedAppareil]);
            }
          } else {
            // Pour les non-admin, actualiser depuis l'API
            fetchCompanyAppareils(currentUser.companyId);
          }
          
          toast.success('Appareil ajouté avec succès', {
            position: "top-right",
            autoClose: 5000
          });
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

  // Récupérer les zones lorsque l'entreprise est sélectionnée dans le formulaire
  useEffect(() => {
    if (isAdmin && formik.values.id_company) {
      fetchZones(formik.values.id_company);
    }
  }, [formik.values.id_company, isAdmin]);

  const handleEdit = (appareil) => {
    setSelectedAppareil(appareil);
    formik.setValues({
      nom: appareil.nom,
      numeroserie: appareil.numeroserie,
      addresseip: appareil.addresseip,
      id_zone: appareil.id_zone,
      modetransfert: appareil.modetransfert,
      fuseauhoraire: appareil.fuseauhoraire,
      battement: appareil.battement,
      id_company: appareil.id_company
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (appareil) => {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer l'appareil "${appareil.nom}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:5000/api/appareil/${appareil.id_appareil}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          // Mise à jour des deux états après suppression
          if (isAdmin) {
            // Mettre à jour allAppareils en supprimant l'appareil
            setAllAppareils(prev => prev.filter(a => a.id_appareil !== appareil.id_appareil));
            
            // Mettre à jour appareils également
            setAppareils(prev => prev.filter(a => a.id_appareil !== appareil.id_appareil));
          } else {
            // Pour les non-admin, juste mettre à jour appareils
            fetchCompanyAppareils(currentUser.companyId);
          }
          toast.success('Appareil supprimé avec succès', {
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
    setSelectedAppareil(null);
  };

  const getEntrepriseName = (id) => {
    const entreprise = entreprises.find(ent => ent.id_company === id);
    return entreprise ? entreprise.nom : 'Non défini';
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Appareils</h1>
          <button
            onClick={() => setIsModalOpen(true)}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro de série</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom de l'appareil</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateurs</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Empreintes</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appareils.length > 0 ? (
                appareils.map((appareil) => (
                  <tr key={appareil.id_appareil} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appareil.numeroserie}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appareil.nom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appareil.id_zone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appareil.addresseip}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{appareil.usersCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{appareil.fingerprintsCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{appareil.transactionsCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(appareil)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(appareil)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="no-data">
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucun appareil trouvé.
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

              <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {isEditing ? "Modifier un appareil" : "Ajouter un appareil"}
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
                            <option key={entreprise.id_company} value={entreprise.id_company}>
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

                    {/* Nom de l'appareil */}
                    <div>
                      <label
                        htmlFor="nom"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nom de l'appareil *
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
                        placeholder="Saisir le nom de l'appareil"
                      />
                      {formik.touched.nom && formik.errors.nom && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.nom}
                        </div>
                      )}
                    </div>

                    {/* Numéro de série */}
                    <div>
                      <label
                        htmlFor="numeroserie"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Numéro de série *
                      </label>
                      <input
                        type="text"
                        id="numeroserie"
                        {...formik.getFieldProps('numeroserie')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.numeroserie && formik.errors.numeroserie
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        placeholder="Saisir le numéro de série"
                      />
                      {formik.touched.numeroserie && formik.errors.numeroserie && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.numeroserie}
                        </div>
                      )}
                    </div>

                    {/* Adresse IP */}
                    <div>
                      <label
                        htmlFor="addresseip"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Adresse IP
                      </label>
                      <input
                        type="text"
                        id="addresseip"
                        {...formik.getFieldProps('addresseip')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.addresseip && formik.errors.addresseip
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        placeholder="0.0.0.0"
                      />
                      {formik.touched.addresseip && formik.errors.addresseip && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.addresseip}
                        </div>
                      )}
                    </div>

                    {/* Zone (liste déroulante) */}
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
                      >
                        <option value="">Sélectionner une zone</option>
                        {zones.map((zone) => (
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

                    {/* Mode de transfert (liste déroulante) */}
                    <div>
                      <label
                        htmlFor="modetransfert"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Mode de transfert *
                      </label>
                      <select
                        id="modetransfert"
                        {...formik.getFieldProps('modetransfert')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.modetransfert && formik.errors.modetransfert
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="Temps réel">Temps réel</option>
                        <option value="Trimming">Trimming</option>
                      </select>
                      {formik.touched.modetransfert && formik.errors.modetransfert && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.modetransfert}
                        </div>
                      )}
                    </div>

                    {/* Fuseau horaire (liste déroulante) */}
                    <div>
                      <label
                        htmlFor="fuseauhoraire"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Fuseau horaire *
                      </label>
                      <select
                        id="fuseauhoraire"
                        {...formik.getFieldProps('fuseauhoraire')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.fuseauhoraire && formik.errors.fuseauhoraire
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                      >
                        {timezoneOptions.map((option) => (
                          <option key={option.id} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {formik.touched.fuseauhoraire && formik.errors.fuseauhoraire && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.fuseauhoraire}
                        </div>
                      )}
                    </div>

                    {/* Intervalle de battement de cœur */}
                    <div>
                      <label
                        htmlFor="battement"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Intervalle de battement de cœur (secondes) *
                      </label>
                      <input
                        type="number"
                        id="battement"
                        {...formik.getFieldProps('battement')}
                        min="1"
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.battement && formik.errors.battement
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                      />
                      {formik.touched.battement && formik.errors.battement && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.battement}
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