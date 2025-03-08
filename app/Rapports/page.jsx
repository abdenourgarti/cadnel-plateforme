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
  { id: 1, nomPrenom: "Jean Dupont", departement: "Informatique" },
  { id: 2, nomPrenom: "Marie Martin", departement: "Informatique" },
  { id: 3, nomPrenom: "Paul Durand", departement: "Gestion" },
  { id: 4, nomPrenom: "Sophie Leroy", departement: "Finances" },
  { id: 5, nomPrenom: "Thomas Bernard", departement: "RH" },
];

// Données fictives pour la démo
const generateMockData = () => [
  { 
    id: 1, 
    employeId: 1, 
    employeNom: "Jean Dupont",
    departement: "Informatique",
    nbPresence: 19, 
    nbALHeure: 17, 
    nbRetard: 2,
    nbRetardJustifie: 2,
    nbRetardNonJustifie: 0,
    nbAbsence: 1,
    nbAbsenceJustifiee: 1,
    nbAbsenceNonJustifiee: 0,
    nbConge: 0
  },
  { 
    id: 2, 
    employeId: 2, 
    employeNom: "Marie Martin",
    departement: "Informatique",
    nbPresence: 18, 
    nbALHeure: 16, 
    nbRetard: 2,
    nbRetardJustifie: 1,
    nbRetardNonJustifie: 1,
    nbAbsence: 0,
    nbAbsenceJustifiee: 0,
    nbAbsenceNonJustifiee: 0,
    nbConge: 2
  },
  { 
    id: 3, 
    employeId: 3, 
    employeNom: "Paul Durand",
    departement: "Gestion",
    nbPresence: 15, 
    nbALHeure: 12, 
    nbRetard: 3,
    nbRetardJustifie: 1,
    nbRetardNonJustifie: 2,
    nbAbsence: 3,
    nbAbsenceJustifiee: 2,
    nbAbsenceNonJustifiee: 1,
    nbConge: 2
  },
  { 
    id: 4, 
    employeId: 4, 
    employeNom: "Sophie Leroy",
    departement: "Finances",
    nbPresence: 17, 
    nbALHeure: 15, 
    nbRetard: 2,
    nbRetardJustifie: 2,
    nbRetardNonJustifie: 0,
    nbAbsence: 1,
    nbAbsenceJustifiee: 1,
    nbAbsenceNonJustifiee: 0,
    nbConge: 2
  },
  { 
    id: 5, 
    employeId: 5, 
    employeNom: "Thomas Bernard",
    departement: "RH",
    nbPresence: 7, 
    nbALHeure: 7, 
    nbRetard: 0,
    nbRetardJustifie: 0,
    nbRetardNonJustifie: 0,
    nbAbsence: 3,
    nbAbsenceJustifiee: 0,
    nbAbsenceNonJustifiee: 3,
    nbConge: 10
  },
];

// Départements pour le filtre
const departements = [
  "Informatique",
  "Gestion",
  "Finances",
  "RH"
];

// Schéma de validation pour le formulaire de recherche
const rechercheSchema = Yup.object().shape({
  departement: Yup.string().nullable(),
  dateDebut: Yup.date()
    .required('La date de début est requise'),
  dateFin: Yup.date()
    .required('La date de fin est requise')
    .min(
      Yup.ref('dateDebut'),
      'La date de fin doit être postérieure à la date de début'
    )
});

export default function RapportEmployes() {
  const [rapportData, setRapportData] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [periodeLabel, setPeriodeLabel] = useState("");

  // Formulaire pour la recherche
  const rechercheFormik = useFormik({
    initialValues: {
      departement: '',
      dateDebut: '',
      dateFin: ''
    },
    validationSchema: rechercheSchema,
    onSubmit: (values) => {
      // Simulation de récupération des données
      let data = generateMockData();
      
      // Appliquer le filtre par département si sélectionné
      if (values.departement) {
        data = data.filter(item => item.departement === values.departement);
      }
      
      setRapportData(data);
      setHasSearched(true);
      
      // Formater les dates pour l'affichage
      const dateDebut = new Date(values.dateDebut).toLocaleDateString('fr-FR');
      const dateFin = new Date(values.dateFin).toLocaleDateString('fr-FR');
      setPeriodeLabel(`${dateDebut} au ${dateFin}`);
      
      toast.success('Rapport généré avec succès', {
        position: "top-right",
        autoClose: 3000
      });
    }
  });

  // Réinitialiser les filtres
  const resetFilters = () => {
    rechercheFormik.resetForm();
    setRapportData([]);
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
            Rapport Employés {periodeLabel ? `- Période: ${periodeLabel}` : ""}
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
              {/* Sélection de département */}
              <div>
                <label htmlFor="departement" className="block text-sm font-medium text-gray-700 mb-1">
                  Département
                </label>
                <select
                  id="departement"
                  {...rechercheFormik.getFieldProps('departement')}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Tous les départements</option>
                  {departements.map((departement) => (
                    <option key={departement} value={departement}>
                      {departement}
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
                Générer le rapport
              </button>
            </div>
          </form>
        </div>

        {/* Tableau du rapport */}
        {hasSearched && (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N°
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employé
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Département
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Présences
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    À l'heure
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="3">
                    Retards
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan="3">
                    Absences
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Congés
                  </th>
                </tr>
                <tr>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2"></th>
                  {/* Sous-entêtes pour Retards */}
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Justifiés
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Non justifiés
                  </th>
                  {/* Sous-entêtes pour Absences */}
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Justifiées
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Non justifiées
                  </th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rapportData.length > 0 ? (
                  rapportData.map((rapport, index) => (
                    <tr key={rapport.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {index + 1}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {rapport.employeNom}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rapport.departement}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {rapport.nbPresence}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {rapport.nbALHeure}
                      </td>
                      {/* Retards */}
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {rapport.nbRetard}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {rapport.nbRetardJustifie}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center font-medium" style={{ color: rapport.nbRetardNonJustifie > 0 ? 'red' : 'inherit' }}>
                        {rapport.nbRetardNonJustifie}
                      </td>
                      {/* Absences */}
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {rapport.nbAbsence}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {rapport.nbAbsenceJustifiee}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center font-medium" style={{ color: rapport.nbAbsenceNonJustifiee > 0 ? 'red' : 'inherit' }}>
                        {rapport.nbAbsenceNonJustifiee}
                      </td>
                      {/* Congés */}
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {rapport.nbConge}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
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