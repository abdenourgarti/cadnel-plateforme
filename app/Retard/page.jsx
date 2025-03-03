'use client';

import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog } from '@headlessui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { PencilIcon, ArrowDownTrayIcon, MagnifyingGlassIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/layouts/MainLayout';

// Données de démonstration pour les retards
const initialRetards = [
  { id: 1, employeId: 1, employeNom: "Jean Dupont", departement: "Informatique", zone: "Zone A", appareil: "AP001", date: "2025-02-25", heureEntree: "09:15", justifie: true, motif: "Problème de transport", document: "justificatif_transport_jean.pdf" },
  { id: 2, employeId: 2, employeNom: "Marie Martin", departement: "Informatique", zone: "Zone B", appareil: "AP002", date: "2025-02-26", heureEntree: "08:45", justifie: false, motif: "", document: "" },
  { id: 3, employeId: 4, employeNom: "Sophie Leroy", departement: "Finances", zone: "Zone C", appareil: "AP003", date: "2025-02-27", heureEntree: "09:30", justifie: true, motif: "Rendez-vous médical", document: "attestation_sophie.pdf" },
  { id: 4, employeId: 3, employeNom: "Paul Durand", departement: "Gestion", zone: "Zone A", appareil: "AP001", date: "2025-02-28", heureEntree: "08:20", justifie: false, motif: "", document: "" },
  { id: 5, employeId: 5, employeNom: "Thomas Bernard", departement: "RH", zone: "Zone B", appareil: "AP002", date: "2025-03-01", heureEntree: "09:05", justifie: true, motif: "Embouteillage exceptionnel", document: "photo_embouteillage.jpg" },
];

// Données de démonstration pour la liste des employés
const employes = [
  { id: 1, nomPrenom: "Jean Dupont" },
  { id: 2, nomPrenom: "Marie Martin" },
  { id: 3, nomPrenom: "Paul Durand" },
  { id: 4, nomPrenom: "Sophie Leroy" },
  { id: 5, nomPrenom: "Thomas Bernard" },
];

// Motifs de retard prédéfinis (conservés comme référence)
const motifs = [
  "Problème de transport",
  "Embouteillage exceptionnel",
  "Rendez-vous médical",
  "Intempéries",
  "Autre"
];

// Schéma de validation pour la modification d'un retard
const retardSchema = Yup.object().shape({
  justifie: Yup.boolean()
    .default(false),
  motif: Yup.string()
    .when('justifie', {
      is: true,
      then: (schema) => schema.required('Le motif est requis lorsque le retard est justifié'),
      otherwise: (schema) => schema.notRequired(),
    }),
  document: Yup.string()
    .notRequired(),
});

// Schéma de validation pour le formulaire de recherche
const rechercheSchema = Yup.object().shape({
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

export default function Retards() {
  const [retards, setRetards] = useState(initialRetards);
  const [filteredRetards, setFilteredRetards] = useState(initialRetards);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRetard, setSelectedRetard] = useState(null);

  // Formulaire pour modifier un retard
  const formik = useFormik({
    initialValues: {
      justifie: false,
      motif: '',
      document: ''
    },
    validationSchema: retardSchema,
    onSubmit: (values) => {
      // Modification du retard
      const updatedRetards = retards.map(retard =>
        retard.id === selectedRetard.id
          ? { 
              ...retard, 
              justifie: values.justifie,
              motif: values.justifie ? values.motif : '',
              document: values.document
            }
          : retard
      );
      
      setRetards(updatedRetards);
      applyFilters(updatedRetards);
      
      toast.success('Retard modifié avec succès', {
        position: "top-right",
        autoClose: 5000
      });
      
      handleCloseModal();
    },
  });

  // Formulaire pour la recherche
  const rechercheFormik = useFormik({
    initialValues: {
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

  // Appliquer les filtres de recherche
  const applyFilters = (retardList, filters = rechercheFormik.values) => {
    let filtered = [...retardList];
    
    if (filters.employeId) {
      filtered = filtered.filter(retard => retard.employeId === parseInt(filters.employeId));
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
      justifie: retard.justifie,
      motif: retard.motif || '',
      document: retard.document || ''
    });
    setIsModalOpen(true);
  };

  // Télécharger un document
  const handleDownload = (document) => {
    // Cette fonction serait remplacée par une vraie logique de téléchargement
    // Pour l'instant, elle affiche juste une notification
    toast.info(`Téléchargement du document: ${document}`, {
      position: "top-right",
      autoClose: 3000
    });
  };

  // Fermer le modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    formik.resetForm();
    setSelectedRetard(null);
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Retards</h1>
        </div>

        {/* Formulaire de recherche */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Recherche de retards</h2>
          
          <form onSubmit={rechercheFormik.handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sélection d'employé */}
              <div>
                <label htmlFor="employeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Employé
                </label>
                <select
                  id="employeId"
                  {...rechercheFormik.getFieldProps('employeId')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Tous les employés</option>
                  {employes.map((employe) => (
                    <option key={employe.id} value={employe.id}>
                      {employe.nomPrenom}
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
            
            {/* Boutons de recherche - placés en-dessous des champs */}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appareil</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heure d'entrée</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motif</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRetards.length > 0 ? (
                filteredRetards.map((retard) => (
                  <tr key={retard.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{retard.employeNom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{retard.departement}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{retard.zone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{retard.appareil}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(retard.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{retard.heureEntree}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {retard.justifie ? 
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
                <tr>
                  <td colSpan="10" className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
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

                <form onSubmit={formik.handleSubmit}>
                  <div className="space-y-4">
                    {/* Informations générales */}
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-600"><span className="font-medium">Date:</span> {formatDate(selectedRetard.date)}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">Heure d'entrée:</span> {selectedRetard.heureEntree}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">Département:</span> {selectedRetard.departement}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">Zone:</span> {selectedRetard.zone}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">Appareil:</span> {selectedRetard.appareil}</p>
                    </div>

                    {/* Statut (Toggle Switch) */}
                    <div className="mt-4">
                      <div className="flex items-center">
                        <label htmlFor="justifie" className="inline-flex relative items-center cursor-pointer">
                          <input
                            type="checkbox"
                            id="justifie"
                            checked={formik.values.justifie}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-700">Justifié ?</span>
                        </label>
                      </div>
                    </div>

                    {/* Motif (visible seulement si justifié) - Modifié en champ texte */}
                    {formik.values.justifie && (
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
                    {formik.values.justifie && (
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
      </div>
    </MainLayout>
  );
}