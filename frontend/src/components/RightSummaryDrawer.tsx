import React from 'react';
import { X, Sparkles, Target, TrendingUp } from 'lucide-react';

export type SummaryRange = 1 | 3 | 7;

export interface SimpleSummary {
  aiInsights: string;
  recommendations: string[];
}

interface RightSummaryDrawerProps {
  open: boolean;
  onClose: () => void;
  summaryRange: SummaryRange;
  onChangeRange: (days: SummaryRange) => void;
  aiSummary: SimpleSummary | null;
}

const RightSummaryDrawer: React.FC<RightSummaryDrawerProps> = ({
  open,
  onClose,
  summaryRange,
  onChangeRange,
  aiSummary,
}) => {
  if (!open) return null;

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Summary Panel - Fixed position with proper width */}
      <aside className={`fixed right-0 top-0 z-50 h-screen transition-all duration-300 ease-in-out bg-gradient-to-b from-white/90 via-[#c6ffdd]/40 to-[#fbd786]/50 dark:from-gray-900 dark:via-gray-800/20 dark:to-gray-700/30 backdrop-blur-md dark:backdrop-blur-none shadow-2xl border-l border-gray-200/60 dark:border-gray-700/60 flex flex-col ${
        // Responsive width - exactly 320px (80 * 0.25rem = 20rem = 320px)
        'w-80'
      } ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header with enhanced gradient */}
        <div className="px-4 py-4 border-b border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-gray-900 to-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles className="text-white" size={18} />
            <span className="text-sm font-semibold text-white uppercase tracking-wider">
              AI Insights
            </span>
          </div>
          
          <button 
            aria-label="Close summary" 
            onClick={onClose} 
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Range Selector - Enhanced design */}
        <div className="px-4 py-3 border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-gray-50/70 to-gray-100/70 dark:from-gray-800/20 dark:to-gray-700/20">
          <div className="flex rounded-lg bg-white/90 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 p-1 shadow-sm backdrop-blur-sm">
            <button 
              onClick={() => onChangeRange(1)} 
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                summaryRange === 1
                  ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              1 Day
            </button>
            <button 
              onClick={() => onChangeRange(3)} 
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                summaryRange === 3
                  ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              3 Days
            </button>
            <button 
              onClick={() => onChangeRange(7)} 
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                summaryRange === 7
                  ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              7 Days
            </button>
          </div>
        </div>
        
        {/* Content - Enhanced styling */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
          {!aiSummary ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4 text-gray-600 dark:text-gray-300">
                <div className="relative">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-transparent"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-800"></div>
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium block">Generating insights...</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Analyzing your productivity patterns</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* AI Insights Section */}
              <div className="bg-gradient-to-br from-gray-100/80 via-gray-200/80 to-gray-300/80 dark:from-gray-700/20 dark:via-gray-600/20 dark:to-gray-500/20 p-4 rounded-xl border border-gray-200/60 dark:border-gray-600/40 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-800">
                    <TrendingUp className="text-white" size={18} />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Productivity Analysis
                  </h4>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {aiSummary.aiInsights}
                </p>
              </div>
              
              {/* Recommendations Section */}
              <div>
            <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700">
                    <Target className="text-white" size={18} />
                  </div>
                  <h5 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Smart Recommendations
                  </h5>
                </div>
                <div className="space-y-3">
                  {aiSummary.recommendations.map((rec, idx) => (
                    <div 
                      key={idx} 
                  className="group p-4 bg-white/90 dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white/95 dark:hover:bg-gray-800/90"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                          <span className="text-white text-xs font-bold">{idx + 1}</span>
                        </div>
                        <span className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed flex-1">
                          {rec}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Footer note */}
              <div className="mt-6 p-3 bg-gradient-to-r from-gray-100/70 to-gray-200/70 dark:from-gray-800/20 dark:to-gray-700/20 rounded-lg border border-gray-200/60 dark:border-gray-700/40 backdrop-blur-sm">
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center flex items-center justify-center gap-2">
                  <div className="p-1 rounded-full bg-gradient-to-r from-gray-600 to-gray-700">
                    <Sparkles size={10} className="text-white" />
                  </div>
                  Powered by AI Analytics
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default RightSummaryDrawer;