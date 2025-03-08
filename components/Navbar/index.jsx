'use client'
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaUser, FaChevronDown, FaChevronUp, FaBars } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border border-b-emerald-600 shadow-lg z-50">
      <div className="flex items-center justify-between h-full px-4">
        {/* Logo et Bouton Toggle */}
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-emerald-600 p-2 hover:border hover:border-emerald-700 rounded-lg"
          >
            <FaBars size={24} />
          </button>
          <Image
            src="/logo.png"
            alt="CheckTime Logo"
            width={120}
            height={40}
            className="ml-4"
          />
        </div>

        {/* Nom de l'entreprise ou Role Admin */}
        <h1 className="text-emerald-600 text-xl font-semibold hidden md:block">
          {user?.role === 'admin' ? 'Admin Panel' : user?.companyName || 'Nom de l\'entreprise'}
        </h1>

        {/* Profil utilisateur */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 text-emerald-600 px-4 py-2 rounded-lg hover:border hover:border-emerald-700"
          >
            <FaUser />
            <span className="hidden md:block">{user?.name || 'Utilisateur'}</span>
            {dropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1">
              <Link
                href="/Change-password"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Changer le mot de passe
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;