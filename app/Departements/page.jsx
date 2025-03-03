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
const initialDepartments = [
  { id: 1, code: "DEP001", name: "Ressources Humaines", employeesCount: 12, devicesCount: 2 },
  { id: 2, code: "DEP002", name: "Comptabilité", employeesCount: 8, devicesCount: 1 },
  { id: 3, code: "DEP003", name: "Informatique", employeesCount: 15, devicesCount: 3 },
  { id: 4, code: "DEP004", name: "Marketing", employeesCount: 10, devicesCount: 2 },
  { id: 5, code: "DEP005", name: "Commercial", employeesCount: 20, devicesCount: 4 },
];

// Schéma de validation
const departmentSchema = Yup.object().shape({
  departmentName: Yup.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne doit pas dépasser 50 caractères')
    .required('Le nom du département est requis'),
});

export default function Departments() {
  const [departments, setDepartments] = useState(initialDepartments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const formik = useFormik({
    initialValues: {
      departmentName: '',
    },
    validationSchema: departmentSchema,
    onSubmit: (values) => {
      if (isEditing) {
        // Modification
        const updatedDepartments = departments.map(dep =>
          dep.id === selectedDepartment.id
            ? { ...dep, name: values.departmentName }
            : dep
        );
        setDepartments(updatedDepartments);

        // axios.post("YOUR_API_ENDPOINT", values, {
        //   headers: {
        //     Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        //   }
        // })
        // .then(response => {
        //   console.log("Success:", response.data);
        // })
        // .catch(error => {
        //   console.error("Error:", error);
        // });
        
        
        toast.success('Département modifié avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      } else {
        // Ajout
        const newDepartment = {
          id: departments.length + 1,
          code: `DEP${String(departments.length + 1).padStart(3, '0')}`,
          name: values.departmentName,
          employeesCount: 0,
          devicesCount: 0
        };
        setDepartments([...departments, newDepartment]);
        
        toast.success('Département ajouté avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      }
      
      handleCloseModal();
    },
  });

  const handleEdit = (department) => {
    setSelectedDepartment(department);
    formik.setFieldValue('departmentName', department.name);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (department) => {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer le département "${department.name}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedDepartments = departments.filter(dep => dep.id !== department.id);
        setDepartments(updatedDepartments);
        toast.success('Département supprimé avec succès', {
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
    setSelectedDepartment(null);
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Départements</h1>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du département</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre d'employés</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre d'appareils</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {departments.map((department) => (
                <tr key={department.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{department.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{department.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{department.employeesCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{department.devicesCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(department)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(department)}
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
                    {isEditing ? "Modifier le département" : "Ajouter un département"}
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
                      htmlFor="departmentName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nom du département
                    </label>
                    <input
                      type="text"
                      id="departmentName"
                      {...formik.getFieldProps('departmentName')}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                        formik.touched.departmentName && formik.errors.departmentName
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                      placeholder="Saisir le nom du département"
                    />
                    {formik.touched.departmentName && formik.errors.departmentName && (
                      <div className="mt-1 text-sm text-red-600">
                        {formik.errors.departmentName}
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