import React, { useEffect, useState } from "react";
import { Search, FileDown, CheckCircle2, Circle, Clock, AlertCircle, RefreshCw, BarChart3, List, Star, Bell } from "lucide-react";
import { GoogleGenAI } from '@google/genai';

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

  // Generate AI summary using Gemini (gemini-2.5-flash) with priority insights
  const generateAISummary = async (tasksParam: Task[]): Promise<TaskSummary> => {
    try {
      setIsGeneratingSummary(true);

      const taskData = {
        totalTasks: allTasks.length,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        urgentTasks,
        highTasks,
        mediumTasks,
        lowTasks,
        tasks: allTasks.map(task => ({
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
        totalTasks: allTasks.length,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        urgentTasks,
        highTasks,
        mediumTasks,
        lowTasks,
        completionRate: allTasks.length > 0 ? (completedTasks / allTasks.length) * 100 : 0,
        aiInsights: `Your task management system shows ${urgentTasks} urgent and ${highTasks} high priority tasks requiring immediate attention. Consider focusing on priority-based completion to enhance overall productivity and reduce stress from critical pending items.`,
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
      const summary = await generateAISummary(allTasks);
      setAiSummary(summary);
    }
    setShowSummary(!showSummary);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle size={16} />;
      case 'high': return <Star size={16} />;
      case 'medium': return <Clock size={16} />;
      case 'low': return <Circle size={16} />;
      default: return <Circle size={16} />;
    }
  };

  const handleExport = (): void => {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    const docContent = `
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
    
    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const exportFileDefaultName = `Daily_Task_Report_Priority_${new Date().toISOString().split('T')[0]}.txt`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 pl-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome! Here's your day at a glance.</p>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-amber-600 text-sm">
              <AlertCircle size={16} />
              <span>Using offline data - API connection failed</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-3 w-64 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <button 
            onClick={handleRefreshTasks}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
          >
            <FileDown size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Section - 3 columns */}
        <div className="xl:col-span-3 space-y-6">
          {/* Greeting Card with Thought */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-8 rounded-2xl shadow-xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{getGreeting()}!</h2>
                  <p className="text-blue-100 text-lg">
                    You have {allTasks.length} total tasks • {completedTasks} completed • {pendingTasks} pending
                  </p>
                  {(urgentTasks > 0 || highTasks > 0) && (
                    <p className="text-red-200 text-sm mt-1 flex items-center gap-1">
                      <Bell size={14} />
                      {urgentTasks + highTasks} high priority tasks need attention
                    </p>
                  )}
                </div>
                <div className="hidden sm:block text-6xl opacity-20">
                  ✨
                </div>
              </div>
              
              {/* Thought of the Day */}
              <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <h4 className="text-sm font-semibold text-blue-100 uppercase tracking-wide mb-2">
                  Thought of the Day
                </h4>
                <p className="text-white/90 italic leading-relaxed">
                  {thought}
                </p>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          {/* Stats Cards - Updated with Priority Information */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Tasks</h3>
                <Circle className="text-blue-500" size={20} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{allTasks.length}</p>
              <p className="text-sm text-gray-500 mt-1">total tasks</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Completed</h3>
                <CheckCircle2 className="text-green-500" size={20} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{completedTasks}</p>
              <p className="text-sm text-gray-500 mt-1">tasks done</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending</h3>
                <Circle className="text-amber-500" size={20} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{pendingTasks}</p>
              <p className="text-sm text-gray-500 mt-1">remaining</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">High Priority</h3>
                <Bell className="text-red-500" size={20} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{urgentTasks + highTasks}</p>
              <p className="text-sm text-gray-500 mt-1">urgent + high</p>
            </div>
          </div>

          {/* Tasks Section / Summary Section */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {showSummary ? "Overall Task Analysis" : "Today's Tasks"}
                </h3>
                {!showSummary && searchQuery && (
                  <p className="text-sm text-gray-500 mt-1">
                    Showing {filteredTasks.length} of {todayTasks.length} tasks matching "{searchQuery}"
                  </p>
                )}
                {showSummary && (
                  <p className="text-sm text-gray-500 mt-1">
                    Comprehensive analysis of all your tasks with priority insights
                  </p>
                )}
              </div>
              <button 
                onClick={handleToggleSummary}
                disabled={isGeneratingSummary}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-medium disabled:opacity-50"
              >
                {isGeneratingSummary ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    {showSummary ? <List size={18} /> : <BarChart3 size={18} />}
                    {showSummary ? "Today's Tasks" : "Summary"}
                  </>
                )}
              </button>
            </div>
            
            {showSummary ? (
              // Summary View - Updated with Priority Information
              <div className="space-y-6">
                {aiSummary && (
                  <>
                    {/* Progress Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Overall Progress</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Completion Rate</span>
                            <span className="font-semibold text-blue-600">{aiSummary.completionRate.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${aiSummary.completionRate}%` }}
                            ></div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                            <div className="bg-white p-3 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">{aiSummary.totalTasks}</div>
                              <div className="text-xs text-gray-500">Total</div>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">{aiSummary.completedTasks}</div>
                              <div className="text-xs text-gray-500">Done</div>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                              <div className="text-2xl font-bold text-amber-600">{aiSummary.pendingTasks}</div>
                              <div className="text-xs text-gray-500">Pending</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-100">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Priority Breakdown</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="text-red-500" size={16} />
                              <span className="text-gray-700">Urgent</span>
                            </div>
                            <span className="font-semibold text-red-600">{aiSummary.urgentTasks}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Star className="text-orange-500" size={16} />
                              <span className="text-gray-700">High</span>
                            </div>
                            <span className="font-semibold text-orange-600">{aiSummary.highTasks}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="text-yellow-500" size={16} />
                              <span className="text-gray-700">Medium</span>
                            </div>
                            <span className="font-semibold text-yellow-600">{aiSummary.mediumTasks}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Circle className="text-green-500" size={16} />
                              <span className="text-gray-700">Low</span>
                            </div>
                            <span className="font-semibold text-green-600">{aiSummary.lowTasks}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                            <div className="flex h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-red-500 transition-all duration-500" 
                                style={{ width: `${aiSummary.pendingTasks > 0 ? (aiSummary.urgentTasks / aiSummary.pendingTasks) * 100 : 0}%` }}
                              ></div>
                              <div 
                                className="bg-orange-500 transition-all duration-500" 
                                style={{ width: `${aiSummary.pendingTasks > 0 ? (aiSummary.highTasks / aiSummary.pendingTasks) * 100 : 0}%` }}
                              ></div>
                              <div 
                                className="bg-yellow-500 transition-all duration-500" 
                                style={{ width: `${aiSummary.pendingTasks > 0 ? (aiSummary.mediumTasks / aiSummary.pendingTasks) * 100 : 0}%` }}
                              ></div>
                              <div 
                                className="bg-green-500 transition-all duration-500" 
                                style={{ width: `${aiSummary.pendingTasks > 0 ? (aiSummary.lowTasks / aiSummary.pendingTasks) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Insights */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        🤖 Productivity & Priority Insights
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{aiSummary.aiInsights}</p>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        💡 Priority-Based Recommendations
                      </h4>
                      <div className="space-y-3">
                        {aiSummary.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-100">
                            <div className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <span className="text-gray-700 leading-relaxed">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Tasks View - Updated to show priority information
              <>
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    {searchQuery ? (
                      <>
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-gray-500 text-lg">No tasks found matching "{searchQuery}"</p>
                        <p className="text-gray-400 text-sm mt-1">Try adjusting your search terms</p>
                      </>
                    ) : (
                      <>
                        <div className="text-6xl mb-4">🎉</div>
                        <p className="text-gray-500 text-lg">No tasks for today!</p>
                        <p className="text-gray-400 text-sm mt-1">Enjoy your free time or add some tasks to get started.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTasks.map((task: Task) => (
                      <div
                        key={task.id}
                        className="group p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-200 bg-white/60"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {task.status ? (
                              <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />
                            ) : (
                              <Circle className="text-gray-400 flex-shrink-0" size={20} />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`font-medium ${task.status ? "text-gray-500 line-through" : "text-gray-900"}`}>
                                  {task.name}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                                  {getPriorityIcon(task.priority)}
                                  {task.priority.toUpperCase()}
                                </span>
                              </div>
                              <span className={`text-sm block mt-1 ${task.status ? "text-gray-400" : "text-gray-600"}`}>
                                {task.desc}
                              </span>
                              <span className="text-xs text-gray-400 block mt-1">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-3 ${
                              task.status
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {task.status ? "Completed" : "Pending"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;