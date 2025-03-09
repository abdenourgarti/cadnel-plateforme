'use client';

import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog } from '@headlessui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import MainLayout from '@/components/layouts/MainLayout';
import { Switch } from '@headlessui/react';

// Options pour la fréquence d'envoi d'emails
const frequenceOptions = [
  { id: 1, value: "Journalier", label: "Journalier" },
  { id: 2, value: "Hebdomadaire", label: "Hebdomadaire" },
  { id: 3, value: "Mensuel", label: "Mensuel" },
];

// Types de rapports disponibles
const typesRapports = [
  { id: 1, nom: "Rapport d'absence" },
  { id: 2, nom: "Rapport de retard" },
  { id: 3, nom: "Rapport de congé" },
  { id: 4, nom: "Rapport des employés" },
  { id: 5, nom: "État de ponctualité" },
];

// Paramètres par défaut
const parametresDefaut = {
  frequenceEmail: "Mensuel",
  rapports: typesRapports.map(rapport => ({
    id: rapport.id,
    nom: rapport.nom,
    actif: true
  }))
};

// Schéma de validation
const parametresSchema = Yup.object().shape({
  frequenceEmail: Yup.string()
    .required('La fréquence d\'envoi est requise'),
  rapports: Yup.array().of(
    Yup.object().shape({
      id: Yup.number().required(),
      nom: Yup.string().required(),
      actif: Yup.boolean().required()
    })
  )
});

export default function Settings() {
  const [parametres, setParametres] = useState(parametresDefaut);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialisation du formulaire
  const formik = useFormik({
    initialValues: parametres,
    validationSchema: parametresSchema,
    onSubmit: (values) => {
      // Mise à jour des paramètres
      setParametres(values);
      
      // Affichage d'une notification
      toast.success('Paramètres mis à jour avec succès', {
        position: "top-right",
        autoClose: 5000
      });
      
      // Fermeture du mode édition
      setIsEditing(false);
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    formik.resetForm({ values: parametres });
    setIsEditing(false);
  };

  const handleRapportChange = (index, checked) => {
    const updatedRapports = [...formik.values.rapports];
    updatedRapports[index] = {
      ...updatedRapports[index],
      actif: checked
    };
    formik.setFieldValue('rapports', updatedRapports);
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <PencilIcon className="w-5 h-5 mr-2" />
              Modifier
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 mr-2" />
                Annuler
              </button>
              <button
                onClick={formik.handleSubmit}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          )}
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={formik.handleSubmit}>
            {/* Section Envoi d'emails */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Fréquence d'envoi d'emails</h2>
              <div className="max-w-md">
                <label
                  htmlFor="frequenceEmail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Envoyer les rapports
                </label>
                <select
                  id="frequenceEmail"
                  {...formik.getFieldProps('frequenceEmail')}
                  disabled={!isEditing}
                  className={`block w-full pl-3 pr-10 py-2 text-base border rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                    formik.touched.frequenceEmail && formik.errors.frequenceEmail
                      ? 'border-red-300'
                      : 'border-gray-300'
                  } ${!isEditing ? 'bg-gray-50' : ''}`}
                >
                  {frequenceOptions.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formik.touched.frequenceEmail && formik.errors.frequenceEmail && (
                  <div className="mt-1 text-sm text-red-600">
                    {formik.errors.frequenceEmail}
                  </div>
                )}
              </div>
            </div>

            {/* Section Rapports */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Rapports à envoyer</h2>
              
              <div className="space-y-4">
                {formik.values.rapports.map((rapport, index) => (
                  <div key={rapport.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{rapport.nom}</span>
                    <Switch
                      checked={rapport.actif}
                      onChange={(checked) => handleRapportChange(index, checked)}
                      disabled={!isEditing}
                      className={`${
                        rapport.actif ? 'bg-emerald-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full ${
                        !isEditing ? 'opacity-80' : ''
                      }`}
                    >
                      <span className="sr-only">Activer/désactiver {rapport.nom}</span>
                      <span
                        className={`${
                          rapport.actif ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                      />
                    </Switch>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
        
        {/* Informations supplémentaires */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Informations sur les rapports</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Les rapports seront envoyés automatiquement selon la fréquence définie.
                  Seuls les rapports activés seront inclus dans l'envoi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}