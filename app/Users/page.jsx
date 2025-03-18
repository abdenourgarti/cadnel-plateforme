'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog } from '@headlessui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { FaToggleOn, FaToggleOff, FaEyeSlash, FaEye } from 'react-icons/fa';
import MainLayout from '@/components/layouts/MainLayout';

// Schéma de validation pour l'ajout d'utilisateur
const addUserSchema = Yup.object().shape({
  email: Yup.string()
    .email('Adresse email invalide')
    .required('L\'email est requis'),
  password: Yup.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .required('Le mot de passe est requis'),
  nomcomplet: Yup.string()
    .min(3, 'Le nom complet doit contenir au moins 3 caractères')
    .required('Le nom complet est requis'),
  id_company: Yup.number()
    .required('L\'entreprise est requise'),
});

// Schéma de validation pour la modification d'utilisateur
const editUserSchema = Yup.object().shape({
  email: Yup.string()
    .email('Adresse email invalide')
    .required('L\'email est requis'),
  password: Yup.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .nullable(),
  nomcomplet: Yup.string()
    .min(3, 'Le nom complet doit contenir au moins 3 caractères')
    .required('Le nom complet est requis'),
  id_company: Yup.number()
    .required('L\'entreprise est requise'),
});

const getAuthToken = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user.token;
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // Récupérer les entreprises
  useEffect(() => {
    const fetchEntreprises = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/company', {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        setEntreprises(response.data.data.map(company => ({
          id: company.id_company,
          nom: company.nom
        })));
      } catch (error) {
        console.error('Erreur lors de la récupération des entreprises:', error);
        toast.error('Erreur lors de la récupération des entreprises', {
          position: "top-right",
          autoClose: 5000
        });
      }
    };

    fetchEntreprises();
  }, []);

  // Récupérer les utilisateurs
  const fetchUsers = async (companyId = null) => {
    try {
      setLoading(true);
      const url = companyId ? `http://localhost:5000/api/user/${companyId}` : 'http://localhost:5000/api/user';
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setUsers(response.data.data);
      if (companyId) {
        setFilteredUsers(response.data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      toast.error('Erreur lors de la récupération des utilisateurs', {
        position: "top-right",
        autoClose: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(selectedEntrepriseId || null);
  }, [selectedEntrepriseId]);
  
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      nomcomplet: '',
      id_company: ''
    },
    validationSchema: isEditing ? editUserSchema : addUserSchema,
    onSubmit: async (values) => {
      try {
        const selectedEntreprise = entreprises.find(e => e.id == values.id_company);
        console.log('entreprise', selectedEntreprise)
          if (!selectedEntreprise) {
            toast.error('Entreprise sélectionnée invalide', {
              position: "top-right",
              autoClose: 5000
            });
            return; // Arrêter l'exécution si l'entreprise n'est pas trouvée
          }
        if (isEditing) {
          
          const updatedUser = {
            email: values.email,
            nomcomplet: values.nomcomplet,
            id_company: values.id_company,
            nomcompany: selectedEntreprise.nom,
            ...(values.password ? { password: values.password } : {})
          };
          
          await axios.put(`http://localhost:5000/api/user/${selectedUser.id_user}`, updatedUser, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          fetchUsers(selectedEntrepriseId);
          toast.success('Utilisateur modifié avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        } else {
          const newUser = {
            email: values.email,
            password: values.password,
            nomcomplet: values.nomcomplet,
            id_company: values.id_company,
            nomcompany: selectedEntreprise.nom,
          };
          await axios.post('http://localhost:5000/api/user/simple', newUser, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          fetchUsers(selectedEntrepriseId);
          toast.success('Utilisateur ajouté avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        }
        handleCloseModal();
      } catch (error) {
        console.error('Erreur lors de l\'opération:', error);
        toast.error(`Erreur: ${error.response?.data?.message || 'Une erreur est survenue'}`, {
          position: "top-right",
          autoClose: 5000
        });
      }
    },
  });

  const handleEdit = (user) => {
    setSelectedUser(user);
    formik.setValues({
      email: user.email,
      nomcomplet: user.nomcomplet,
      id_company: user.id_company,
      password: '',
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (user) => {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer l'utilisateur "${user.nomcomplet}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:5000/api/user/${user.id_user}`, {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
          });
          fetchUsers(selectedEntrepriseId);
          toast.success('Utilisateur supprimé avec succès', {
            position: "top-right",
            autoClose: 5000
          });
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
          toast.error(`Erreur: ${error.response?.data?.message || 'Une erreur est survenue lors de la suppression'}`, {
            position: "top-right",
            autoClose: 5000
          });
        }
      }
    });
  };

  const handleToggleActivation = async (user) => {
    try {
      await axios.put(`http://localhost:5000/api/user/enable/${user.id_user}`, { enable: !user.enabled }, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      fetchUsers(selectedEntrepriseId);
      toast.success(`Utilisateur ${user.enabled ? 'désactivé' : 'activé'} avec succès`, {
        position: "top-right",
        autoClose: 5000
      });
    } catch (error) {
      console.error('Erreur lors de la modification de l\'état:', error);
      toast.error(`Erreur: ${error.response?.data?.message || 'Une erreur est survenue'}`, {
        position: "top-right",
        autoClose: 5000
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    formik.resetForm();
    setSelectedUser(null);
    setShowPassword(false);
  };

  const getEntrepriseName = (id) => {
    const entreprise = entreprises.find(ent => ent.id === id);
    return entreprise ? entreprise.nom : 'Non défini';
  };

  return (
    <MainLayout>
      <div className="p-6">
        <ToastContainer />
        
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Utilisateurs</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Ajouter
          </button>
        </div>

        {/* Filtre par entreprise */}
        <div className="mb-6">
          <label 
            htmlFor="entrepriseFilter" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Filtrer par entreprise
          </label>
          <select
            id="entrepriseFilter"
            value={selectedEntrepriseId}
            onChange={(e) => setSelectedEntrepriseId(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">Sélectionner une entreprise</option>
            {entreprises.map((entreprise) => (
              <option key={entreprise.id} value={entreprise.id}>
                {entreprise.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom complet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {selectedEntrepriseId ? (
                filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id_user} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id_user}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getEntrepriseName(user.id_company)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.nomcomplet}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.enabled ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleToggleActivation(user)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          {!user.enabled ? <FaToggleOff className="w-5 h-5" /> : <FaToggleOn className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key="no-data">
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      Aucun utilisateur trouvé pour cette entreprise.
                    </td>
                  </tr>
                )
              ) : (
                <tr key="choose-data">
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    Veuillez sélectionner une entreprise pour afficher les utilisateurs.
                  </td>
                </tr>
              )}
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
                    {isEditing ? "Modifier un utilisateur" : "Ajouter un utilisateur"}
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
                    {/* Entreprise */}
                    <div>
                      <label
                        htmlFor="id_company"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Entreprise
                      </label>
                      <select
                        id="id_company"
                        {...formik.getFieldProps('id_company')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.id_company && formik.errors.id_company
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="">Sélectionner une entreprise</option>
                        {entreprises.map((entreprise) => (
                          <option key={entreprise.id} value={entreprise.id}>
                            {entreprise.nom}
                          </option>
                        ))}
                      </select>
                      {formik.touched.id_company && formik.errors.id_company && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.id_company}
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >F
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        {...formik.getFieldProps('email')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.email && formik.errors.email
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        placeholder="Saisir l'email"
                      />
                      {formik.touched.email && formik.errors.email && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.email}
                        </div>
                      )}
                    </div>

                    {/* Nom complet */}
                    <div>
                      <label
                        htmlFor="nomcomplet"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nom complet
                      </label>
                      <input
                        type="text"
                        id="nomcomplet"
                        {...formik.getFieldProps('nomcomplet')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.nomcomplet && formik.errors.nomcomplet
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        placeholder="Saisir le nom complet"
                      />
                      {formik.touched.nomcomplet && formik.errors.nomcomplet && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.nomcomplet}
                        </div>
                      )}
                    </div>

                    {/* Mot de passe */}
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {isEditing ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          {...formik.getFieldProps('password')}
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                            formik.touched.password && formik.errors.password
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                          placeholder={isEditing ? "Laisser vide pour ne pas changer" : "Saisir le mot de passe"}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                        </button>
                      </div>
                      {formik.touched.password && formik.errors.password && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.password}
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