'use client';

import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog } from '@headlessui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/layouts/MainLayout';
import { Switch } from '@headlessui/react';

// Données de démonstration pour les plannings
const initialPlannings = [
  { 
    id: 1, 
    nom: "Planning standard bureaux", 
    type: "Standard",
    joursTravail: 5,
    rotation: null
  },
  { 
    id: 2, 
    nom: "Planning rotation gardiens", 
    type: "Rotation",
    joursTravail: null,
    rotation: "24/48"
  },
  { 
    id: 3, 
    nom: "Planning week-end", 
    type: "Standard",
    joursTravail: 2,
    rotation: null
  },
];

// Données pour les jours de la semaine
const joursSemaine = [
  { id: 1, nom: "Lundi" },
  { id: 2, nom: "Mardi" },
  { id: 3, nom: "Mercredi" },
  { id: 4, nom: "Jeudi" },
  { id: 5, nom: "Vendredi" },
  { id: 6, nom: "Samedi" },
  { id: 7, nom: "Dimanche" },
];

// Options pour le type de planning
const typePlanningOptions = [
  { id: 1, value: "Standard", label: "Standard" },
  { id: 2, value: "Rotation", label: "Rotation" },
];

// Schéma de validation pour le planning standard
const planningStandardSchema = Yup.object().shape({
  nom: Yup.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne doit pas dépasser 100 caractères')
    .required('Le nom du planning est requis'),
  type: Yup.string()
    .required('Le type de planning est requis'),
  jours: Yup.array().of(
    Yup.object().shape({
      estJourTravail: Yup.boolean(),
      heureDebut: Yup.string()
        .when('estJourTravail', {
          is: true,
          then: () => Yup.string().required('L\'heure de début est requise'),
        }),
      heureFin: Yup.string()
        .when('estJourTravail', {
          is: true,
          then: () => Yup.string().required('L\'heure de fin est requise'),
        }),
      jourSuivant: Yup.boolean(),
    })
  ),
});

// Schéma de validation pour le planning rotation
const planningRotationSchema = Yup.object().shape({
  nom: Yup.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne doit pas dépasser 100 caractères')
    .required('Le nom du planning est requis'),
  type: Yup.string()
    .required('Le type de planning est requis'),
  dureeTravailHeures: Yup.number()
    .required('La durée de travail est requise')
    .positive('La durée doit être positive')
    .integer('La durée doit être un nombre entier'),
  dureeReposHeures: Yup.number()
    .required('La durée de repos est requise')
    .positive('La durée doit être positive')
    .integer('La durée doit être un nombre entier'),
  heurePriseService: Yup.string()
    .required('L\'heure de prise de service est requise'),
});

