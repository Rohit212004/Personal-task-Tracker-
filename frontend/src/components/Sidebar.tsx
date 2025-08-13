import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  ListTodo,
  Users,
  Music,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";

// Type definitions
interface UserInfo {
  name?: string;
  email?: string;
  picture?: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactElement;
}

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = "" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleLogout = (): void => {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const toggleSidebar = (): void => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = (): void => {
    setIsOpen(false);
  };

  useEffect(() => {
    const loadUserData = (): void => {
      try {
        const userData: string | null = localStorage.getItem("user");
        if (userData) {
          const parsedUserData: UserInfo = JSON.parse(userData);
          setUserInfo(parsedUserData);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Set default user info in case of error
        setUserInfo({
          name: "User",
          email: "user@example.com"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Generate avatar from name
  const getAvatarText = (name?: string): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate avatar background color based on name
  const getAvatarColor = (name?: string): string => {
    if (!name) return "bg-gradient-to-br from-purple-500 to-indigo-600";
    
    const colors = [
      "bg-gradient-to-br from-blue-500 to-cyan-600",
      "bg-gradient-to-br from-purple-500 to-indigo-600",
      "bg-gradient-to-br from-emerald-500 to-teal-600",
      "bg-gradient-to-br from-orange-500 to-red-600",
      "bg-gradient-to-br from-pink-500 to-rose-600",
      "bg-gradient-to-br from-indigo-500 to-purple-600",
      "bg-gradient-to-br from-teal-500 to-emerald-600",
      "bg-gradient-to-br from-amber-500 to-orange-600"
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const navItems: NavItem[] = [
    { name: "Home", path: "/home", icon: <HomeIcon size={20} /> },
    { name: "Todo", path: "/todo", icon: <ListTodo size={20} /> },
    { name: "Members", path: "/members", icon: <Users size={20} /> },
    { name: "Music", path: "/Music", icon: <Music size={20} /> },
    { name: "AI Chat", path: "/AiChat", icon: <MessageSquare size={20} /> },
    { name: "Settings", path: "/settings", icon: <Settings size={20} /> },
  ];

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  return (
    <>
      {/* Menu Toggle Button - Fixed position */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-6 left-6 z-50 p-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl
          ${isOpen 
            ? 'bg-white/90 text-gray-700 hover:bg-white backdrop-blur-sm' 
            : 'bg-white/80 text-gray-700 hover:bg-white/90 backdrop-blur-sm'
          }`}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-all duration-300"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen w-80 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-white/20 z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${className}`}>
        
        {/* Profile Section */}
        <div className="relative p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-indigo-600/20"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
          
          <div className="relative z-10">
            {/* Avatar - Text Only */}
            <div className={`w-20 h-20 rounded-2xl ${getAvatarColor(userInfo.name)} flex items-center justify-center shadow-xl border-2 border-white/20 mx-auto`}>
              <span className="text-2xl font-bold text-white">
                {getAvatarText(userInfo.name)}
              </span>
            </div>
            
            {/* User Info */}
            <div className="mt-6 text-center">
              <h3 className="text-white font-bold text-xl mb-1">
                {userInfo.name || "User"}
              </h3>
              <p className="text-gray-300 text-sm opacity-90 mb-4">
                {userInfo.email || "user@example.com"}
              </p>
              
              {/* Status indicator */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-300 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-6 py-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <ul className="space-y-2">
              {navItems.map((item: NavItem) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden
                      ${
                        location.pathname === item.path
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                          : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-600"
                      }`}
                    onClick={closeSidebar}
                  >
                    <div className={`${location.pathname === item.path ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'} transition-colors flex-shrink-0`}>
                      {item.icon}
                    </div>
                    
                    <span className="font-medium transition-all duration-200 flex-1">
                      {item.name}
                    </span>

                    {location.pathname === item.path && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;