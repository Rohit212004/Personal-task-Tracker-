import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Search, FileDown, CheckCircle2, Circle, Clock, AlertCircle, BarChart3, Star, Bell, LogOut, Edit2, Trash2, Plus, PieChart as PieChartIcon } from "lucide-react";
import RightSummaryDrawer, { SummaryRange } from '../components/RightSummaryDrawer';
import { GoogleGenAI } from '@google/genai';
import ThemeToggle from '../components/ThemeToggle';


// API Configuration
const API_URL = "http://localhost:8080/api/tasks";

// Type definitions matching todo.tsx structure
interface Task {
  id: number;
  name: string;
  desc: string;
  dueDate: string;
  status: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface TaskSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  urgentTasks: number;
  highTasks: number;
  mediumTasks: number;
  lowTasks: number;
  completionRate: number;
  aiInsights: string;
  recommendations: string[];
}

const Home: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [thought, setThought] = useState<string>("The best way to predict the future is to create it. — Peter Drucker");
  const [date, setDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<TaskSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [summaryRange, setSummaryRange] = useState<SummaryRange>(1);

  const navigate = useNavigate();

  // Initialize Gemini AI (Google GenAI SDK)
  // ⚠️ Note: avoid exposing API keys in client-side builds for production.
  const genAI = new GoogleGenAI({
    apiKey: process.env.REACT_APP_GEMINI_API_KEY || ''
  });

  // Fetch tasks from backend API (using same structure as todo.tsx)
  const fetchTasks = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data: Task[] = await response.json();
      // Add priority field to existing tasks if not present
      const tasksWithPriority = data.map((task: any) => ({
        ...task,
        priority: task.priority || 'medium'
      }));
      setTasks(tasksWithPriority);
      console.log('Tasks fetched successfully:', tasksWithPriority);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching tasks:', errorMessage);
      setError(errorMessage);
      
      // Set mock data for development/fallback with priorities
      console.log('Using fallback mock data');
      setTasks([
        { id: 1, name: "Review project proposal", desc: "Review the Q4 project proposal", dueDate: new Date().toISOString().split('T')[0], status: false, priority: 'high' },
        { id: 2, name: "Update documentation", desc: "Update API documentation", dueDate: new Date().toISOString().split('T')[0], status: true, priority: 'medium' },
        { id: 3, name: "Team meeting", desc: "Weekly team sync meeting", dueDate: new Date().toISOString().split('T')[0], status: false, priority: 'urgent' },
        { id: 4, name: "Code review", desc: "Review pull requests", dueDate: new Date().toISOString().split('T')[0], status: false, priority: 'low' },
      ]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Get all tasks for the whole day (not just today's due date)
  const allTasks: Task[] = tasks; // Show all tasks regardless of due date
  const todayTasks: Task[] = tasks.filter(
    (task: Task) => new Date(task.dueDate).toDateString() === new Date().toDateString()
  );

  const completedTasks: number = allTasks.filter((task: Task) => task.status === true).length;
  const pendingTasks: number = allTasks.filter((task: Task) => task.status === false).length;
  const inProgressTasks: number = 0; // Based on todo.tsx structure, there's no in-progress status

  // Priority-based task counts
  const urgentTasks: number = allTasks.filter((task: Task) => !task.status && task.priority === 'urgent').length;
  const highTasks: number = allTasks.filter((task: Task) => !task.status && task.priority === 'high').length;
  const mediumTasks: number = allTasks.filter((task: Task) => !task.status && task.priority === 'medium').length;
  const lowTasks: number = allTasks.filter((task: Task) => !task.status && task.priority === 'low').length;

  // Helper: filter tasks for previous N days (including today)
  const getTasksForPreviousDays = (days: number): Task[] => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    return tasks.filter((t) => {
      const d = new Date(t.dueDate);
      return d >= start && d <= end;
    });
  };

  // Generate AI summary using Gemini (gemini-2.5-flash) with priority insights
  const generateAISummary = async (tasksParam: Task[]): Promise<TaskSummary> => {
    const totalTasksRange = tasksParam.length;
    const completedRange = tasksParam.filter(t => t.status).length;
    const pendingRange = tasksParam.filter(t => !t.status).length;
    const urgentRange = tasksParam.filter(t => !t.status && t.priority === 'urgent').length;
    const highRange = tasksParam.filter(t => !t.status && t.priority === 'high').length;
    const mediumRange = tasksParam.filter(t => !t.status && t.priority === 'medium').length;
    const lowRange = tasksParam.filter(t => !t.status && t.priority === 'low').length;
    try {
      setIsGeneratingSummary(true);

      const totalTasksRange = tasksParam.length;
      const completedRange = tasksParam.filter(t => t.status).length;
      const pendingRange = tasksParam.filter(t => !t.status).length;
      const urgentRange = tasksParam.filter(t => !t.status && t.priority === 'urgent').length;
      const highRange = tasksParam.filter(t => !t.status && t.priority === 'high').length;
      const mediumRange = tasksParam.filter(t => !t.status && t.priority === 'medium').length;
      const lowRange = tasksParam.filter(t => !t.status && t.priority === 'low').length;

      const taskData = {
        totalTasks: totalTasksRange,
        completedTasks: completedRange,
        pendingTasks: pendingRange,
        inProgressTasks,
        urgentTasks: urgentRange,
        highTasks: highRange,
        mediumTasks: mediumRange,
        lowTasks: lowRange,
        tasks: tasksParam.map(task => ({
          title: task.name,
          desc: task.desc,
          dueDate: task.dueDate,
          status: task.status ? 'done' : 'pending',
          priority: task.priority
        }))
      };

      const prompt = `
Analyze the following task data with priority insights and provide comprehensive analysis:

Total Tasks: ${taskData.totalTasks}
Completed: ${taskData.completedTasks}
Pending: ${taskData.pendingTasks}

Priority Breakdown (Pending Tasks Only):
- Urgent: ${taskData.urgentTasks}
- High: ${taskData.highTasks}  
- Medium: ${taskData.mediumTasks}
- Low: ${taskData.lowTasks}

Task Details:
${taskData.tasks.map(task => `- ${task.title}: ${task.desc} (Due: ${new Date(task.dueDate).toLocaleDateString()}, Status: ${task.status}, Priority: ${task.priority})`).join('\n')}

Please provide:
1. A comprehensive insight about overall task management, productivity, and priority distribution (4-5 sentences). Focus on priority balance, urgent task management, and completion patterns.
2. Three specific actionable recommendations to improve task completion, priority management, and productivity based on the priority distribution and pending tasks.

Pay special attention to urgent and high priority tasks in your analysis and recommendations.

Format your response as JSON with the following structure:
{
  "insights": "your insights here including priority analysis",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}
      `.trim();

      // Use models.generateContent and specify the Gemini 2.5 Flash model
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const text = response.text ?? ""; // .text contains the returned string per SDK docs

      try {
        const parsedResponse = JSON.parse(text);

        return {
          totalTasks: taskData.totalTasks,
          completedTasks: taskData.completedTasks,
          pendingTasks: taskData.pendingTasks,
          inProgressTasks: taskData.inProgressTasks,
          urgentTasks: taskData.urgentTasks,
          highTasks: taskData.highTasks,
          mediumTasks: taskData.mediumTasks,
          lowTasks: taskData.lowTasks,
          completionRate: taskData.totalTasks > 0 ? (taskData.completedTasks / taskData.totalTasks) * 100 : 0,
          aiInsights: parsedResponse.insights || "AI analysis in progress...",
          recommendations: parsedResponse.recommendations || [
            "Focus on completing urgent and high priority tasks first",
            "Break down complex high-priority tasks into smaller steps",
            "Set specific time blocks for priority-based task completion"
          ]
        };
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError, 'raw:', text);
        return {
          totalTasks: taskData.totalTasks,
          completedTasks: taskData.completedTasks,
          pendingTasks: taskData.pendingTasks,
          inProgressTasks: taskData.inProgressTasks,
          urgentTasks: taskData.urgentTasks,
          highTasks: taskData.highTasks,
          mediumTasks: taskData.mediumTasks,
          lowTasks: taskData.lowTasks,
          completionRate: taskData.totalTasks > 0 ? (taskData.completedTasks / taskData.totalTasks) * 100 : 0,
          aiInsights: `Your task management shows ${taskData.urgentTasks} urgent and ${taskData.highTasks} high priority tasks pending. Focus on completing these critical items first to maintain productivity. Your overall completion rate suggests good organization with room for priority-focused improvement.`,
          recommendations: [
            "Prioritize urgent and high priority tasks - complete them first",
            "Set daily goals focusing on high-impact, time-sensitive tasks",
            "Review task priorities regularly and adjust based on deadlines"
          ]
        };
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
      return {
        totalTasks: tasksParam.length,
        completedTasks: completedRange,
        pendingTasks: pendingRange,
        inProgressTasks,
        urgentTasks: urgentRange,
        highTasks: highRange,
        mediumTasks: mediumRange,
        lowTasks: lowRange,
        completionRate: tasksParam.length > 0 ? (completedRange / tasksParam.length) * 100 : 0,
        aiInsights: `Your task management system shows ${urgentRange} urgent and ${highRange} high priority tasks requiring immediate attention. Consider focusing on priority-based completion to enhance overall productivity and reduce stress from critical pending items.`,
        recommendations: [
          "Address urgent and high priority tasks immediately",
          "Implement time-blocking for different priority levels",
          "Review and adjust task priorities based on changing deadlines"
        ]
      };
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, []);



  // Refresh tasks function
  const handleRefreshTasks = async (): Promise<void> => {
    setIsRefreshing(true);
    await fetchTasks();
  };

  const getGreeting = (): string => {
    const hour: number = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const filteredTasks: Task[] = todayTasks.filter(
    (task: Task) => task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   task.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleSummary = async (): Promise<void> => {
    if (!showSummary) {
      setShowSummary(true);
      setAiSummary(null);
      const rangeTasks = getTasksForPreviousDays(summaryRange);
      const summary = await generateAISummary(rangeTasks);
      setAiSummary(summary);
    } else {
      setShowSummary(false);
    }
  };

  const handleSummaryRangeChange = async (days: 1 | 3 | 7): Promise<void> => {
    setSummaryRange(days);
    const rangeTasks = getTasksForPreviousDays(days);
    const summary = await generateAISummary(rangeTasks);
    setAiSummary(summary);
  };

  const handleDateChange = (value: any): void => {
    if (value instanceof Date) {
      setDate(value);
    } else if (Array.isArray(value) && value[0] instanceof Date) {
      setDate(value[0]);
    } else if (value) {
      setDate(new Date(value));
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const handleLogout = (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAddTask = (): void => {
    navigate('/todo');
  };

  const handleGoToAnalytics = (): void => {
    navigate('/Analysis');
  };

  const handleEditTask = (id: number): void => {
    navigate(`/todo?editId=${id}`);
  };

  const handleDeleteTask = async (id: number): Promise<void> => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleToggleComplete = async (id: number): Promise<void> => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updatedTask = { ...task, status: !task.status };
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    } catch (e) {
      // Optimistic update even if API fails
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-white bg-gradient-to-r from-red-500 to-pink-500 border-red-400 shadow-sm';
      case 'high': return 'text-white bg-gradient-to-r from-orange-500 to-red-500 border-orange-400 shadow-sm';
      case 'medium': return 'text-white bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-400 shadow-sm';
      case 'low': return 'text-white bg-gradient-to-r from-green-500 to-emerald-500 border-green-400 shadow-sm';
      default: return 'text-white bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-400 shadow-sm';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle size={16} className="text-white"/>;
      case 'high': return <Star size={16} className="text-white"/>;
      case 'medium': return <Clock size={16} className="text-white"/>;
      case 'low': return <Circle size={16} className="text-white"/>;
      default: return <Circle size={16} className="text-white"/>;
    }
  };

  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const handleExport = (format: 'txt' | 'json' | 'csv'): void => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    let content: string;
    let fileName: string;
    let mimeType: string;
    
    switch (format) {
      case 'txt':
        content = `
DAILY TASK REPORT WITH PRIORITY ANALYSIS
=======================================

Generated on: ${currentDate} at ${currentTime}

SUMMARY
-------
Total Tasks: ${todayTasks.length}
Completed Tasks: ${completedTasks}
Pending Tasks: ${pendingTasks}
Completion Rate: ${todayTasks.length > 0 ? ((completedTasks / todayTasks.length) * 100).toFixed(1) : 0}%

PRIORITY BREAKDOWN (Pending Tasks)
----------------------------------
Urgent Priority: ${urgentTasks}
High Priority: ${highTasks}
Medium Priority: ${mediumTasks}
Low Priority: ${lowTasks}

TASK DETAILS
------------

${todayTasks.length > 0 ? todayTasks.map((task, index) => `
${index + 1}. ${task.name}
   Description: ${task.desc}
   Due Date: ${new Date(task.dueDate).toLocaleDateString()}
   Priority: ${task.priority.toUpperCase()}
   Status: ${task.status ? '✓ COMPLETED' : '○ PENDING'}
   
`).join('') : 'No tasks scheduled for today.'}

PRIORITY ANALYSIS
-----------------
${urgentTasks > 0 ? `⚠️ URGENT: ${urgentTasks} tasks require immediate attention!` : '✓ No urgent tasks pending.'}
${highTasks > 0 ? `🔴 HIGH: ${highTasks} high priority tasks need focus.` : '✓ No high priority tasks pending.'}
${mediumTasks > 0 ? `🟡 MEDIUM: ${mediumTasks} medium priority tasks in queue.` : '✓ No medium priority tasks pending.'}
${lowTasks > 0 ? `🟢 LOW: ${lowTasks} low priority tasks can be scheduled later.` : '✓ No low priority tasks pending.'}

RECOMMENDATIONS
---------------
${urgentTasks + highTasks > 0 
  ? '• Focus on urgent and high priority tasks first\n• Consider time-blocking for critical tasks\n• Review deadlines for priority tasks daily' 
  : '• Maintain current task completion momentum\n• Consider planning ahead for upcoming deadlines\n• Review task priorities regularly'}

---
Report generated by Task Management Dashboard
        `;
        fileName = `Daily_Task_Report_${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain;charset=utf-8';
        break;
        
      case 'json':
        const jsonData = {
          reportInfo: {
            generatedOn: currentDate,
            generatedAt: currentTime,
            totalTasks: todayTasks.length,
            completedTasks,
            pendingTasks,
            completionRate: todayTasks.length > 0 ? ((completedTasks / todayTasks.length) * 100).toFixed(1) : 0
          },
          priorityBreakdown: {
            urgent: urgentTasks,
            high: highTasks,
            medium: mediumTasks,
            low: lowTasks
          },
          tasks: todayTasks.map(task => ({
            id: task.id,
            name: task.name,
            description: task.desc,
            dueDate: task.dueDate,
            priority: task.priority,
            status: task.status ? 'completed' : 'pending',
            formattedDueDate: new Date(task.dueDate).toLocaleDateString()
          })),
          recommendations: urgentTasks + highTasks > 0 
            ? [
                'Focus on urgent and high priority tasks first',
                'Consider time-blocking for critical tasks',
                'Review deadlines for priority tasks daily'
              ]
            : [
                'Maintain current task completion momentum',
                'Consider planning ahead for upcoming deadlines',
                'Review task priorities regularly'
              ]
        };
        content = JSON.stringify(jsonData, null, 2);
        fileName = `Task_Data_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
        
      case 'csv':
        const csvHeaders = 'Task ID,Name,Description,Due Date,Priority,Status\n';
        const csvRows = todayTasks.map(task => 
          `${task.id},"${task.name}","${task.desc}","${new Date(task.dueDate).toLocaleDateString()}","${task.priority.toUpperCase()}","${task.status ? 'COMPLETED' : 'PENDING'}"`
        ).join('\n');
        content = csvHeaders + csvRows;
        fileName = `Task_Data_${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;
        
      default:
        return;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
    setShowExportMenu(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800/30 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c6ffdd] via-[#fbd786] to-[#f7797d] dark:from-gray-900 dark:to-gray-800 relative">
      {/* Top Bar - Responsive positioning based on sidebar state */}
      <div className={`sticky top-0 z-30 bg-white/95 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800/60 px-4 sm:px-6 py-3 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition-all duration-300 ${
        showSummary 
          ? 'lg:mr-80' // Match summary drawer width
          : ''
      }`}>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 pr-3 py-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80 text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                     <div className="relative export-menu-container">
             <button 
               onClick={() => setShowExportMenu(!showExportMenu)}
               className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
             >
               <FileDown size={18} />
               <span className="hidden xs:inline">Export</span>
             </button>
             
              {showExportMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 py-2 z-50">
                 <button
                    onClick={() => handleExport('txt')}
                    className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-3"
                 >
                    <div className="w-6 h-6 rounded bg-gradient-to-r from-gray-700 to-gray-800 text-white flex items-center justify-center">
                      <span className="text-xs font-bold">T</span>
                   </div>
                   <span className="text-sm">Text Report (.txt)</span>
                 </button>
                 <button
                    onClick={() => handleExport('json')}
                    className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-3"
                 >
                    <div className="w-6 h-6 rounded bg-gradient-to-r from-gray-700 to-gray-800 text-white flex items-center justify-center">
                      <span className="text-xs font-bold">J</span>
                   </div>
                   <span className="text-sm">JSON Data (.json)</span>
                 </button>
                 <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-3"
                 >
                    <div className="w-6 h-6 rounded bg-gradient-to-r from-gray-700 to-gray-800 text-white flex items-center justify-center">
                      <span className="text-xs font-bold">C</span>
                   </div>
                   <span className="text-sm">Excel/CSV (.csv)</span>
                 </button>
               </div>
             )}
           </div>
          <button 
            onClick={handleToggleSummary}
            disabled={isGeneratingSummary}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium disabled:opacity-50"
          >
            <BarChart3 size={18} />
            <span className="hidden xs:inline"> AI Summary</span>
          </button>
          <button 
            onClick={handleGoToAnalytics}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
          >
            <PieChartIcon size={18} />
            <span className="hidden xs:inline">Analytics</span>
          </button>
          <button 
            onClick={handleAddTask}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
          >
            <Plus size={18} />
            <span className="hidden xs:inline">Add Task</span>
          </button>

          <ThemeToggle />
          <button 
            onClick={handleLogout}
            className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Container - Responsive layout with proper centering */}
      <div className={`transition-all duration-300 ${
        showSummary 
          ? 'lg:mr-80' // Match summary drawer width
          : ''
      }`}>
        <div className="max-w-7xl mx-auto p-6">
          {/* Content Cards - Centered with proper spacing */}
          <div className="space-y-6">
            {/* Greeting Card */}
            <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 to-gray-700 text-white p-8 rounded-2xl shadow-2xl">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{getGreeting()}!</h2>
                    <p className="text-gray-100 text-lg">
                      You have {allTasks.length} total tasks • {completedTasks} completed • {pendingTasks} pending
                    </p>
                    {(urgentTasks > 0 || highTasks > 0) && (
                      <p className="text-yellow-200 text-sm mt-1 flex items-center gap-1">
                        <Bell size={14} />
                        {urgentTasks + highTasks} high priority tasks need attention
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute top-1/2 right-8 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
            </div>

            {/* Tasks Section - Responsive width management */}
              <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm dark:backdrop-blur-none p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
              <div className="mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Today's Tasks</h3>
                {searchQuery && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Showing {filteredTasks.length} of {todayTasks.length} tasks matching "{searchQuery}"
                  </p>
                )}
              </div>

              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  {searchQuery ? (
                    <>
                      <div className="text-6xl mb-4">🔍</div>
                      <p className="text-gray-600 dark:text-gray-400 text-lg">No tasks found matching "{searchQuery}"</p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Try adjusting your search terms</p>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl mb-4">🎉</div>
                      <p className="text-gray-600 dark:text-gray-400 text-lg">No tasks for today!</p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Enjoy your free time or add some tasks to get started.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {filteredTasks.map((task: Task) => (
                    <div
                      key={task.id}
                      className="group p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-lg backdrop-blur-sm dark:backdrop-blur-none transition-all duration-200 bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-800/80"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 w-full sm:w-auto min-w-0 flex-1">
                          <button onClick={() => handleToggleComplete(task.id)} className="flex-shrink-0">
                            {task.status ? (
                              <CheckCircle2 className="text-green-500" size={18} />
                            ) : (
                              <Circle className="text-gray-400 hover:text-gray-600 transition-colors" size={18} />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 sm:mb-1 min-w-0">
                              <span className={`font-medium text-sm sm:text-base truncate ${task.status ? "text-gray-500 line-through" : "text-gray-900 dark:text-gray-100"}`}>
                                {task.name}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                                {getPriorityIcon(task.priority)}
                                {task.priority.toUpperCase()}
                              </span>
                            </div>
                            <span className={`text-xs sm:text-sm block mt-0.5 sm:mt-1 truncate ${task.status ? "text-gray-400" : "text-gray-600 dark:text-gray-300"}`}>
                              {task.desc}
                            </span>
                            <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-500 block mt-0.5 sm:mt-1">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                          <button onClick={() => handleEditTask(task.id)} className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900/20 rounded-lg transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                          <span
                            className={`px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full flex-shrink-0 ${
                              task.status
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm"
                                : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                            }`}
                          >
                            {task.status ? "Completed" : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right-side Summary Panel - Fixed positioning */}
      <RightSummaryDrawer
        open={showSummary}
        onClose={() => setShowSummary(false)}
        summaryRange={summaryRange}
        onChangeRange={handleSummaryRangeChange}
        aiSummary={aiSummary as any}
      />


    </div>
  );
};

export default Home;