export default function Plannings() {
  const [plannings, setPlannings] = useState(initialPlannings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanning, setSelectedPlanning] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentValidationSchema, setCurrentValidationSchema] = useState(planningStandardSchema);

  // Initialisation du formulaire avec des valeurs par défaut
  const formik = useFormik({
    initialValues: {
      nom: '',
      type: 'Standard',
      dureeTravailHeures: 24,
      dureeReposHeures: 48,
      heurePriseService: '07:00',
      jours: joursSemaine.map(jour => ({
        id: jour.id,
        nom: jour.nom,
        estJourTravail: false,
        heureDebut: '09:00',
        heureFin: '17:00',
        jourSuivant: false,
      })),
    },
    validationSchema: currentValidationSchema,
    onSubmit: (values) => {
      if (isEditing) {
        // Modification
        const updatedPlannings = plannings.map(planning =>
          planning.id === selectedPlanning.id
            ? { 
                ...planning, 
                nom: values.nom,
                // Le type ne change pas en modification
                joursTravail: values.type === 'Standard' 
                  ? values.jours.filter(j => j.estJourTravail).length 
                  : null,
                rotation: values.type === 'Rotation' 
                  ? `${values.dureeTravailHeures}/${values.dureeReposHeures}` 
                  : null,
              }
            : planning
        );
        setPlannings(updatedPlannings);
        
        toast.success('Planning modifié avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      } else {
        // Ajout
        const newPlanning = {
          id: plannings.length + 1,
          nom: values.nom,
          type: values.type,
          joursTravail: values.type === 'Standard' 
            ? values.jours.filter(j => j.estJourTravail).length 
            : null,
          rotation: values.type === 'Rotation' 
            ? `${values.dureeTravailHeures}/${values.dureeReposHeures}` 
            : null,
        };
        setPlannings([...plannings, newPlanning]);
        
        toast.success('Planning ajouté avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      }
      
      handleCloseModal();
    },
  });

  // Mise à jour du schéma de validation lorsque le type de planning change
  useEffect(() => {
    if (formik.values.type === 'Standard') {
      setCurrentValidationSchema(planningStandardSchema);
    } else {
      setCurrentValidationSchema(planningRotationSchema);
    }
  }, [formik.values.type]);

  const handleEdit = (planning) => {
    setSelectedPlanning(planning);

    // Préparer les données pour le formulaire selon le type de planning
    let initialData = {
      nom: planning.nom,
      type: planning.type,
    };

    if (planning.type === 'Standard') {
      // Simuler les données des jours pour l'exemple
      // Dans une application réelle, vous chargeriez ces données depuis la base de données
      initialData.jours = joursSemaine.map(jour => {
        const estJourTravail = jour.id <= planning.joursTravail; // Exemple simple
        return {
          id: jour.id,
          nom: jour.nom,
          estJourTravail: estJourTravail,
          heureDebut: estJourTravail ? '09:00' : '',
          heureFin: estJourTravail ? '17:00' : '',
          jourSuivant: false,
        };
      });
    } else {
      // Récupérer les valeurs pour le planning de rotation
      const [dureeTravail, dureeRepos] = planning.rotation.split('/').map(Number);
      initialData.dureeTravailHeures = dureeTravail;
      initialData.dureeReposHeures = dureeRepos;
      initialData.heurePriseService = '07:00'; // Exemple pour l'heure de prise de service
    }

    formik.setValues(initialData);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (planning) => {
    // Vérifier si c'est le dernier planning
    if (plannings.length === 1) {
      Swal.fire({
        title: 'Opération impossible',
        text: 'Vous devez avoir au moins un planning dans le système.',
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
      });
      return;
    }

    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer le planning "${planning.nom}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedPlannings = plannings.filter(p => p.id !== planning.id);
        setPlannings(updatedPlannings);
        toast.success('Planning supprimé avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      }
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    formik.resetForm();
    setSelectedPlanning(null);
  };

  const handleJourTravailChange = (index, checked) => {
    const updatedJours = [...formik.values.jours];
    updatedJours[index] = {
      ...updatedJours[index],
      estJourTravail: checked
    };
    formik.setFieldValue('jours', updatedJours);
  };

  const handleHeureChange = (index, field, value) => {
    const updatedJours = [...formik.values.jours];
    updatedJours[index] = {
      ...updatedJours[index],
      [field]: value
    };
    formik.setFieldValue('jours', updatedJours);
  };

  const handleJourSuivantChange = (index, checked) => {
    const updatedJours = [...formik.values.jours];
    updatedJours[index] = {
      ...updatedJours[index],
      jourSuivant: checked
    };
    formik.setFieldValue('jours', updatedJours);
  };

  const compterJoursTravail = (planning) => {
    if (planning.type === 'Standard') {
      return planning.joursTravail;
    }
    return '-';
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Plannings</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Ajouter
          </button>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du planning</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jours de travail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rotation</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {plannings.map((planning) => (
                <tr key={planning.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{planning.nom}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{planning.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{compterJoursTravail(planning)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{planning.rotation || '-'}</td>
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Ajout/Modification */}
        {isModalOpen && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-20 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" aria-hidden="true" />
        
              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
                &#8203;
              </span>
        
              <div className="inline-block w-full max-w-3xl p-6 my-12 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {isEditing ? "Modifier le planning" : "Ajouter un planning"}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
        
                <form onSubmit={formik.handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Nom du planning */}
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
        
                    {/* Type de planning (liste déroulante) - désactivé en mode édition */}
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
                        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.type && formik.errors.type
                            ? 'border-red-300'
                            : 'border-gray-300'
                        } ${isEditing ? 'bg-gray-100' : ''}`}
                      >
                        {typePlanningOptions.map((option) => (
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
        
                  {/* Afficher les champs selon le type de planning */}
                  {formik.values.type === 'Rotation' ? (
                    // Champs pour le planning de rotation
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label
                          htmlFor="dureeTravailHeures"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Heures de travail *
                        </label>
                        <input
                          type="number"
                          id="dureeTravailHeures"
                          {...formik.getFieldProps('dureeTravailHeures')}
                          min="1"
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                            formik.touched.dureeTravailHeures && formik.errors.dureeTravailHeures
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                        />
                        {formik.touched.dureeTravailHeures && formik.errors.dureeTravailHeures && (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.dureeTravailHeures}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label
                          htmlFor="dureeReposHeures"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Heures de repos *
                        </label>
                        <input
                          type="number"
                          id="dureeReposHeures"
                          {...formik.getFieldProps('dureeReposHeures')}
                          min="1"
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                            formik.touched.dureeReposHeures && formik.errors.dureeReposHeures
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                        />
                        {formik.touched.dureeReposHeures && formik.errors.dureeReposHeures && (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.dureeReposHeures}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label
                          htmlFor="heurePriseService"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Heure de prise de service *
                        </label>
                        <input
                          type="time"
                          id="heurePriseService"
                          {...formik.getFieldProps('heurePriseService')}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                            formik.touched.heurePriseService && formik.errors.heurePriseService
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                        />
                        {formik.touched.heurePriseService && formik.errors.heurePriseService && (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.heurePriseService}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Champs pour le planning standard (jours de la semaine)
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jours de travail
                      </label>
                      
                      <div className="space-y-3">
                        {formik.values.jours.map((jour, index) => (
                          <div key={jour.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-2">
                              <span className="font-medium text-sm">{jour.nom}</span>
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
                                  <label htmlFor={`heureDebut-${index}`} className="sr-only">Heure début</label>
                                  <input
                                    type="time"
                                    id={`heureDebut-${index}`}
                                    value={jour.heureDebut}
                                    onChange={(e) => handleHeureChange(index, 'heureDebut', e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                                  />
                                </div>
                                
                                <div className="col-span-3">
                                  <label htmlFor={`heureFin-${index}`} className="sr-only">Heure fin</label>
                                  <input
                                    type="time"
                                    id={`heureFin-${index}`}
                                    value={jour.heureFin}
                                    onChange={(e) => handleHeureChange(index, 'heureFin', e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                                  />
                                </div>
                                
                                <div className="col-span-2 flex items-center">
                                  <label className="inline-flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={jour.jourSuivant}
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