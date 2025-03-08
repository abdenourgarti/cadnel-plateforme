'use client';

import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MagnifyingGlassIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import MainLayout from '@/components/layouts/MainLayout';

// Données fictives pour les employés
const employes = [
  { id: 1, nomPrenom: "Jean Dupont" },
  { id: 2, nomPrenom: "Marie Martin" },
  { id: 3, nomPrenom: "Paul Durand" },
  { id: 4, nomPrenom: "Sophie Leroy" },
  { id: 5, nomPrenom: "Thomas Bernard" },
];

// Données fictives pour la démo
const generateMockData = () => [
  { 
    id: 1, 
    employeId: 1, 
    employeNom: "Jean Dupont", 
    presence: 19, 
    absence: 1, 
    tauxPresence: 95, 
    aLHeure: 17, 
    retard: 2, 
    tauxPonctualite: 89.5
  },
  { 
    id: 2, 
    employeId: 2, 
    employeNom: "Marie Martin", 
    presence: 20, 
    absence: 0, 
    tauxPresence: 100, 
    aLHeure: 20, 
    retard: 0, 
    tauxPonctualite: 100
  },
  { 
    id: 3, 
    employeId: 3, 
    employeNom: "Paul Durand", 
    presence: 15, 
    absence: 5, 
    tauxPresence: 75, 
    aLHeure: 12, 
    retard: 3, 
    tauxPonctualite: 80
  },
  { 
    id: 4, 
    employeId: 4, 
    employeNom: "Sophie Leroy", 
    presence: 17, 
    absence: 3, 
    tauxPresence: 85, 
    aLHeure: 15, 
    retard: 2, 
    tauxPonctualite: 88.2
  },
  { 
    id: 5, 
    employeId: 5, 
    employeNom: "Thomas Bernard", 
    presence: 7, 
    absence: 13, 
    tauxPresence: 35, 
    aLHeure: 7, 
    retard: 0, 
    tauxPonctualite: 100
  },
];

// Schéma de validation pour le formulaire de recherche
const rechercheSchema = Yup.object().shape({
  employeId: Yup.number().nullable(),
  dateDebut: Yup.date()
    .required('La date de début est requise'),
  dateFin: Yup.date()
    .required('La date de fin est requise')
    .min(
      Yup.ref('dateDebut'),
      'La date de fin doit être postérieure à la date de début'
    )
});

export default function EtatPonctualite() {
  const [statsData, setStatsData] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [periodeLabel, setPeriodeLabel] = useState("");

  // Formulaire pour la recherche
  const rechercheFormik = useFormik({
    initialValues: {
      employeId: '',
      dateDebut: '',
      dateFin: ''
    },
    validationSchema: rechercheSchema,
    onSubmit: (values) => {
      // Simulation de récupération des données
      let data = generateMockData();
      
      // Appliquer le filtre par employé si sélectionné
      if (values.employeId) {
        data = data.filter(item => item.employeId === parseInt(values.employeId));
      }
      
      setStatsData(data);
      setHasSearched(true);
      
      // Formater les dates pour l'affichage
      const dateDebut = new Date(values.dateDebut).toLocaleDateString('fr-FR');
      const dateFin = new Date(values.dateFin).toLocaleDateString('fr-FR');
      setPeriodeLabel(`${dateDebut} au ${dateFin}`);
      
      toast.success('Données récupérées avec succès', {
        position: "top-right",
        autoClose: 3000
      });
    }
  });

  // Réinitialiser les filtres
  const resetFilters = () => {
    rechercheFormik.resetForm();
    setStatsData([]);
    setHasSearched(false);
    setPeriodeLabel("");
    
    toast.info('Filtres réinitialisés', {
      position: "top-right",
      autoClose: 3000
    });
  };

  // Fonction pour gérer l'exportation en PDF
  const handleExportPDF = () => {
    toast.info('Génération du PDF en cours...', {
      position: "top-right",
      autoClose: 3000
    });
    
    // Ici, vous implémenteriez l'appel à votre API pour générer le PDF
    // Pour l'instant, c'est juste une simulation
    setTimeout(() => {
      toast.success('PDF généré avec succès', {
        position: "top-right",
        autoClose: 3000
      });
    }, 1500);
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            État de Ponctualité {periodeLabel ? `- Période: ${periodeLabel}` : ""}
          </h1>
          
          {hasSearched && (
            <button
              onClick={handleExportPDF}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Exporter PDF
            </button>
          )}
        </div>

        {/* Formulaire de recherche */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Recherche par période</h2>
          
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
                  Date de début <span className="text-red-500">*</span>
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
                  Date de fin <span className="text-red-500">*</span>
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

        {/* Tableau des états de ponctualité */}
        {hasSearched && (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° d'ordre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom et Prénoms
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="4">
                    Présence au Poste
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="3">
                    Ponctualité
                  </th>
                </tr>
                <tr>
                  <th className="px-6 py-3"></th>
                  <th className="px-6 py-3"></th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Présence
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Absence
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taux de présence
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    À l'heure
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Retard
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taux de ponctualité
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {statsData.length > 0 ? (
                  statsData.map((stat, index) => (
                    <tr key={stat.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stat.employeNom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {stat.presence}/20
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {stat.absence}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {stat.tauxPresence}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {stat.aLHeure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {stat.retard}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {stat.tauxPonctualite}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      Aucune donnée trouvée pour cette période
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}