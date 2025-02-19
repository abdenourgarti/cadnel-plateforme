'use client'
import { useState } from 'react';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';


const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-white">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Sidebar isOpen={sidebarOpen} />
      <main className={`pt-16 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 p-4`}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;