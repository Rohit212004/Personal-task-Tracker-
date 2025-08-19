import React, { useState, useEffect } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { Home as HomeIcon, ListTodo, Users, Music, MessageSquare, Settings, Menu, X, Bell } from "lucide-react";



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

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);



  const handleLogout = (): void => {

    try {

      localStorage.removeItem("authToken");

      localStorage.removeItem("user");

      navigate("/login");

    } catch (error) {

      console.error("Error during logout:", error);

    }

  };



  const closeSidebar = (): void => { setIsMobileOpen(false); };
  const openSidebar = (): void => { setIsMobileOpen(true); };


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



  // No toggle for static sidebar


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

    // Removed Todo as requested

    { name: "Members", path: "/members", icon: <Users size={20} /> },

   

    { name: "AI Chat", path: "/AiChat", icon: <MessageSquare size={20} /> }

  ];



  if (isLoading) {

    return null; // Don't show anything while loading

  }



  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white/95 dark:bg-gray-900/90 border border-gray-200/60 dark:border-gray-800/60 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-200"
        aria-label="Open navigation"
        onClick={openSidebar}
      >
        <Menu size={20} className="text-gray-600 dark:text-gray-200" />
      </button>

      {/* Sidebar - desktop */}
      <aside className={`hidden lg:flex fixed left-0 top-0 h-screen w-64 shadow-2xl border-r border-gray-200/60 dark:border-gray-800/60 z-40 flex-col bg-gradient-to-b from-white/90 via-[#c6ffdd]/40 to-[#fbd786]/50 dark:from-gray-900 dark:via-gray-800/20 dark:to-gray-700/30 backdrop-blur-md ${className}`}>
        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto no-scrollbar">
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4">
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
                          ? "bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800/20 dark:hover:to-gray-700/20 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    onClick={closeSidebar}
                  >
                    <div className={`${location.pathname === item.path ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'} transition-colors flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <span className="font-medium transition-all duration-200 flex-1">
                      {item.name}
                    </span>
                    {location.pathname === item.path && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-sm"></div>
                      </>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </aside>

      {/* Sidebar - mobile drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeSidebar} />
          <div className="absolute left-0 top-0 h-full w-64 bg-gradient-to-b from-white/90 via-[#c6ffdd]/40 to-[#fbd786]/50 dark:from-gray-900 dark:via-gray-800/20 dark:to-gray-700/30 shadow-2xl border-r border-gray-200/60 dark:border-gray-800/60 p-4 flex flex-col backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Navigation</span>
              <button aria-label="Close navigation" onClick={closeSidebar} className="p-2 rounded-lg hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-colors">
                <X size={18} className="text-gray-600 dark:text-gray-200" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto no-scrollbar">
              <ul className="space-y-2">
                {navItems.map((item: NavItem) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                        location.pathname === item.path
                          ? "bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800/20 dark:hover:to-gray-700/20 hover:text-gray-900 dark:hover:text-white"
                      }`}
                      onClick={closeSidebar}
                    >
                      <div className={`${location.pathname === item.path ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'} transition-colors flex-shrink-0`}>
                        {item.icon}
                      </div>
                      <span className="font-medium transition-all duration-200 flex-1">
                        {item.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );

};



export default Sidebar;
