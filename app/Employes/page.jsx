'use client';

import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog } from '@headlessui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/layouts/MainLayout';

// Données de démonstration
const initialEmployes = [
  { id: 1, numero: "EMP001", nomPrenom: "Jean Dupont", departement: "Informatique", poste: "Développeur Frontend", zone: "Zone A", empreinte: true },
  { id: 2, numero: "EMP002", nomPrenom: "Marie Martin", departement: "Informatique", poste: "Développeur Backend", zone: "Zone B", empreinte: true },
  { id: 3, numero: "EMP003", nomPrenom: "Paul Durand", departement: "Gestion", poste: "Chef de Projet", zone: "Zone A", empreinte: false },
  { id: 4, numero: "EMP004", nomPrenom: "Sophie Leroy", departement: "Finances", poste: "Comptable", zone: "Zone C", empreinte: true },
  { id: 5, numero: "EMP005", nomPrenom: "Thomas Bernard", departement: "RH", poste: "Responsable RH", zone: "Zone B", empreinte: false },
];

// Données pour les listes déroulantes
const departements = ["Informatique", "Gestion", "Finances", "RH", "Marketing", "Commercial"];
const postes = ["Développeur Frontend", "Développeur Backend", "Chef de Projet", "Comptable", "Responsable RH", "Technicien"];
const zones = ["Zone A", "Zone B", "Zone C", "Zone D"];

// Schéma de validation
const employeSchema = Yup.object().shape({
  nomPrenom: Yup.string()
    .min(2, 'Le nom et prénom doivent contenir au moins 2 caractères')
    .max(100, 'Le nom et prénom ne doivent pas dépasser 100 caractères')
    .required('Le nom et prénom sont requis'),
  departement: Yup.string()
    .required('Le département est requis'),
  poste: Yup.string()
    .required('Le poste est requis'),
  zone: Yup.string()
    .required('La zone est requise'),
  empreinte: Yup.boolean()
    .default(false)
});

export default function Employes() {
  const [employes, setEmployes] = useState(initialEmployes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmploye, setSelectedEmploye] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const formik = useFormik({
    initialValues: {
      nomPrenom: '',
      departement: '',
      poste: '',
      zone: '',
      empreinte: false
    },
    validationSchema: employeSchema,
    onSubmit: (values) => {
      if (isEditing) {
        // Modification
        const updatedEmployes = employes.map(employe =>
          employe.id === selectedEmploye.id
            ? { 
                ...employe, 
                nomPrenom: values.nomPrenom,
                departement: values.departement,
                poste: values.poste,
                zone: values.zone,
                empreinte: values.empreinte
              }
            : employe
        );
        setEmployes(updatedEmployes);
        
        toast.success('Employé modifié avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      } else {
        // Ajout
        const newEmploye = {
          id: employes.length + 1,
          numero: `EMP${String(employes.length + 1).padStart(3, '0')}`,
          nomPrenom: values.nomPrenom,
          departement: values.departement,
          poste: values.poste,
          zone: values.zone,
          empreinte: values.empreinte
        };
        setEmployes([...employes, newEmploye]);
        
        toast.success('Employé ajouté avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      }
      
      handleCloseModal();
    },
  });

  const handleEdit = (employe) => {
    setSelectedEmploye(employe);
    formik.setValues({
      nomPrenom: employe.nomPrenom,
      departement: employe.departement,
      poste: employe.poste,
      zone: employe.zone,
      empreinte: employe.empreinte
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (employe) => {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer l'employé "${employe.nomPrenom}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedEmployes = employes.filter(e => e.id !== employe.id);
        setEmployes(updatedEmployes);
        toast.success('Employé supprimé avec succès', {
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom et prénom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Département</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poste</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Empreinte</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employes.map((employe) => (
                <tr key={employe.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{employe.numero}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employe.nomPrenom}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employe.departement}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employe.poste}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employe.zone}</td>
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
              ))}
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

              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
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
                  <div className="space-y-4">
                    {/* Nom et prénom */}
                    <div>
                      <label
                        htmlFor="nomPrenom"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nom et prénom
                      </label>
                      <input
                        type="text"
                        id="nomPrenom"
                        {...formik.getFieldProps('nomPrenom')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.nomPrenom && formik.errors.nomPrenom
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        placeholder="Saisir le nom et prénom"
                      />
                      {formik.touched.nomPrenom && formik.errors.nomPrenom && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.nomPrenom}
                        </div>
                      )}
                    </div>

                    {/* Département */}
                    <div>
                      <label
                        htmlFor="departement"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Département
                      </label>
                      <select
                        id="departement"
                        {...formik.getFieldProps('departement')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.departement && formik.errors.departement
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="">Sélectionner un département</option>
                        {departements.map((departement) => (
                          <option key={departement} value={departement}>
                            {departement}
                          </option>
                        ))}
                      </select>
                      {formik.touched.departement && formik.errors.departement && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.departement}
                        </div>
                      )}
                    </div>

                    {/* Poste */}
                    <div>
                      <label
                        htmlFor="poste"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Poste
                      </label>
                      <select
                        id="poste"
                        {...formik.getFieldProps('poste')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.poste && formik.errors.poste
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="">Sélectionner un poste</option>
                        {postes.map((poste) => (
                          <option key={poste} value={poste}>
                            {poste}
                          </option>
                        ))}
                      </select>
                      {formik.touched.poste && formik.errors.poste && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.poste}
                        </div>
                      )}
                    </div>

                    {/* Zone */}
                    <div>
                      <label
                        htmlFor="zone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Zone
                      </label>
                      <select
                        id="zone"
                        {...formik.getFieldProps('zone')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.zone && formik.errors.zone
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="">Sélectionner une zone</option>
                        {zones.map((zone) => (
                          <option key={zone} value={zone}>
                            {zone}
                          </option>
                        ))}
                      </select>
                      {formik.touched.zone && formik.errors.zone && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.zone}
                        </div>
                      )}
                    </div>

                    {/* Empreinte (toggle switch) */}
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