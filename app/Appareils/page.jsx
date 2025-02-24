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

// Données de démonstration pour les appareils
const initialAppareils = [
  { 
    id: 1, 
    serialNumber: "APP001", 
    name: "Terminal A", 
    zone: "Zone Nord", 
    ipAddress: "192.168.1.100", 
    usersCount: 35, 
    fingerprintsCount: 150, 
    transactionsCount: 2450,
    transferMode: "Temps réel",
    isRegistrationDevice: true,
    heartbeatInterval: 60,
    timezone: "Etc/GMT+1",
    isPresenceDevice: true
  },
  { 
    id: 2, 
    serialNumber: "APP002", 
    name: "Terminal B", 
    zone: "Zone Sud", 
    ipAddress: "192.168.1.101", 
    usersCount: 28, 
    fingerprintsCount: 112, 
    transactionsCount: 1890,
    transferMode: "Trimming",
    isRegistrationDevice: false,
    heartbeatInterval: 30,
    timezone: "Etc/GMT+1",
    isPresenceDevice: true
  },
  { 
    id: 3, 
    serialNumber: "APP003", 
    name: "Terminal C", 
    zone: "Zone Est", 
    ipAddress: "0.0.0.0", 
    usersCount: 15, 
    fingerprintsCount: 60, 
    transactionsCount: 825,
    transferMode: "Temps réel",
    isRegistrationDevice: true,
    heartbeatInterval: 45,
    timezone: "Etc/GMT+2",
    isPresenceDevice: false
  },
];

// Données de démonstration pour les zones
const zoneOptions = [
  { id: 1, name: "Zone Nord" },
  { id: 2, name: "Zone Sud" },
  { id: 3, name: "Zone Est" },
  { id: 4, name: "Zone Ouest" },
  { id: 5, name: "Zone Centrale" },
];

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

// Options pour le mode de transfert
const transferModeOptions = [
  { id: 1, value: "Temps réel", label: "Temps réel" },
  { id: 2, value: "Trimming", label: "Trimming" },
];

// Schéma de validation
const appareilSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne doit pas dépasser 50 caractères')
    .required('Le nom de l\'appareil est requis'),
  serialNumber: Yup.string()
    .required('Le numéro de série est requis'),
  ipAddress: Yup.string()
    .matches(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})?$/, 'Adresse IP invalide'),
  zone: Yup.string()
    .required('La zone est requise'),
  transferMode: Yup.string()
    .required('Le mode de transfert est requis'),
  isRegistrationDevice: Yup.boolean()
    .required('Ce champ est requis'),
  heartbeatInterval: Yup.number()
    .min(1, 'La valeur doit être supérieure à 0')
    .required('L\'intervalle de battement de cœur est requis'),
  timezone: Yup.string()
    .required('Le fuseau horaire est requis'),
  isPresenceDevice: Yup.boolean()
    .required('Ce champ est requis'),
});

