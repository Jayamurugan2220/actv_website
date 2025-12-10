import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaCheckCircle, FaUsers, FaCog, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AdminMobileMenu({ isOpen, onClose }: Props) {
  const location = useLocation();
  
  const navigate = useNavigate();

  const role = (typeof window !== 'undefined' ? localStorage.getItem('role') : '') || '';
  const userName = (typeof window !== 'undefined' ? localStorage.getItem('userName') : '') || 'Admin';
  const roleLabel = role === 'block_admin' ? 'Block Admin' : role === 'district_admin' ? 'District Admin' : role === 'state_admin' ? 'State Admin' : role === 'super_admin' ? 'Super Admin' : 'Member';
  const initials = role === 'block_admin' ? 'BA' : role === 'district_admin' ? 'DA' : role === 'state_admin' ? 'SA' : role === 'super_admin' ? 'SU' : (userName || 'A').split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase();

  const nav = [
    { to: '/admin/dashboard', label: 'Home', icon: <FaHome /> },
    { to: '/admin/approvals', label: 'Approvals', icon: <FaCheckCircle /> },
    { to: '/admin/members', label: 'Members', icon: <FaUsers /> },
    { to: '/admin/settings', label: 'Settings', icon: <FaCog /> },
  ];

  const handleLogout = () => {
    // Clear all local storage items related to login
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('memberId');
    localStorage.removeItem('userName');
    localStorage.removeItem('role');
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminId');
    localStorage.removeItem('sessionStart');
    
    // Close the mobile menu and navigate to main login page
    onClose();
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="absolute left-0 top-0 bottom-0 w-4/5 max-w-sm bg-white">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Admin Menu</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <FaTimes className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mt-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{userName}</div>
              <div className="text-sm text-muted-foreground">{roleLabel}</div>
            </div>
          </div>
        </div>

        <nav className="p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {nav.map((item) => {
            // Check if current path starts with the nav item path for better matching
            const active = location.pathname === item.to || 
                          (item.to !== '/admin/dashboard' && location.pathname.startsWith(item.to));
            return (
              <Link 
                key={item.to} 
                to={item.to} 
                className={`flex items-center gap-3 px-3 py-3 rounded-md ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={onClose}
              >
                <span className="w-5 h-5">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t">
          <Button variant="ghost" onClick={handleLogout} className="w-full flex items-center gap-2 text-red-600 hover:bg-red-50 p-3">
            <FaSignOutAlt className="w-5 h-5" />
            <span>Log out</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
