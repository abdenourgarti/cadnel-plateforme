'use client';

import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog } from '@headlessui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/layouts/MainLayout';

// Données de démonstration
const initialCompanies = [
  { 
    id: 1, 
    name: "Tech Solutions", 
    phone: "01 23 45 67 89", 
    contactName: "Jean Dupont",
    contactPhone: "06 12 34 56 78",
    address: "123 Avenue de la République, 75011 Paris",
    usersCount: 25,
    departmentsCount: 4,
    zonesCount: 3,
    devicesCount: 12,
    employeesCount: 45
  },
  { 
    id: 2, 
    name: "Innov Corp", 
    phone: "01 98 76 54 32", 
    contactName: "Marie Lambert",
    contactPhone: "07 65 43 21 09",
    address: "56 Rue de la Paix, 69002 Lyon",
    usersCount: 18,
    departmentsCount: 3,
    zonesCount: 2,
    devicesCount: 8,
    employeesCount: 32
  },
  { 
    id: 3, 
    name: "Global Services", 
    phone: "03 45 67 89 01", 
    contactName: "Thomas Martin",
    contactPhone: "06 78 90 12 34",
    address: "8 Boulevard des Alpes, 38000 Grenoble",
    usersCount: 35,
    departmentsCount: 6,
    zonesCount: 4,
    devicesCount: 24,
    employeesCount: 68
  },
];

// Schéma de validation
const companySchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne doit pas dépasser 50 caractères')
    .required('Le nom de l\'entreprise est requis'),
  phone: Yup.string(),
  contactName: Yup.string(),
  contactPhone: Yup.string(),
  address: Yup.string(),
});