export default function Appareils() {
  const [appareils, setAppareils] = useState(initialAppareils);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppareil, setSelectedAppareil] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      serialNumber: '',
      ipAddress: '0.0.0.0',
      zone: '',
      transferMode: 'Temps réel',
      isRegistrationDevice: false,
      heartbeatInterval: 60,
      timezone: 'Etc/GMT+1',
      isPresenceDevice: false,
    },
    validationSchema: appareilSchema,
    onSubmit: (values) => {
      if (isEditing) {
        // Modification
        const updatedAppareils = appareils.map(appareil =>
          appareil.id === selectedAppareil.id
            ? { 
                ...appareil, 
                name: values.name,
                serialNumber: values.serialNumber,
                ipAddress: values.ipAddress || '0.0.0.0',
                zone: values.zone,
                transferMode: values.transferMode,
                isRegistrationDevice: values.isRegistrationDevice,
                heartbeatInterval: values.heartbeatInterval,
                timezone: values.timezone,
                isPresenceDevice: values.isPresenceDevice,
              }
            : appareil
        );
        setAppareils(updatedAppareils);
        
        toast.success('Appareil modifié avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      } else {
        // Ajout
        const newAppareil = {
          id: appareils.length + 1,
          name: values.name,
          serialNumber: values.serialNumber,
          ipAddress: values.ipAddress || '0.0.0.0',
          zone: values.zone,
          usersCount: 0,
          fingerprintsCount: 0,
          transactionsCount: 0,
          transferMode: values.transferMode,
          isRegistrationDevice: values.isRegistrationDevice,
          heartbeatInterval: values.heartbeatInterval,
          timezone: values.timezone,
          isPresenceDevice: values.isPresenceDevice,
        };
        setAppareils([...appareils, newAppareil]);
        
        toast.success('Appareil ajouté avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      }
      
      handleCloseModal();
    },
  });

  const handleEdit = (appareil) => {
    setSelectedAppareil(appareil);
    formik.setValues({
      name: appareil.name,
      serialNumber: appareil.serialNumber,
      ipAddress: appareil.ipAddress,
      zone: appareil.zone,
      transferMode: appareil.transferMode,
      isRegistrationDevice: appareil.isRegistrationDevice,
      heartbeatInterval: appareil.heartbeatInterval,
      timezone: appareil.timezone,
      isPresenceDevice: appareil.isPresenceDevice,
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (appareil) => {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer l'appareil "${appareil.name}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedAppareils = appareils.filter(a => a.id !== appareil.id);
        setAppareils(updatedAppareils);
        toast.success('Appareil supprimé avec succès', {
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
    setSelectedAppareil(null);
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
              {appareils.map((appareil) => (
                <tr key={appareil.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appareil.serialNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appareil.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appareil.zone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appareil.ipAddress}</td>
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
                      {isEditing ? "Modifier l'appareil" : "Ajouter un appareil"}
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
                      {/* Nom de l'appareil */}
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Nom de l'appareil *
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
                          placeholder="Saisir le nom de l'appareil"
                        />
                        {formik.touched.name && formik.errors.name && (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.name}
                          </div>
                        )}
                      </div>
          
                      {/* Numéro de série */}
                      <div>
                        <label
                          htmlFor="serialNumber"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Numéro de série *
                        </label>
                        <input
                          type="text"
                          id="serialNumber"
                          {...formik.getFieldProps('serialNumber')}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                            formik.touched.serialNumber && formik.errors.serialNumber
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                          placeholder="Saisir le numéro de série"
                        />
                        {formik.touched.serialNumber && formik.errors.serialNumber && (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.serialNumber}
                          </div>
                        )}
                      </div>
          
                      {/* Adresse IP */}
                      <div>
                        <label
                          htmlFor="ipAddress"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Adresse IP
                        </label>
                        <input
                          type="text"
                          id="ipAddress"
                          {...formik.getFieldProps('ipAddress')}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                            formik.touched.ipAddress && formik.errors.ipAddress
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                          placeholder="0.0.0.0"
                        />
                        {formik.touched.ipAddress && formik.errors.ipAddress && (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.ipAddress}
                          </div>
                        )}
                      </div>
          
                      {/* Zone (liste déroulante) */}
                      <div>
                        <label
                          htmlFor="zone"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Zone *
                        </label>
                        <select
                          id="zone"
                          {...formik.getFieldProps('zone')}
                          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                            formik.touched.zone && formik.errors.zone
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                        >
                          <option value="">Sélectionner une zone</option>
                          {zoneOptions.map((option) => (
                            <option key={option.id} value={option.name}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                        {formik.touched.zone && formik.errors.zone && (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.zone}
                          </div>
                        )}
                      </div>
          
                      {/* Mode de transfert (liste déroulante) */}
                      <div>
                        <label
                          htmlFor="transferMode"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Mode de transfert *
                        </label>
                        <select
                          id="transferMode"
                          {...formik.getFieldProps('transferMode')}
                          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                            formik.touched.transferMode && formik.errors.transferMode
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                        >
                          {transferModeOptions.map((option) => (
                            <option key={option.id} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {formik.touched.transferMode && formik.errors.transferMode && (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.transferMode}
                          </div>
                        )}
                      </div>
          
                      {/* Demander battement de coeur (nombre) */}
                      <div>
                        <label
                          htmlFor="heartbeatInterval"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Demander battement de coeur (seconds) *
                        </label>
                        <input
                          type="number"
                          id="heartbeatInterval"
                          {...formik.getFieldProps('heartbeatInterval')}
                          min="1"
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                            formik.touched.heartbeatInterval && formik.errors.heartbeatInterval
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                        />
                        {formik.touched.heartbeatInterval && formik.errors.heartbeatInterval && (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.heartbeatInterval}
                          </div>
                        )}
                      </div>
          
                      {/* Fuseau horaire (liste déroulante) */}
                      <div>
                        <label
                          htmlFor="timezone"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Fuseau horaire *
                        </label>
                        <select
                          id="timezone"
                          {...formik.getFieldProps('timezone')}
                          className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                            formik.touched.timezone && formik.errors.timezone
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
                        {formik.touched.timezone && formik.errors.timezone && (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.timezone}
                          </div>
                        )}
                      </div>
          
                      {/* Dispositif d'enregistrement (toggle) */}
                      <div className="col-span-1 md:col-span-2 mt-4">
                        <div className="flex items-center">
                          <label htmlFor="isRegistrationDevice" className="inline-flex relative items-center cursor-pointer">
                            <input
                              type="checkbox"
                              id="isRegistrationDevice"
                              checked={formik.values.isRegistrationDevice}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-700">Dispositif d'enregistrement *</span>
                          </label>
                        </div>
                        {formik.touched.isRegistrationDevice && formik.errors.isRegistrationDevice && (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.isRegistrationDevice}
                          </div>
                        )}
                      </div>
          
                      {/* Appareil de présence (toggle) */}
                      <div className="col-span-1 md:col-span-2 mt-2">
                        <div className="flex items-center">
                          <label htmlFor="isPresenceDevice" className="inline-flex relative items-center cursor-pointer">
                            <input
                              type="checkbox"
                              id="isPresenceDevice"
                              checked={formik.values.isPresenceDevice}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-700">Appareil de présence *</span>
                          </label>
                        </div>
                        {formik.touched.isPresenceDevice && formik.errors.isPresenceDevice && (
                          <div className="mt-1 text-sm text-red-600">
                            {formik.errors.isPresenceDevice}
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