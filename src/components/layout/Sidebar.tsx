// src/components/layout/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import type { MenuItemType } from "../../types";
import { User, TrendingUp, DollarSign, GitBranch, LogOut } from "lucide-react";

const Sidebar: React.FC = () => {
  const menuItems: MenuItemType[] = [
    {
      id: "personal",
      label: "Personal",
      icon: User,
      path: "/dashboard/personal",
    },
    {
      id: "level-status",
      label: "Level Status",
      icon: TrendingUp,
      path: "/dashboard/level-status",
    },
    {
      id: "income",
      label: "Income",
      icon: DollarSign,
      path: "/dashboard/income",
    },
    {
      id: "genealogy-tree",
      label: "Genealogy Tree",
      icon: GitBranch,
      path: "/dashboard/genealogy-tree",
    },
  ];

  return (
    <div className="w-64 bg-gray-800 min-h-screen p-4">
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-gray-700 text-green-400"
                    : "text-gray-300 hover:bg-gray-700"
                }`
              }
            >
              <Icon className="w-4 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        <div className="flex items-center space-x-2 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 cursor-pointer">
          <LogOut className="w-4 h-5" />
          <span>Exit</span>
        </div>
      </nav>
    </div>
  );
};
export default Sidebar;