export default function Companies() {
  const [companies, setCompanies] = useState(initialCompanies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      phone: '',
      contactName: '',
      contactPhone: '',
      address: '',
    },
    validationSchema: companySchema,
    onSubmit: (values) => {
      if (isEditing) {
        // Modification
        const updatedCompanies = companies.map(company =>
          company.id === selectedCompany.id
            ? { ...company, ...values }
            : company
        );
        setCompanies(updatedCompanies);
        
        toast.success('Entreprise modifiée avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      } else {
        // Ajout
        const newCompany = {
          id: companies.length + 1,
          ...values,
          usersCount: 0,
          departmentsCount: 0,
          zonesCount: 0,
          devicesCount: 0,
          employeesCount: 0
        };
        setCompanies([...companies, newCompany]);
        
        toast.success('Entreprise ajoutée avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      }
      
      handleCloseModal();
    },
  });

  const handleEdit = (company) => {
    setSelectedCompany(company);
    formik.setValues({
      name: company.name,
      phone: company.phone,
      contactName: company.contactName,
      contactPhone: company.contactPhone,
      address: company.address,
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (company) => {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer l'entreprise "${company.name}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedCompanies = companies.filter(comp => comp.id !== company.id);
        setCompanies(updatedCompanies);
        toast.success('Entreprise supprimée avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      }
    });
  };

  const handleView = (company) => {
    setSelectedCompany(company);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    formik.resetForm();
    setSelectedCompany(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedCompany(null);
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Entreprises</h1>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateurs</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Départements</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Zones</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Appareils</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Employés</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{company.usersCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{company.departmentsCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{company.zonesCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{company.devicesCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{company.employeesCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleView(company)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Voir détails"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(company)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Modifier"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(company)}
                      className="text-red-600 hover:text-red-900"
                      title="Supprimer"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Ajout/Modification - Positionné plus bas */}
        {isModalOpen && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-16 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" aria-hidden="true" />

              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
                &#8203;
              </span>

              <div className="inline-block w-full max-w-md p-6 my-14 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    {isEditing ? "Modifier l'entreprise" : "Ajouter une entreprise"}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={formik.handleSubmit}>
                  <div className="mt-2 space-y-4">
                    {/* Nom de l'entreprise */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nom de l'entreprise *
                      </label>
                      <input
                        type="text"
                        id="name"
                        {...formik.getFieldProps('name')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.name && formik.errors.name
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        placeholder="Saisir le nom de l'entreprise"
                      />
                      {formik.touched.name && formik.errors.name && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.name}
                        </div>
                      )}
                    </div>

                    {/* Téléphone de l'entreprise */}
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Téléphone de l'entreprise
                      </label>
                      <input
                        type="text"
                        id="phone"
                        {...formik.getFieldProps('phone')}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Saisir le téléphone"
                      />
                    </div>

                    {/* Nom du contact */}
                    <div>
                      <label
                        htmlFor="contactName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nom du contact
                      </label>
                      <input
                        type="text"
                        id="contactName"
                        {...formik.getFieldProps('contactName')}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Saisir le nom du contact"
                      />
                    </div>

                    {/* Numéro du contact */}
                    <div>
                      <label
                        htmlFor="contactPhone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Numéro du contact
                      </label>
                      <input
                        type="text"
                        id="contactPhone"
                        {...formik.getFieldProps('contactPhone')}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Saisir le numéro du contact"
                      />
                    </div>

                    {/* Adresse de l'entreprise */}
                    <div>
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Adresse de l'entreprise
                      </label>
                      <textarea
                        id="address"
                        {...formik.getFieldProps('address')}
                        rows="3"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Saisir l'adresse"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      onClick={handleCloseModal}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
                    >
                      {isEditing ? "Modifier" : "Ajouter"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Affichage Détails - Version moderne avec largeur limitée */}
        {isViewModalOpen && selectedCompany && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-16 pb-20 text-center sm:p-0">
              <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" aria-hidden="true" />

              <div className="inline-block w-full max-w-2xl p-6 my-14 mx-auto overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                  <h3 className="text-lg font-semibold leading-6 text-gray-900">
                    Détails de l'entreprise
                  </h3>
                  <button
                    onClick={handleCloseViewModal}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="mt-4 space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-emerald-600 border-l-4 border-emerald-500 pl-3">Informations générales</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500">Nom de l'entreprise</p>
                        <p className="text-base font-medium text-gray-900 mt-1">{selectedCompany.name}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500">Téléphone</p>
                        <p className="text-base text-gray-900 mt-1">{selectedCompany.phone || "Non renseigné"}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500">Nom du contact</p>
                        <p className="text-base text-gray-900 mt-1">{selectedCompany.contactName || "Non renseigné"}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500">Numéro du contact</p>
                        <p className="text-base text-gray-900 mt-1">{selectedCompany.contactPhone || "Non renseigné"}</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">Adresse</p>
                      <p className="text-base text-gray-900 mt-1">{selectedCompany.address || "Non renseignée"}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-emerald-600 border-l-4 border-emerald-500 pl-3">Statistiques</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-sm">
                        <p className="text-xl font-bold text-blue-600">{selectedCompany.usersCount}</p>
                        <p className="text-xs font-medium text-gray-500 mt-1">Utilisateurs</p>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl shadow-sm">
                        <p className="text-xl font-bold text-green-600">{selectedCompany.departmentsCount}</p>
                        <p className="text-xs font-medium text-gray-500 mt-1">Départements</p>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl shadow-sm">
                        <p className="text-xl font-bold text-purple-600">{selectedCompany.zonesCount}</p>
                        <p className="text-xs font-medium text-gray-500 mt-1">Zones</p>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl shadow-sm">
                        <p className="text-xl font-bold text-amber-600">{selectedCompany.devicesCount}</p>
                        <p className="text-xs font-medium text-gray-500 mt-1">Appareils</p>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-xl shadow-sm">
                        <p className="text-xl font-bold text-rose-600">{selectedCompany.employeesCount}</p>
                        <p className="text-xs font-medium text-gray-500 mt-1">Employés</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
                    onClick={handleCloseViewModal}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}