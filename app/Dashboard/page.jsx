'use client';
import React from 'react';
import { Users, Building2, Map, Computer, Clock, CalendarRange } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  ResponsiveContainer 
} from 'recharts';
import MainLayout from '@/components/layouts/MainLayout';

// Composant Card réutilisable
const StatCard = ({ icon: Icon, title, value, link }) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <div className="flex items-center">
      <div className="p-3 bg-emerald-100 rounded-full">
        <Icon className="w-6 h-6 text-emerald-600" />
      </div>
      <div className="ml-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

// Données de démonstration pour les graphiques
const attendanceData = [
  { name: 'Lun', presence: 95, retard: 5 },
  { name: 'Mar', presence: 92, retard: 8 },
  { name: 'Mer', presence: 88, retard: 12 },
  { name: 'Jeu', presence: 94, retard: 6 },
  { name: 'Ven', presence: 90, retard: 10 }
];

const monthlyTrendsData = [
  { month: 'Jan', tauxPresence: 95, tauxPonctualite: 92 },
  { month: 'Fév', tauxPresence: 93, tauxPonctualite: 90 },
  { month: 'Mar', tauxPresence: 94, tauxPonctualite: 89 },
  { month: 'Avr', tauxPresence: 96, tauxPonctualite: 93 },
  { month: 'Mai', tauxPresence: 92, tauxPonctualite: 88 },
  { month: 'Jun', tauxPresence: 95, tauxPonctualite: 91 }
];

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h1>
        
        {/* Grille de cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Users} title="Employés" value="125" link="/employes" />
          <StatCard icon={Building2} title="Départements" value="8" link="/departements" />
          <StatCard icon={Map} title="Zones" value="4" link="/zones" />
          <StatCard icon={Computer} title="Appareils" value="12" link="/appareils" />
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graphique de présence hebdomadaire */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Présences de la semaine</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="presence" name="Présence (%)" fill="#059669" />
                  <Bar dataKey="retard" name="Retard (%)" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graphique des tendances mensuelles */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Tendances mensuelles</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="tauxPresence" 
                    name="Taux de présence" 
                    stroke="#059669" 
                    strokeWidth={2} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tauxPonctualite" 
                    name="Taux de ponctualité" 
                    stroke="#0284c7" 
                    strokeWidth={2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}