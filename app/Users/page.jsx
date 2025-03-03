'use client';

import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog } from '@headlessui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import MainLayout from '@/components/layouts/MainLayout';

// Données de démonstration pour les entreprises
const entreprises = [
  { id: 1, nom: "Entreprise A" },
  { id: 2, nom: "Entreprise B" },
  { id: 3, nom: "Entreprise C" },
  { id: 4, nom: "Entreprise D" },
];

// Données de démonstration pour les utilisateurs
const initialUsers = [
  { id: 1, entrepriseId: 1, username: "user1", email: "user1@entreprisea.com", password: "password123" },
  { id: 2, entrepriseId: 1, username: "user2", email: "user2@entreprisea.com", password: "password123" },
  { id: 3, entrepriseId: 2, username: "user3", email: "user3@entrepriseb.com", password: "password123" },
  { id: 4, entrepriseId: 3, username: "user4", email: "user4@entreprisec.com", password: "password123" },
  { id: 5, entrepriseId: 4, username: "user5", email: "user5@entreprised.com", password: "password123" },
];

// Schéma de validation pour l'ajout d'utilisateur
const addUserSchema = Yup.object().shape({
  entrepriseId: Yup.number()
    .required('L\'entreprise est requise'),
  username: Yup.string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .max(50, 'Le nom d\'utilisateur ne doit pas dépasser 50 caractères')
    .required('Le nom d\'utilisateur est requis'),
  email: Yup.string()
    .email('Adresse email invalide')
    .required('L\'email est requis'),
  password: Yup.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .required('Le mot de passe est requis'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Les mots de passe doivent correspondre')
    .required('La confirmation du mot de passe est requise')
});

// Schéma de validation pour la modification d'utilisateur
const editUserSchema = Yup.object().shape({
  entrepriseId: Yup.number()
    .required('L\'entreprise est requise'),
  username: Yup.string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .max(50, 'Le nom d\'utilisateur ne doit pas dépasser 50 caractères')
    .required('Le nom d\'utilisateur est requis'),
  email: Yup.string()
    .email('Adresse email invalide')
    .required('L\'email est requis'),
  password: Yup.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .nullable(),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Les mots de passe doivent correspondre')
    .nullable()
    .when('password', {
      is: (password) => password && password.length > 0,
      then: (schema) => schema.required('La confirmation du mot de passe est requise'),
      otherwise: (schema) => schema
    })
});

export default function Users() {
  const [users, setUsers] = useState(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (selectedEntrepriseId) {
      const filtered = users.filter(user => user.entrepriseId === parseInt(selectedEntrepriseId));
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [selectedEntrepriseId, users]);

  const formik = useFormik({
    initialValues: {
      entrepriseId: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationSchema: isEditing ? editUserSchema : addUserSchema,
    onSubmit: (values) => {
      if (isEditing) {
        // Modification
        const updatedUsers = users.map(user =>
          user.id === selectedUser.id
            ? { 
                ...user, 
                entrepriseId: parseInt(values.entrepriseId),
                username: values.username,
                email: values.email,
                ...(values.password ? { password: values.password } : {})
              }
            : user
        );
        setUsers(updatedUsers);
        
        toast.success('Utilisateur modifié avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      } else {
        // Ajout
        const newUser = {
          id: users.length + 1,
          entrepriseId: parseInt(values.entrepriseId),
          username: values.username,
          email: values.email,
          password: values.password
        };
        setUsers([...users, newUser]);
        
        toast.success('Utilisateur ajouté avec succès', {
          position: "top-right",
          autoClose: 5000
        });
      }
      
      handleCloseModal();
    },
  });

  const handleEdit = (user) => {
    setSelectedUser(user);
    formik.setValues({
      entrepriseId: user.entrepriseId.toString(),
      username: user.username,
      email: user.email,
      password: '',
      confirmPassword: ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (user) => {
    Swal.fire({
      title: 'Confirmer la suppression',
      text: `Voulez-vous vraiment supprimer l'utilisateur "${user.username}" ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedUsers = users.filter(u => u.id !== user.id);
        setUsers(updatedUsers);
        toast.success('Utilisateur supprimé avec succès', {
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
    setSelectedUser(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom d'utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {selectedEntrepriseId ? (
                filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getEntrepriseName(user.entrepriseId)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      Aucun utilisateur trouvé pour cette entreprise.
                    </td>
                  </tr>
                )
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
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
                        htmlFor="entrepriseId"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Entreprise
                      </label>
                      <select
                        id="entrepriseId"
                        {...formik.getFieldProps('entrepriseId')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.entrepriseId && formik.errors.entrepriseId
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
                      {formik.touched.entrepriseId && formik.errors.entrepriseId && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.entrepriseId}
                        </div>
                      )}
                    </div>

                    {/* Nom d'utilisateur */}
                    <div>
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nom d'utilisateur
                      </label>
                      <input
                        type="text"
                        id="username"
                        {...formik.getFieldProps('username')}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                          formik.touched.username && formik.errors.username
                            ? 'border-red-300'
                            : 'border-gray-300'
                        }`}
                        placeholder="Saisir le nom d'utilisateur"
                      />
                      {formik.touched.username && formik.errors.username && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.username}
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
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

                    {/* Confirmation mot de passe */}
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {isEditing ? "Confirmer le nouveau mot de passe" : "Confirmer le mot de passe"}
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          {...formik.getFieldProps('confirmPassword')}
                          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 ${
                            formik.touched.confirmPassword && formik.errors.confirmPassword
                              ? 'border-red-300'
                              : 'border-gray-300'
                          }`}
                          placeholder={isEditing ? "Laisser vide pour ne pas changer" : "Saisir à nouveau le mot de passe"}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                        </button>
                      </div>
                      {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                        <div className="mt-1 text-sm text-red-600">
                          {formik.errors.confirmPassword}
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