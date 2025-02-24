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
const initialPostes = [
  { id: 1, code: "POS001", name: "Développeur Frontend", employeesCount: 5 },
  { id: 2, code: "POS002", name: "Développeur Backend", employeesCount: 8 },
  { id: 3, code: "POS003", name: "Chef de Projet", employeesCount: 3 },
  { id: 4, code: "POS004", name: "Comptable", employeesCount: 2 },
  { id: 5, code: "POS005", name: "Responsable RH", employeesCount: 1 },
];

// Schéma de validation
const posteSchema = Yup.object().shape({
  posteName: Yup.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne doit pas dépasser 50 caractères')
    .required('Le nom du poste est requis'),
});

export default function Postes() {
  const [postes, setPostes] = useState(initialPostes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPoste, setSelectedPoste] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const formik = useFormik({
    initialValues: {
      posteName: '',
    },
    validationSchema: posteSchema,
    onSubmit: (values) => {
      if (isEditing) {
        // Modification
        const updatedPostes = postes.map(poste =>
          poste.id === selectedPoste.id
            ? { ...poste, name: values.posteName }
            : poste
        );
        setPostes(updatedPostes);
        
        toast.success('Poste modifié avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      } else {
        // Ajout
        const newPoste = {
          id: postes.length + 1,
          code: `POS${String(postes.length + 1).padStart(3, '0')}`,
          name: values.posteName,
          employeesCount: 0
        };
        setPostes([...postes, newPoste]);
        
        toast.success('Poste ajouté avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      }
      
      handleCloseModal();
    },
  });

  const handleEdit = (poste) => {
    setSelectedPoste(poste);
    formik.setFieldValue('posteName', poste.name);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (poste) => {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer le poste "${poste.name}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedPostes = postes.filter(p => p.id !== poste.id);
        setPostes(updatedPostes);
        toast.success('Poste supprimé avec succès', {
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
    setSelectedPoste(null);
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Postes</h1>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du poste</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre d'employés</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {postes.map((poste) => (
                <tr key={poste.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{poste.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{poste.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{poste.employeesCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(poste)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(poste)}
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
                    {isEditing ? "Modifier le poste" : "Ajouter un poste"}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={formik.handleSubmit}>
                  <div className="mt-2">
                    <label
                      htmlFor="posteName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nom du poste
                    </label>
                    <input
                      type="text"
                      id="posteName"
                      {...formik.getFieldProps('posteName')}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                        formik.touched.posteName && formik.errors.posteName
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                      placeholder="Saisir le nom du poste"
                    />
                    {formik.touched.posteName && formik.errors.posteName && (
                      <div className="mt-1 text-sm text-red-600">
                        {formik.errors.posteName}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
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