'use client'
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaCog, FaUsers, FaCalendarAlt, FaClipboardList,
  FaChartBar, FaChevronDown, FaChevronUp, 
} from 'react-icons/fa';
import { MdSpaceDashboard } from "react-icons/md";

const menuSections = [
  {
    title: "Tableau de bord",
    icon: MdSpaceDashboard,
    path: "/Dashboard"
  },
  {
    title: "Gestion Fichiers",
    icon: FaCog,
    subMenu: [
      { title: "Département", path: "/Departements" },
      { title: "Zone", path: "/fichiers/zone" },
      { title: "Postes", path: "/fichiers/postes" },
      { title: "Appareil", path: "/fichiers/appareil" }
    ]
  },
  {
    title: "Gestion des employés",
    icon: FaUsers,
    path: "/employes"
  },
  {
    title: "Présences en temps réel",
    icon: FaClipboardList,
    path: "/presences-temps-reel"
  },
  {
    title: "Gestion des Plannings",
    icon: FaCalendarAlt,
    subMenu: [
      { title: "Gestion des horaires", path: "/plannings/horaires" },
      { title: "Programme des horaires", path: "/plannings/programme" },
    ]
  },
  {
    title: "Gestion des autorisations",
    icon: FaClipboardList,
    subMenu: [
      { title: "Absence", path: "/autorisations/absence" },
      { title: "Retard", path: "/autorisations/retard" },
      { title: "Congé", path: "/autorisations/conge" },
    ]
  },
  {
    title: "Rapport des présences",
    icon: FaChartBar,
    subMenu: [
      { title: "Point des retards et absences", path: "/rapports/retards-absences" },
      { title: "Point des horaires de présence", path: "/rapports/horaires-presence" },
      { title: "État de ponctualité", path: "/rapports/ponctualite" },
    ]
  },
];

const Sidebar = ({ isOpen }) => {
  const [openSections, setOpenSections] = useState([]);
  const pathname = usePathname();

  const toggleSection = (title) => {
    setOpenSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  return (
    <div
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-emerald-600 transition-transform duration-300 ease-in-out transform ${
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
  );
};

export default Sidebar;