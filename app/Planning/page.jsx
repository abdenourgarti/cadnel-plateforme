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
import { Switch } from '@headlessui/react';

// Schéma de validation pour le planning Standard
const planningStandardSchema = Yup.object().shape({
  nom: Yup.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne doit pas dépasser 100 caractères')
    .required('Le nom du planning est requis'),
  type: Yup.string()
    .required('Le type de planning est requis'),
  jours: Yup.array()
    .of(
      Yup.object().shape({
        nombrejour: Yup.number().required(),
        heuredebut: Yup.string()
          .test('required-if-working-day', 'L\'heure de début est requise', function (value) {
            const { estJourTravail } = this.parent;
            return !estJourTravail || (estJourTravail && value);
          }),
        heurefin: Yup.string()
          .test('required-if-working-day', 'L\'heure de fin est requise', function (value) {
            const { estJourTravail } = this.parent;
            return !estJourTravail || (estJourTravail && value);
          }),
        isnext: Yup.boolean(),
        estJourTravail: Yup.boolean(),
      })
    )
    .test('at-least-one-day', 'Au moins un jour doit être coché', (jours) => {
      return jours.some((jour) => jour.estJourTravail);
    }),
});

// Schéma de validation pour le planning Rotation
const planningRotationSchema = Yup.object().shape({
  nom: Yup.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne doit pas dépasser 100 caractères')
    .required('Le nom du planning est requis'),
  type: Yup.string()
    .required('Le type de planning est requis'),
  heuretravail: Yup.number()
    .required('La durée de travail est requise')
    .positive('La durée doit être positive')
    .integer('La durée doit être un nombre entier'),
  heurerepos: Yup.number()
    .required('La durée de repos est requise')
    .positive('La durée doit être positive')
    .integer('La durée doit être un nombre entier'),
  heurereprise: Yup.string()
    .required('L\'heure de reprise est requise'),
  debutrotation: Yup.string()
    .required('La date de début de rotation est requise'),
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

export default function Plannings() {
  const [plannings, setPlannings] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanning, setSelectedPlanning] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ role: '', companyId: '' });
  const [joursLocaux, setJoursLocaux] = useState([]);

  // Correction ici: on définit isAdmin en fonction de currentUser.role
  const isAdmin = currentUser?.role === 'admin';

  // Premier useEffect qui récupère l'utilisateur et charge les données appropriées
  useEffect(() => {
    // Récupérer l'utilisateur actuel depuis localStorage
    if (typeof window !== 'undefined') {
      const user = getCurrentUser();
      setCurrentUser(user);
      
      // Charger les plannings ou les entreprises en fonction du rôle de l'utilisateur
      if (user?.role === 'admin') {
        fetchEntreprises();
      } else if (user?.companyId) {
        fetchPlannings(user.companyId);
      }
    }
  }, []); // Dépendance vide pour s'exécuter une seule fois au montage

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

  const fetchPlannings = async (companyId) => {
    if (!companyId) return; // Ne pas faire l'appel si companyId est vide
    
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Définition des valeurs initiales du formulaire
  const getInitialValues = () => ({
    nom: '',
    type: 'Standard', // Valeur par défaut
    jours: Array.from({ length: 7 }, (_, i) => ({
      nombrejour: i + 1,
      heuredebut: '',
      heurefin: '',
      isnext: false,
      estJourTravail: false,
    })),
    heuretravail: 24,
    heurerepos: 48,
    heurereprise: '07:00',
    debutrotation: new Date().toISOString().split('T')[0], // Ajout du champ debutrotation avec la date du jour
    id_company: isAdmin ? '' : currentUser.companyId,
  });

  const formik = useFormik({
    initialValues: getInitialValues(),
    validationSchema: () => {
      return formik.values.type === 'Standard' 
        ? planningStandardSchema 
        : planningRotationSchema;
    },
    onSubmit: async (values) => {
      try {
        const payload = {
          nom: values.nom,
          type: values.type,
          id_company: isAdmin ? values.id_company : currentUser.companyId,
        };

        if (values.type === 'Standard') {
          payload.jours = joursLocaux
            .filter((jour) => jour.estJourTravail)
            .map((jour) => ({
              nombrejour: jour.nombrejour,
              heuredebut: jour.heuredebut,
              heurefin: jour.heurefin,
              isnext: jour.isnext,
            }));
        } else {
          payload.heuretravail = values.heuretravail;
          payload.heurerepos = values.heurerepos;
          payload.heurereprise = values.heurereprise;
          payload.debutrotation = values.debutrotation; // Ajout du champ debutrotation
        }

        console.log('payload', payload);
        
        if (isEditing) {
          await axios.put(`http://localhost:5000/api/planning/${selectedPlanning.id_planning}`, payload, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          toast.success('Planning modifié avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        } else {
          await axios.post('http://localhost:5000/api/planning', payload, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          toast.success('Planning ajouté avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        }

        const companyId = isAdmin ? payload.id_company : currentUser.companyId;
        fetchPlannings(companyId);
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

  // Réinitialiser les jours locaux quand le modal s'ouvre ou le type change
  useEffect(() => {
    if (isModalOpen) {
      // Si nous éditons, les jours seront déjà définis
      if (!isEditing || formik.values.type !== 'Standard') {
        resetJoursLocaux();
      }
    }
  }, [isModalOpen, formik.values.type]);

  // Fonction pour réinitialiser les jours locaux
  const resetJoursLocaux = () => {
    if (formik.values.type === 'Standard') {
      setJoursLocaux(
        Array.from({ length: 7 }, (_, i) => ({
          nombrejour: i + 1,
          heuredebut: '',
          heurefin: '',
          isnext: false,
          estJourTravail: false,
        }))
      );
    } else {
      setJoursLocaux([]);
    }
  };

  useEffect(() => {
    if (formik.values.type === 'Standard') {
      if (!isEditing) {
        formik.setValues({
          ...formik.values,
          jours: Array.from({ length: 7 }, (_, i) => ({
            nombrejour: i + 1,
            heuredebut: '',
            heurefin: '',
            isnext: false,
            estJourTravail: false,
          })),
        });
        resetJoursLocaux();
      }
    } else {
      formik.setValues({
        ...formik.values,
        jours: [],
      });
      setJoursLocaux([]);
    }
  }, [formik.values.type]);

  const handleEdit = (planning) => {
    setSelectedPlanning(planning);
    
    // Préparation des valeurs initiales
    const initialValues = {
      nom: planning.nom,
      type: planning.type.charAt(0).toUpperCase() + planning.type.slice(1), // Première lettre en majuscule
      id_company: planning.id_company,
    };

    if (planning.type.toLowerCase() === 'standard') {
      // Créer un tableau avec les 7 jours
      const standardJours = Array.from({ length: 7 }, (_, i) => {
        const jour = planning.jours?.find((j) => parseInt(j.nombrejour) === i + 1);
        // Si le jour existe dans les données, il est travaillé
        return {
          nombrejour: i + 1,
          heuredebut: jour ? jour.heuredebut : '',
          heurefin: jour ? jour.heurefin : '',
          isnext: jour ? jour.isnext : false,
          estJourTravail: !!jour, // true si le jour existe
        };
      });
      
      initialValues.jours = standardJours;
      setJoursLocaux(standardJours);
    } else {
      // Pour les plannings de type rotation
      const jourtravailrotation = planning.jours && planning.jours[0] ? planning.jours[0] : {};
      
      initialValues.heuretravail = jourtravailrotation.heuretravail || 24;
      initialValues.heurerepos = jourtravailrotation.heurerepos || 48;
      initialValues.heurereprise = jourtravailrotation.heurereprise || '07:00';
      initialValues.debutrotation = jourtravailrotation.debutrotation || new Date().toISOString().split('T')[0];
    }

    formik.setValues(initialValues);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (planning) => {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer le planning "${planning.nom}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:5000/api/planning/${planning.id_planning}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          fetchPlannings(planning.id_company);
          toast.success('Planning supprimé avec succès', {
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
    setJoursLocaux([]);
    setSelectedPlanning(null);
  };

  const handleJourTravailChange = (index, checked) => {
    const updatedJours = [...joursLocaux];
    updatedJours[index].estJourTravail = checked;
    setJoursLocaux(updatedJours);
    formik.setFieldValue(`jours[${index}]`, updatedJours[index]);
  };

  const handleHeureChange = (index, field, value) => {
    const updatedJours = [...joursLocaux];
    updatedJours[index][field] = value;
    setJoursLocaux(updatedJours);
    formik.setFieldValue(`jours[${index}]`, updatedJours[index]);
  };

  const handleJourSuivantChange = (index, checked) => {
    const updatedJours = [...joursLocaux];
    updatedJours[index].isnext = checked;
    setJoursLocaux(updatedJours);
    formik.setFieldValue(`jours[${index}]`, updatedJours[index]);
  };

  const getEntrepriseName = (id) => {
    const entreprise = entreprises.find((ent) => ent.id_company === id);
    return entreprise ? entreprise.nom : 'Non défini';
  };

  // Fonction pour formater l'affichage de la rotation
  const formatRotation = (planning) => {
    if (planning.type.toLowerCase() !== 'rotation' || !planning.jours || planning.jours.length === 0) {
      return '-';
    }
    
    const rotation = planning.jours[0];
    return `${rotation.heuretravail || '-'}h / ${rotation.heurerepos || '-'}h`;
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Plannings</h1>
          <button
            onClick={() => {
              formik.resetForm();
              resetJoursLocaux();
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
              onChange={(e) => {
                setSelectedEntrepriseId(e.target.value);
                fetchPlannings(e.target.value);
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
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entreprise
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du planning</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jours de travail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rotation</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td 
                    colSpan={isAdmin ? 6 : 5} 
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Chargement...
                  </td>
                </tr>
              ) : plannings.length === 0 ? (
                <tr>
                  <td 
                    colSpan={isAdmin ? 6 : 5} 
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Aucun planning trouvé
                  </td>
                </tr>
              ) : (
                plannings.map((planning) => (
                  <tr key={planning.id_planning} className="hover:bg-gray-50">
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getEntrepriseName(planning.id_company)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{planning.nom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {planning.type.charAt(0).toUpperCase() + planning.type.slice(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {planning.type.toLowerCase() === 'standard' ? (planning.jours?.length || 0) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatRotation(planning)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(planning)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(planning)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
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
                    {isEditing ? "Modifier un planning" : "Ajouter un planning"}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={formik.handleSubmit}>
                  {/* Entreprise (uniquement pour les admins) */}
                  {isAdmin && (
                    <div className="mb-4">
                      <label
                        htmlFor="id_company"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Entreprise
                      </label>
                      <select
                        id="id_company"
                        {...formik.getFieldProps('id_company')}
                        disabled={isEditing}
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

                  {/* Nom et Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label
                        htmlFor="nom"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nom du planning *
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
                        placeholder="Saisir le nom du planning"
                      />
                      {formik.touched.nom && formik.errors.nom && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.nom}
                        </div>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="type"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Type de planning *
                      </label>
                      <select
                        id="type"
                        {...formik.getFieldProps('type')}
                        disabled={isEditing}
                        onChange={(e) => {
                          formik.handleChange(e);
                          // Réinitialiser les jours locaux lors du changement de type
                          if (e.target.value === 'Standard') {
                            resetJoursLocaux();
                          }
                        }}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.type && formik.errors.type
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="Standard">Standard</option>
                        <option value="Rotation">Rotation</option>
                      </select>
                      {formik.touched.type && formik.errors.type && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.type}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Champs spécifiques au type de planning */}
                  {formik.values.type === 'Standard' ? (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jours de travail
                      </label>
                      {joursLocaux.map((jour, index) => (
                        <div key={jour.nombrejour} className="grid grid-cols-12 gap-2 items-center mb-2">
                          <div className="col-span-2">
                            <span className="font-medium text-sm">Jour {jour.nombrejour}</span>
                          </div>
                          <div className="col-span-2">
                            <Switch
                              checked={jour.estJourTravail}
                              onChange={(checked) => handleJourTravailChange(index, checked)}
                              className={`${
                                jour.estJourTravail ? 'bg-emerald-600' : 'bg-gray-200'
                              } relative inline-flex h-6 w-11 items-center rounded-full`}
                            >
                              <span className="sr-only">Jour de travail</span>
                              <span
                                className={`${
                                  jour.estJourTravail ? 'translate-x-6' : 'translate-x-1'
                                } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                              />
                            </Switch>
                          </div>
                          {jour.estJourTravail && (
                            <>
                              <div className="col-span-3">
                                <input
                                  type="time"
                                  value={jour.heuredebut}
                                  onChange={(e) => handleHeureChange(index, 'heuredebut', e.target.value)}
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              </div>
                              <div className="col-span-3">
                                <input
                                  type="time"
                                  value={jour.heurefin}
                                  onChange={(e) => handleHeureChange(index, 'heurefin', e.target.value)}
                                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={jour.isnext}
                                    onChange={(e) => handleJourSuivantChange(index, e.target.checked)}
                                    className="form-checkbox h-4 w-4 text-emerald-600"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">+1 jour</span>
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label
                            htmlFor="heuretravail"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Heures de travail *
                          </label>
                          <input
                            type="number"
                            id="heuretravail"
                            {...formik.getFieldProps('heuretravail')}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                              formik.touched.heuretravail && formik.errors.heuretravail
                                ? 'border-red-300'
                                : 'border-gray-300'
                            }`}
                          />
                          {formik.touched.heuretravail && formik.errors.heuretravail && (
                            <div className="mt-1 text-sm text-red-600">
                              {formik.errors.heuretravail}
                            </div>
                          )}
                        </div>
                        <div>
                          <label
                            htmlFor="heurerepos"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Heures de repos *
                          </label>
                          <input
                            type="number"
                            id="heurerepos"
                            {...formik.getFieldProps('heurerepos')}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                              formik.touched.heurerepos && formik.errors.heurerepos
                                ? 'border-red-300'
                                : 'border-gray-300'
                            }`}
                          />
                          {formik.touched.heurerepos && formik.errors.heurerepos && (
                            <div className="mt-1 text-sm text-red-600">
                              {formik.errors.heurerepos}
                            </div>
                          )}
                        </div>
                        <div>
                          <label
                            htmlFor="heurereprise"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Heure de reprise *
                          </label>
                          <input
                            type="time"
                            id="heurereprise"
                            {...formik.getFieldProps('heurereprise')}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                              formik.touched.heurereprise && formik.errors.heurereprise
                                ? 'border-red-300'
                                : 'border-gray-300'
                            }`}
                          />
                          {formik.touched.heurereprise && formik.errors.heurereprise && (
                            <div className="mt-1 text-sm text-red-600">
                              {formik.errors.heurereprise}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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