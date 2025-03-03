'use client'
import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FaEye, FaEyeSlash, FaLock, FaKey } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ResetPasswordPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const validationSchema = Yup.object({
    code: Yup.string()
      .required('Le code est requis')
      .min(6, 'Le code doit contenir au moins 6 caractères'),
    password: Yup.string()
      .required('Le mot de passe est requis')
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: Yup.string()
      .required('Veuillez confirmer votre mot de passe')
      .oneOf([Yup.ref('password')], 'Les mots de passe ne correspondent pas'),
  });

  const formik = useFormik({
    initialValues: {
      code: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: (values) => {
      // Ici, vous implémenteriez la logique de réinitialisation du mot de passe
      router.push('/');
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Demi-cercle supérieur droit */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-full transform translate-x-1/2 -translate-y-1/2 opacity-20"></div>
      
      {/* Demi-cercle inférieur gauche */}
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-full transform -translate-x-1/2 translate-y-1/2 opacity-20"></div>

      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">
        {/* Section gauche - Formulaire */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="mb-12">
            <div className="flex justify-center mb-8">
              <Image
                src="/logo.png"
                alt="Check Time Logo"
                width={280}
                height={100}
                className="h-20 w-auto"
              />
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Réinitialiser le mot de passe</h2>
            <p className="text-center text-gray-600">Entrez le code reçu et votre nouveau mot de passe</p>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Code field */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <FaKey className="h-5 w-5 text-emerald-500" />
                  </div>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="Code de vérification"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-gray-50"
                    {...formik.getFieldProps('code')}
                  />
                </div>
                {formik.touched.code && formik.errors.code && (
                  <div className="text-red-500 text-sm mt-1 ml-2">{formik.errors.code}</div>
                )}
              </div>

              {/* Password field */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <FaLock className="h-5 w-5 text-emerald-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nouveau mot de passe"
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-gray-50"
                    {...formik.getFieldProps('password')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <div className="text-red-500 text-sm mt-1 ml-2">{formik.errors.password}</div>
                )}
              </div>

              {/* Confirm Password field */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <FaLock className="h-5 w-5 text-emerald-500" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirmer le mot de passe"
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-gray-50"
                    {...formik.getFieldProps('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <div className="text-red-500 text-sm mt-1 ml-2">{formik.errors.confirmPassword}</div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02] shadow-lg"
            >
              Réinitialiser le mot de passe
            </button>

            <div className="text-center mt-6">
              <Link
                href="/"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Retour à la connexion
              </Link>
            </div>
          </form>
        </div>

        {/* Section droite - Décoration */}
        <div className="hidden md:block w-1/2 bg-gradient-to-br from-emerald-600 to-emerald-400 p-12">
          <div className="h-full flex flex-col justify-center items-center text-white space-y-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Check Time</h1>
              <p className="text-lg opacity-90">
                Gérez efficacement vos ressources humaines et obtenez des rapports personnalisables
              </p>
            </div>
            <div className="w-full max-w-md">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg">
                <p className="text-white/90 italic">
                  "Une solution complète pour optimiser la gestion de vos ressources humaines et améliorer la productivité de votre entreprise."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;