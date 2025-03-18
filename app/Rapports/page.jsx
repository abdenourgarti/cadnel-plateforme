'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MagnifyingGlassIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import MainLayout from '@/components/layouts/MainLayout';

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token;
  }
  return null;
};

const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const user = JSON.parse(localStorage.getItem('user'));
    return user;
  }
  return { role: '', companyId: '' }; // Valeur par défaut
};

const rechercheSchema = Yup.object().shape({
  entrepriseId: Yup.number().nullable(),
  departementId: Yup.number().nullable(),
  dateDebut: Yup.date().required('La date de début est requise'),
  dateFin: Yup.date()
    .required('La date de fin est requise')
    .min(Yup.ref('dateDebut'), 'La date de fin doit être postérieure à la date de début'),
});

export default function Rapports() {
  const [rapportData, setRapportData] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentUser, setCurrentUser] = useState({ role: '', companyId: '' });

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = getCurrentUser();
      setCurrentUser(user);
    }
  }, []);

  // D'abord, récupérer les informations de l'utilisateur
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = getCurrentUser();
      setCurrentUser(user);
    }
  }, []);

  // Ensuite, charger les données appropriées en fonction du rôle de l'utilisateur
  useEffect(() => {
    // S'assurer que currentUser est chargé
    if (!currentUser.role) return;
    
    if (isAdmin) {
      const fetchEntreprises = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/company', {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          setEntreprises(response.data.data);
        } catch (error) {
          console.error('Erreur lors de la récupération des entreprises:', error);
          toast.error('Erreur lors de la récupération des entreprises', {
            position: "top-right",
            autoClose: 5000
          });
        }
      };

      fetchEntreprises();
    } else if (currentUser.companyId) {
      // Seulement appeler fetchDepartements si companyId existe
      fetchDepartements(currentUser.companyId);
    }
  }, [currentUser, isAdmin]);

  const fetchDepartements = async (companyId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/departement/${companyId}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setDepartements(response.data.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des départements:', error);
      toast.error('Erreur lors de la récupération des départements', {
        position: "top-right",
        autoClose: 5000
      });
    }
  };

  const rechercheFormik = useFormik({
    initialValues: {
      entrepriseId: '',
      departementId: '',
      dateDebut: '',
      dateFin: ''
    },
    validationSchema: rechercheSchema,
    onSubmit: async (values) => {
      try {
        const id_departement = values.departementId;
        console.log('id_dep',id_departement);
        const payload = {
          datedebut: values.dateDebut,
          datefin: values.dateFin
        };

        const response = await axios({
          method: 'post',
          url: `http://localhost:5000/api/rapport/${id_departement}`,
          data: payload,  // Ceci sera le corps de la requête
          headers: { 
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        });
        // const response = await axios.get(`http://localhost:5000/api/rapport/${id_departement}`, payload, {
        //   headers: { Authorization: `Bearer ${getAuthToken()}` }
        // });

        setRapportData(response.data.data);
        setHasSearched(true);

        toast.success('Rapport généré avec succès', {
          position: "top-right",
          autoClose: 3000
        });
      } catch (error) {
        console.error('Erreur lors de la génération du rapport:', error);
        toast.error('Erreur lors de la génération du rapport', {
          position: "top-right",
          autoClose: 5000
        });
      }
    }
  });

  const resetFilters = () => {
    rechercheFormik.resetForm();
    setRapportData([]);
    setHasSearched(false);
    isAdmin ?? setDepartements([]);

    toast.info('Filtres réinitialisés', {
      position: "top-right",
      autoClose: 3000
    });
  };

  const handleExport = async () => {
    try {
      const id_departement = rechercheFormik.values.departementId;
      const payload = {
        datedebut: rechercheFormik.values.dateDebut,
        datefin: rechercheFormik.values.dateFin
      };

      const response = await axios.post(`http://localhost:5000/api/rapport/${id_departement}/export`, payload, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'stats.pdf');
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success('Exportation réussie', {
        position: "top-right",
        autoClose: 3000
      });
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      toast.error('Erreur lors de l\'exportation', {
        position: "top-right",
        autoClose: 5000
      });
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Rapport Employés
          </h1>
          
          {hasSearched && rapportData.length > 0 && (
            <button
              onClick={handleExport}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Sélection d'entreprise (uniquement pour les admins) */}
              {isAdmin && (
                <div>
                  <label htmlFor="entrepriseId" className="block text-sm font-medium text-gray-700 mb-1">
                    Entreprise
                  </label>
                  <select
                    id="entrepriseId"
                    {...rechercheFormik.getFieldProps('entrepriseId')}
                    onChange={(e) => {
                      rechercheFormik.setFieldValue('entrepriseId', e.target.value);
                      if (e.target.value) {
                        fetchDepartements(e.target.value);
                      } else {
                        setDepartements([]);
                      }
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Sélectionnez une entreprise</option>
                    {entreprises.map((entreprise) => (
                      <option key={entreprise.id_company} value={entreprise.id_company}>
                        {entreprise.nom}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sélection de département */}
              <div>
                <label htmlFor="departementId" className="block text-sm font-medium text-gray-700 mb-1">
                  Département
                </label>
                <select
                  id="departementId"
                  {...rechercheFormik.getFieldProps('departementId')}
                  disabled={!rechercheFormik.values.entrepriseId && isAdmin}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Tous les départements</option>
                  {departements.map((departement) => (
                    <option key={departement.id_departement} value={departement.id_departement}>
                      {departement.nom}
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
                    <tr key={rapport.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {index + 1}
                      </td>
                      {console.log('rapport',rapport)}
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {rapport.employe}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rapport.departement}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {rapport.presences.total}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {rapport.presences.a_l_heure}
                      </td>
                      {/* Retards */}
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {rapport.retards.total}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {rapport.retards.justifies}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center font-medium" style={{ color: rapport.nbRetardNonJustifie > 0 ? 'red' : 'inherit' }}>
                        {rapport.retards.non_justifies}
                      </td>
                      {/* Absences */}
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {rapport.absences.total}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {rapport.absences.justifies}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center font-medium" style={{ color: rapport.nbAbsenceNonJustifiee > 0 ? 'red' : 'inherit' }}>
                        {rapport.absences.non_justifies}
                      </td>
                      {/* Congés */}
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {rapport.conges.total}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key="no-data">
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