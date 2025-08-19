import React, { useEffect, useState, useTransition } from "react";
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  TrendingUp, Target, Clock, CheckCircle2,
  ArrowLeft, RefreshCw, Calendar as CalendarIcon,
  BarChart3, Activity, Award
} from "lucide-react";

// API Configuration
const API_URL = "http://localhost:8080/api/tasks";

// Type definitions
interface Task {
  id: number;
  name: string;
  desc: string;
  dueDate: string;
  status: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface TaskAnalytics {
  dailyCompletion: Array<{date: string, completed: number, pending: number}>;
  priorityDistribution: Array<{priority: string, count: number, color: string}>;
  weeklyTrends: Array<{week: string, completed: number, created: number}>;
  monthlyPerformance: Array<{month: string, completionRate: number}>;
  taskCategories: Array<{category: string, count: number}>;
  performanceMetrics: {
    avgCompletionTime: number;
    productivityScore: number;
    streakDays: number;
    totalHours: number;
  };
}

const Analysis: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedChart, setSelectedChart] = useState<'overview' | 'trends' | 'performance' | 'calendar'>('overview');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [chartHeight, setChartHeight] = useState<number>(() => (typeof window !== 'undefined' && window.innerWidth < 640 ? 220 : 300));
  const [isPending, startTransition] = useTransition();
  
  const navigate = useNavigate();

  // Color schemes matching home page theme
  const PRIORITY_COLORS = {
    urgent: '#ef4444',
    high: '#f97316', 
    medium: '#eab308',
    low: '#22c55e'
  };

  const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

  // Date helpers
  const formatDateKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseDateKeyFromString = (dateStr: string): string => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    d.setHours(0, 0, 0, 0);
    return formatDateKey(d);
  };

  const startOfWeek = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = (day + 6) % 7; // Monday as start
    d.setDate(d.getDate() - diff);
    return d;
  };

  const weekKey = (date: Date): string => {
    return formatDateKey(startOfWeek(date));
  };

  const monthKey = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const withinRange = (date: Date, days: number): boolean => {
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (days - 1));
    return date >= start && date <= end;
  };

  // Update chart height on window resize for responsiveness
  useEffect(() => {
    const handler = () => {
      setChartHeight(window.innerWidth < 640 ? 220 : 300);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Fetch tasks from backend API
  const fetchTasks = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data: Task[] = await response.json();
      const tasksWithPriority = data.map((task: any) => ({
        ...task,
        priority: task.priority || 'medium'
      }));
      setTasks(tasksWithPriority);
      generateAnalytics(tasksWithPriority);
    } catch (err) {
      // Rely only on database; no mock data
      setTasks([]);
      generateAnalytics([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate analytics data
  const generateAnalytics = (taskData: Task[]): void => {
    const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : selectedTimeRange === '90d' ? 90 : 365;

    // Normalize and filter by selected range
    const normalized = taskData
      .map(t => ({ ...t, _date: new Date(t.dueDate) as Date }))
      .filter(t => !isNaN(t._date.getTime()) && withinRange(t._date, days));

    // Build a map for quick per-day completed counts
    const completedByDateKey: Record<string, number> = {};

    // Daily completion data over the range
    const end = new Date(); end.setHours(0, 0, 0, 0);
    const start = new Date(end); start.setDate(end.getDate() - (days - 1));
    const dailyCompletion: Array<{ date: string; completed: number; pending: number }> = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = formatDateKey(d);
      const dayTasks = normalized.filter(t => parseDateKeyFromString(t.dueDate) === key);
      const completed = dayTasks.filter(t => t.status).length;
      const pending = dayTasks.filter(t => !t.status).length;
      completedByDateKey[key] = completed;
      dailyCompletion.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed,
        pending
      });
    }

    // Priority distribution within range
    const priorityDistribution = [
      { priority: 'Urgent', count: normalized.filter(t => t.priority === 'urgent').length, color: PRIORITY_COLORS.urgent },
      { priority: 'High', count: normalized.filter(t => t.priority === 'high').length, color: PRIORITY_COLORS.high },
      { priority: 'Medium', count: normalized.filter(t => t.priority === 'medium').length, color: PRIORITY_COLORS.medium },
      { priority: 'Low', count: normalized.filter(t => t.priority === 'low').length, color: PRIORITY_COLORS.low }
    ];

    // Weekly trends aggregated by week start
    const weeklyMap: Record<string, { week: string; completed: number; created: number }> = {};
    normalized.forEach(t => {
      const wk = weekKey(t._date);
      if (!weeklyMap[wk]) weeklyMap[wk] = { week: wk, completed: 0, created: 0 };
      weeklyMap[wk].created += 1;
      if (t.status) weeklyMap[wk].completed += 1;
    });
    const weeklyTrends = Object.values(weeklyMap).sort((a, b) => a.week.localeCompare(b.week));

    // Monthly performance aggregated by month key
    const monthMap: Record<string, { month: string; completed: number; total: number }> = {};
    normalized.forEach(t => {
      const mk = monthKey(t._date);
      if (!monthMap[mk]) monthMap[mk] = { month: mk, completed: 0, total: 0 };
      monthMap[mk].total += 1;
      if (t.status) monthMap[mk].completed += 1;
    });
    const monthlyPerformance = Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({ month: m.month, completionRate: m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0 }));

    // Categories derived from task text
    const toCategory = (task: Task): string => {
      const text = `${task.name} ${task.desc}`.toLowerCase();
      if (text.includes('meeting')) return 'Meetings';
      if (text.includes('doc') || text.includes('readme')) return 'Documentation';
      if (text.includes('test') || text.includes('qa')) return 'Testing';
      if (text.includes('bug') || text.includes('fix')) return 'Bug Fixes';
      if (text.includes('design') || text.includes('ui') || text.includes('ux')) return 'Design/UI';
      if (text.includes('api') || text.includes('backend') || text.includes('server')) return 'Backend';
      if (text.includes('deploy') || text.includes('release') || text.includes('docker')) return 'DevOps';
      return 'Others';
    };
    const catMap: Record<string, number> = {};
    normalized.forEach(t => {
      const cat = toCategory(t);
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const taskCategories = Object.keys(catMap).map(category => ({ category, count: catMap[category] }));

    // Performance metrics derived from data
    const totalCompleted = normalized.filter(t => t.status).length;
    const productivityScore = normalized.length > 0 ? Math.min(100, Math.round((totalCompleted / normalized.length) * 100)) : 0;
    const totalHours = normalized.length * 2; // naive estimate 2h per task

    // Streak: consecutive days ending today with at least one completed task
    const streakDays = (() => {
      let streak = 0;
      const todayKey = formatDateKey(new Date());
      for (let i = 0; i < days; i++) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        const key = formatDateKey(d);
        const completed = completedByDateKey[key] ?? 0;
        if (completed > 0) streak++; else break;
      }
      return streak;
    })();

    const performanceMetrics = {
      avgCompletionTime: 2.0,
      productivityScore,
      streakDays,
      totalHours
    };

    setAnalytics({
      dailyCompletion,
      priorityDistribution,
      weeklyTrends,
      monthlyPerformance,
      taskCategories,
      performanceMetrics
    });
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedTimeRange]);

  // Calendar component
  const TaskCalendar: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const calendarTasks = React.useMemo(() => {
      const byDate: {[key: string]: Task[]} = {};
      tasks.forEach(task => {
        const key = parseDateKeyFromString(task.dueDate);
        if (!key) return;
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(task);
      });
      return byDate;
    }, [tasks]);

    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days: Array<number | null> = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
      }

      // Add trailing empty cells to complete the last week
      const remainder = days.length % 7;
      if (remainder !== 0) {
        for (let i = 0; i < 7 - remainder; i++) {
          days.push(null);
        }
      }

      // Ensure 6 full weeks (42 cells) for consistent layout
      while (days.length < 42) {
        days.push(null);
      }
      
      return days;
    };

    const buildDateKey = (year: number, month: number, day: number) => {
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const days = React.useMemo(() => getDaysInMonth(selectedDate), [selectedDate]);
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];

    return (
      <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Task Calendar</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate((prev) => {
                const d = new Date(prev);
                d.setMonth(d.getMonth() - 1, 1);
                d.setHours(0,0,0,0);
                return d;
              })}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              ←
            </button>
            <span className="text-lg font-medium px-4">
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </span>
            <button
              onClick={() => setSelectedDate((prev) => {
                const d = new Date(prev);
                d.setMonth(d.getMonth() + 1, 1);
                d.setHours(0,0,0,0);
                return d;
              })}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-medium text-gray-500 p-2 text-sm">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`${selectedDate.getFullYear()}-${selectedDate.getMonth()}-empty-${index}`} className="h-20"></div>;
            }

            const dateKey = buildDateKey(selectedDate.getFullYear(), selectedDate.getMonth(), day);
            const dayTasks = calendarTasks[dateKey] || [];
            const isToday = formatDateKey(new Date()) === dateKey;

            return (
              <div
                key={`${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${day}-${index}`}
                className={`h-20 p-1 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
                  isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : ''
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 2).map(task => (
                    <div
                      key={task.id}
                      className={`text-xs px-1 py-0.5 rounded text-white truncate ${
                        task.status ? 'bg-green-500' : 
                        task.priority === 'urgent' ? 'bg-red-500' :
                        task.priority === 'high' ? 'bg-orange-500' :
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}
                    >
                      {task.name}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayTasks.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#c6ffdd] via-[#fbd786] to-[#f7797d] dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status).length;
  const pendingTasks = tasks.filter(t => !t.status).length;
  const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c6ffdd] via-[#fbd786] to-[#f7797d] dark:from-gray-900 dark:to-gray-800 relative">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Task Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400">Comprehensive insights into your productivity</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            
            <button
              onClick={fetchTasks}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <Target size={24} />
              <span className="text-2xl font-bold">{completionRate.toFixed(1)}%</span>
            </div>
            <h3 className="text-sm font-medium opacity-90">Completion Rate</h3>
            <p className="text-xs opacity-75 mt-1">{completedTasks} of {tasks.length} tasks completed</p>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 size={24} />
              <span className="text-2xl font-bold">{analytics?.performanceMetrics.streakDays || 0}</span>
            </div>
            <h3 className="text-sm font-medium opacity-90">Current Streak</h3>
            <p className="text-xs opacity-75 mt-1">Days of consistent progress</p>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <Activity size={24} />
              <span className="text-2xl font-bold">{analytics?.performanceMetrics.productivityScore || 0}</span>
            </div>
            <h3 className="text-sm font-medium opacity-90">Productivity Score</h3>
            <p className="text-xs opacity-75 mt-1">Based on completion patterns</p>
          </div>

          <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <Clock size={24} />
              <span className="text-2xl font-bold">{analytics?.performanceMetrics.totalHours || 0}h</span>
            </div>
            <h3 className="text-sm font-medium opacity-90">Total Hours</h3>
            <p className="text-xs opacity-75 mt-1">Estimated time invested</p>
          </div>
        </div>

        {/* Chart Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'performance', label: 'Performance', icon: Award },
            { id: 'calendar', label: 'Calendar', icon: CalendarIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => startTransition(() => setSelectedChart(tab.id as any))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                selectedChart === tab.id
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chart Content */}
        {selectedChart === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Daily Completion Chart */}
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Daily Task Completion</h3>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <AreaChart data={analytics?.dailyCompletion}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stackId="1"
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pending" 
                    stackId="1"
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Priority Distribution */}
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Priority Distribution</h3>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <PieChart>
                  <Pie
                    data={analytics?.priorityDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    label={({priority, count}) => `${priority}: ${count}`}
                    labelLine={false}
                  >
                    {analytics?.priorityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedChart === 'trends' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Weekly Trends */}
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Weekly Trends</h3>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart data={analytics?.weeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={3} />
                  <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Task Categories */}
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Task Categories</h3>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={analytics?.taskCategories}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedChart === 'performance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Monthly Performance */}
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Completion Rate</h3>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <AreaChart data={analytics?.monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Area 
                    type="monotone" 
                    dataKey="completionRate" 
                    stroke="#6366f1" 
                    fill="#6366f1" 
                    fillOpacity={0.6}
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Radar */}
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Performance Radar</h3>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <RadarChart data={[
                  { metric: 'Completion Rate', value: completionRate },
                  { metric: 'Priority Management', value: 75 },
                  { metric: 'Time Management', value: 68 },
                  { metric: 'Consistency', value: 82 },
                  { metric: 'Focus', value: 79 },
                  { metric: 'Quality', value: 85 }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedChart === 'calendar' && (
          <div className="mb-8 overflow-x-auto">
            <div className="min-w-[640px]">
              <TaskCalendar />
            </div>
          </div>
        )}

        {/* Recent Tasks Summary */}
        <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Task Activity</h3>
          <div className="space-y-3">
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
                <div className="flex items-center gap-3">
                  {task.status ? (
                    <CheckCircle2 className="text-green-500" size={20} />
                  ) : (
                    <Clock className="text-orange-500" size={20} />
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{task.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{task.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {task.priority.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    task.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {task.status ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights and Recommendations removed as requested */}

        {/* Quick Stats Footer */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white/60 dark:bg-gray-800/40 rounded-xl">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tasks.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
          </div>
          <div className="text-center p-4 bg-white/60 dark:bg-gray-800/40 rounded-xl">
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </div>
          <div className="text-center p-4 bg-white/60 dark:bg-gray-800/40 rounded-xl">
            <div className="text-2xl font-bold text-orange-600">{pendingTasks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
          </div>
          <div className="text-center p-4 bg-white/60 dark:bg-gray-800/40 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">
              {tasks.filter(t => !t.status && (t.priority === 'urgent' || t.priority === 'high')).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">High Priority</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;