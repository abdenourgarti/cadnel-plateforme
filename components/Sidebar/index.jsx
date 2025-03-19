'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaCog, FaUsers, FaCalendarAlt, FaClipboardList,
  FaChartBar, FaChevronDown, FaChevronUp, FaBuilding
} from 'react-icons/fa';
import { MdSpaceDashboard } from "react-icons/md";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [openSections, setOpenSections] = useState([]);
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuSections, setMenuSections] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  // Fonction sécurisée pour fermer la sidebar
  const closeSidebar = () => {
    if (typeof setIsOpen === 'function') {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    // Vérifier si l'utilisateur est admin
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.role) {
        setIsAdmin(user.role === 'admin');
        
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }

    // Fonction pour vérifier la taille de l'écran
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Fermer automatiquement si on est sur mobile
      if (mobile) {
        closeSidebar();
      }
    };

    // Vérifier la taille initiale
    checkScreenSize();
    
    // Ajouter l'écouteur d'événement pour les changements de taille
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Fermer le sidebar lors des changements de route sur mobile
  useEffect(() => {
    if (isMobile) {
      closeSidebar();
    }
  }, [pathname, isMobile]);

  useEffect(() => {
    // Définir les sections du menu en fonction du rôle
    const sections = [
      {
        title: "Tableau de bord",
        icon: MdSpaceDashboard,
        path: "/Dashboard"
      },
      {
        title: "Gestion Entreprise",
        icon: FaBuilding,
        subMenu: [
          ...(isAdmin ? [
            { title: 'Entreprise', path: "/Companies"},
            { title: 'Utilisateurs', path: "/Users"},
          ] : []),
          { title: "Département", path: "/Departements" },
          { title: "Zone", path: "/Zones" },
          { title: "Postes", path: "/Postes" },
          { title: "Appareil", path: "/Appareils" }
        ]
      },
      {
        title: "Gestion des employés",
        icon: FaUsers,
        path: "/Employes"
      },
      // {
      //   title: "Présences en temps réel",
      //   icon: FaClipboardList,
      //   path: "/presences-temps-reel"
      // },
      {
        title: "Gestion des Plannings",
        icon: FaCalendarAlt,
        path: "/Planning"
      },
      {
        title: "Gestion des autorisations",
        icon: FaClipboardList,
        subMenu: [
          { title: "Absence", path: "/Absence" },
          { title: "Retard", path: "/Retard" },
          { title: "Congé", path: "/Conge" },
        ]
      },
      {
        title: "Rapports",
        icon: FaChartBar,
        subMenu: [
          { title: "Point des retards et absences", path: "/Rapports" },
          { title: "État de ponctualité", path: "/Etat-ponctualite" },
        ]
      },
      {
        title: "Paramètres",
        icon: FaCog,
        path: "/Settings"
      },
    ];

    // Filtrer les sections qui ont un sous-menu vide
    const filteredSections = sections.map(section => {
      if (section.subMenu) {
        return {
          ...section,
          subMenu: section.subMenu.filter(item => item)
        };
      }
      return section;
    }).filter(section => !section.subMenu || section.subMenu.length > 0);

    setMenuSections(filteredSections);
  }, [isAdmin]);

  useEffect(() => {
    // Ouvrir automatiquement la section parent de la page actuelle
    const currentSection = menuSections.find(section => 
      section.subMenu?.some(item => item.path === pathname)
    );
    
    if (currentSection && !openSections.includes(currentSection.title)) {
      setOpenSections(prev => [...prev, currentSection.title]);
    }
  }, [pathname, menuSections, openSections]);

  const toggleSection = (title) => {
    setOpenSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  // Fermer le sidebar quand on clique sur un lien sur les petits écrans
  const handleLinkClick = () => {
    if (isMobile) {
      closeSidebar();
    }
  };

  return (
    <>
      {/* Overlay pour fermer le sidebar sur mobile quand il est ouvert */}
      {isOpen && typeof setIsOpen === 'function' && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => closeSidebar()}
        />
      )}
      
      <div
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-emerald-600 transition-transform duration-300 ease-in-out transform z-20 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } overflow-y-auto`}
      >
        <div className="py-4">
          {menuSections.map((section) => (
            <div key={section.title} className="px-4 py-2">
              {section.subMenu ? (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between text-white hover:bg-emerald-700 rounded-lg p-2"
                >
                  <div className="flex items-center space-x-2">
                    <section.icon className="w-5 h-5" />
                    <span>{section.title}</span>
                  </div>
                  {openSections.includes(section.title) ? (
                    <FaChevronUp className="w-4 h-4" />
                  ) : (
                    <FaChevronDown className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <Link
                  href={section.path || '#'}
                  className={`flex items-center space-x-2 text-white hover:bg-emerald-700 rounded-lg p-2 ${
                    pathname === section.path ? 'bg-emerald-700' : ''
                  }`}
                  onClick={handleLinkClick}
                >
                  <section.icon className="w-5 h-5" />
                  <span>{section.title}</span>
                </Link>
              )}

              {/* Sous-menu */}
              {section.subMenu && openSections.includes(section.title) && (
                <div className="ml-4 mt-2 space-y-2">
                  {section.subMenu.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`block text-white hover:bg-emerald-700 rounded-lg p-2 ${
                        pathname === item.path ? 'bg-emerald-700' : ''
                      }`}
                      onClick={handleLinkClick}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;