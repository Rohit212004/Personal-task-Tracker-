import React, { useEffect, useState } from "react";
import { Users, GraduationCap, Star, AlertCircle, RefreshCw } from "lucide-react";
import api from "../api"; // make sure this path is correct

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  college: string;
}

const Members = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchMembers = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get<Member[]>("/members");
      setMembers(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch members';
      console.error("Error fetching members:", errorMessage);
      setError(errorMessage);
      
      // Fallback mock data
      setMembers([
        { id: 1, firstName: "John", lastName: "Doe", college: "MIT" },
        { id: 2, firstName: "Jane", lastName: "Smith", college: "Stanford" },
        { id: 3, firstName: "Alex", lastName: "Johnson", college: "Harvard" },
      ]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRefresh = async (): Promise<void> => {
    setIsRefreshing(true);
    await fetchMembers();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#c6ffdd] via-[#fbd786] to-[#f7797d] dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-200 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c6ffdd] via-[#fbd786] to-[#f7797d] dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Team Members</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Meet our amazing team and mentor.</p>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-amber-600 dark:text-amber-400 text-sm">
              <AlertCircle size={16} />
              <span>Using offline data - API connection failed</span>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-500 text-white rounded-xl shadow transition-all duration-200 font-medium"
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Mentor Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/20 rounded-xl">
                <Star className="text-white" size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Our Mentor</h2>
                <p className="text-blue-100">Guiding our team to success</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">D</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Dominick da Costa</h3>
                  <p className="text-blue-100">Senior Mentor & Guide</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Team Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Total Members</h3>
              <Users className="text-blue-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{members.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">active team members</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Colleges</h3>
              <GraduationCap className="text-green-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{new Set(members.map(m => m.college)).size}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">different institutions</p>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-xl shadow border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Team Strength</h3>
              <Star className="text-amber-500" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">A+</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">diverse & talented</p>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Team Members</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Our talented development team</p>
            </div>
          </div>
          
          {members.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-500 text-lg">No team members found</p>
              <p className="text-gray-400 text-sm mt-1">Members will appear here once loaded</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member, index) => (
                <div
                  key={member.id}
                  className="group bg-white/60 dark:bg-gray-900/60 p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md backdrop-blur-sm dark:backdrop-blur-none transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      index % 5 === 0 ? 'bg-gradient-to-br from-blue-500 to-purple-600' :
                      index % 5 === 1 ? 'bg-gradient-to-br from-green-500 to-teal-600' :
                      index % 5 === 2 ? 'bg-gradient-to-br from-orange-500 to-red-600' :
                      index % 5 === 3 ? 'bg-gradient-to-br from-pink-500 to-rose-600' :
                      'bg-gradient-to-br from-indigo-500 to-blue-600'
                    }`}>
                      {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                        {member.firstName} {member.lastName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <GraduationCap size={14} className="text-gray-400" />
                        <p className="text-sm text-gray-600">{member.college}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Members;