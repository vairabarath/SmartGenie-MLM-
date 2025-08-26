// src/components/layout/Sidebar.tsx
import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import type { MenuItemType } from "../../types";
import { User, TrendingUp, GitBranch, X } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const menuItems: MenuItemType[] = [
    {
      id: "personal",
      label: "Personal",
      icon: User,
      path: "/dashboard/personal",
    },
    {
      id: "upgrade-status",
      label: "Upgrade Status",
      icon: TrendingUp,
      path: "/dashboard/level-status",
    },
    {
      id: "genealogy-tree",
      label: "Genealogy Tree",
      icon: GitBranch,
      path: "/dashboard/genealogy-tree",
    },
  ];

  // Close sidebar on route change (mobile)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isOpen) {
        onClose();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 lg:w-64 bg-gray-800 min-h-screen p-4
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end mb-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={({ isActive }) =>
                  `group flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-gray-700 text-green-400"
                      : "text-gray-300 hover:bg-gray-700"
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="ml-3 truncate">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;