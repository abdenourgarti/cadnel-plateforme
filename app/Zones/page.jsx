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
const initialZones = [
  { id: 1, code: "ZON001", name: "Zone Nord", employeesCount: 12, devicesCount: 2 },
  { id: 2, code: "ZON002", name: "Zone Sud", employeesCount: 8, devicesCount: 1 },
  { id: 3, code: "ZON003", name: "Zone Est", employeesCount: 15, devicesCount: 3 },
  { id: 4, code: "ZON004", name: "Zone Ouest", employeesCount: 10, devicesCount: 2 },
  { id: 5, code: "ZON005", name: "Zone Centrale", employeesCount: 20, devicesCount: 4 },
];

// Schéma de validation
const zoneSchema = Yup.object().shape({
  zoneName: Yup.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne doit pas dépasser 50 caractères')
    .required('Le nom de la zone est requis'),
});

export default function Zones() {
  const [zones, setZones] = useState(initialZones);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const formik = useFormik({
    initialValues: {
      zoneName: '',
    },
    validationSchema: zoneSchema,
    onSubmit: (values) => {
      if (isEditing) {
        // Modification
        const updatedZones = zones.map(zone =>
          zone.id === selectedZone.id
            ? { ...zone, name: values.zoneName }
            : zone
        );
        setZones(updatedZones);
        
        toast.success('Zone modifiée avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      } else {
        // Ajout
        const newZone = {
          id: zones.length + 1,
          code: `ZON${String(zones.length + 1).padStart(3, '0')}`,
          name: values.zoneName,
          employeesCount: 0,
          devicesCount: 0
        };
        setZones([...zones, newZone]);
        
        toast.success('Zone ajoutée avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      }
      
      handleCloseModal();
    },
  });

  const handleEdit = (zone) => {
    setSelectedZone(zone);
    formik.setFieldValue('zoneName', zone.name);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (zone) => {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer la zone "${zone.name}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedZones = zones.filter(z => z.id !== zone.id);
        setZones(updatedZones);
        toast.success('Zone supprimée avec succès', {
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
    setSelectedZone(null);
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Zones</h1>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom de la zone</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre d'employés</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre d'appareils</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{zone.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{zone.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{zone.employeesCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{zone.devicesCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(zone)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(zone)}
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
                    {isEditing ? "Modifier la zone" : "Ajouter une zone"}
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
                      htmlFor="zoneName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nom de la zone
                    </label>
                    <input
                      type="text"
                      id="zoneName"
                      {...formik.getFieldProps('zoneName')}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                        formik.touched.zoneName && formik.errors.zoneName
                          ? 'border-red-300'
                          : 'border-gray-300'
                      }`}
                      placeholder="Saisir le nom de la zone"
                    />
                    {formik.touched.zoneName && formik.errors.zoneName && (
                      <div className="mt-1 text-sm text-red-600">
                        {formik.errors.zoneName}
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