'use client';

import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog } from '@headlessui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/layouts/MainLayout';

// Données de démonstration pour les congés
const initialConges = [
  { id: 1, employeId: 1, employeNom: "Jean Dupont", departement: "Informatique", zone: "Zone A", appareil: "AP001", dateDebut: "2023-10-01", dateFin: "2023-10-05", status: "terminé" },
  { id: 2, employeId: 2, employeNom: "Marie Martin", departement: "Informatique", zone: "Zone B", appareil: "AP002", dateDebut: "2023-10-10", dateFin: "2023-10-15", status: "en cours" },
  { id: 3, employeId: 3, employeNom: "Paul Durand", departement: "Gestion", zone: "Zone A", appareil: "AP001", dateDebut: "2023-11-01", dateFin: "2023-11-10", status: "à venir" },
];

// Données de démonstration pour la liste des employés
const employes = [
  { id: 1, nomPrenom: "Jean Dupont" },
  { id: 2, nomPrenom: "Marie Martin" },
  { id: 3, nomPrenom: "Paul Durand" },
];

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

// Schéma de validation pour le formulaire d'ajout/modification de congé
const congeSchema = Yup.object().shape({
  employeId: Yup.number().required('L\'employé est requis'),
  dateDebut: Yup.date().required('La date de début est requise'),
  dateFin: Yup.date()
    .required('La date de fin est requise')
    .min(Yup.ref('dateDebut'), 'La date de fin doit être postérieure à la date de début'),
});

export default function Conges() {
  const [conges, setConges] = useState(initialConges);
  const [filteredConges, setFilteredConges] = useState(initialConges);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConge, setSelectedConge] = useState(null);

  // Formulaire pour ajouter/modifier un congé
  const formik = useFormik({
    initialValues: {
      employeId: '',
      dateDebut: '',
      dateFin: ''
    },
    validationSchema: congeSchema,
    onSubmit: (values) => {
      const newConge = {
        id: selectedConge ? selectedConge.id : conges.length + 1,
        employeId: values.employeId,
        employeNom: employes.find(e => e.id === values.employeId).nomPrenom,
        departement: "Informatique", // À adapter selon vos besoins
        zone: "Zone A", // À adapter selon vos besoins
        appareil: "AP001", // À adapter selon vos besoins
        dateDebut: values.dateDebut,
        dateFin: values.dateFin,
        status: getStatus(values.dateDebut, values.dateFin)
      };

      if (selectedConge) {
        const updatedConges = conges.map(conge =>
          conge.id === selectedConge.id ? newConge : conge
        );
        setConges(updatedConges);
        applyFilters(updatedConges);
      } else {
        const updatedConges = [...conges, newConge];
        setConges(updatedConges);
        applyFilters(updatedConges);
      }

      toast.success(selectedConge ? 'Congé modifié avec succès' : 'Congé ajouté avec succès', {
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
      applyFilters(conges, values);
      toast.info('Recherche effectuée', {
        position: "top-right",
        autoClose: 3000
      });
    }
  });

  // Appliquer les filtres de recherche
  const applyFilters = (congeList, filters = rechercheFormik.values) => {
    let filtered = [...congeList];
    
    if (filters.employeId) {
      filtered = filtered.filter(conge => conge.employeId === parseInt(filters.employeId));
    }
    
    if (filters.dateDebut) {
      const dateDebut = new Date(filters.dateDebut);
      filtered = filtered.filter(conge => new Date(conge.dateDebut) >= dateDebut);
    }
    
    if (filters.dateFin) {
      const dateFin = new Date(filters.dateFin);
      filtered = filtered.filter(conge => new Date(conge.dateFin) <= dateFin);
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

  // Ouvrir le modal pour ajouter/modifier un congé
  const handleAddOrEdit = (conge = null) => {
    setSelectedConge(conge);
    if (conge) {
      formik.setValues({
        employeId: conge.employeId,
        dateDebut: conge.dateDebut,
        dateFin: conge.dateFin
      });
    } else {
      formik.resetForm();
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
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedConges = conges.filter(conge => conge.id !== id);
        setConges(updatedConges);
        applyFilters(updatedConges);
        toast.success('Congé supprimé avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      }
    });
  };

  // Fermer le modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    formik.resetForm();
    setSelectedConge(null);
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Congés</h1>
        </div>

        {/* Formulaire de recherche */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Recherche de congés</h2>
          
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

        {/* Bouton Ajouter */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => handleAddOrEdit()}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Ajouter un congé
          </button>
        </div>

        {/* Tableau des congés */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Département</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appareil</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date début</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date fin</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredConges.length > 0 ? (
                filteredConges.map((conge) => (
                  <tr key={conge.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{conge.employeNom}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conge.departement}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conge.zone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conge.appareil}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(conge.dateDebut)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(conge.dateFin)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[conge.status]}`}>
                        {conge.status}
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
                        onClick={() => handleDelete(conge.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer ce congé"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
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
                    {selectedConge ? 'Modifier un congé' : 'Ajouter un congé'}
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
                    {/* Sélection d'employé */}
                    <div>
                      <label htmlFor="employeId" className="block text-sm font-medium text-gray-700">
                        Employé <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="employeId"
                        {...formik.getFieldProps('employeId')}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">Sélectionnez un employé</option>
                        {employes.map((employe) => (
                          <option key={employe.id} value={employe.id}>
                            {employe.nomPrenom}
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
                      {selectedConge ? 'Modifier' : 'Ajouter'}
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