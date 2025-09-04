import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Cloud, 
  Clock, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Mic, 
  MicOff,
  Play,
  Pause,
  Square,
  Calendar,
  TrendingUp,
  Users,
  Settings,
  Zap,
  Lightbulb,
  Shield,
  BarChart3,
  Timer,
  Coffee,
  Sun,
  Moon,
  Wind,
  CloudRain
} from 'lucide-react';
import AIService, { 
  TaskGroup, 
  WeatherSuggestion, 
  SmartSuggestion, 
  TaskConflict, 
  BreakTimer, 
  VoiceCommand, 
  WeeklyPrediction,
  FocusRecommendations
} from '../services/AIService';
import VoiceCommands from '../components/VoiceCommands';
import WeatherService from '../services/WeatherService';
import ErrorBoundary from '../components/ErrorBoundary';

interface Task {
  id: number;
  name: string;
  desc: string;
  dueDate: string;
  status: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface BreakTimerData {
  duration: number;
  activity: string;
  benefits: string[];
}

const API_URL = "http://localhost:8080/api/tasks";

const AITaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // AI Features State
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [weatherSuggestions, setWeatherSuggestions] = useState<WeatherSuggestion[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [taskConflicts, setTaskConflicts] = useState<TaskConflict[]>([]);
  const [weeklyPrediction, setWeeklyPrediction] = useState<WeeklyPrediction | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Focus Mode State
  const [focusMode, setFocusMode] = useState(false);
  const [focusSession, setFocusSession] = useState<any>(null);
  const [focusTimer, setFocusTimer] = useState(0);
  const [focusInterval, setFocusInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Break Timer State
  const [breakTimer, setBreakTimer] = useState<BreakTimer | null>(null);
  const [breakTime, setBreakTime] = useState(0);
  const [breakInterval, setBreakInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Voice Command State
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  
  // Weather State
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [location, setLocation] = useState('default');

  // Load tasks from backend
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setAiError(null);
      
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      const tasksWithPriority = data.map((task: any) => ({
        ...task,
        priority: task.priority || 'medium'
      }));
      
      setTasks(tasksWithPriority);
      await loadAIFeatures(tasksWithPriority);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setTasks([]);
      setAiError('Failed to load tasks. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAIFeatures = async (taskData: Task[]) => {
    try {
      const [
        groups,
        weather,
        suggestions,
        conflicts,
        prediction,
        weatherData
      ] = await Promise.allSettled([
        AIService.groupTasksByAI(taskData),
        AIService.getWeatherSuggestions(taskData, location),
        AIService.getSmartSuggestions(taskData),
        AIService.resolveTaskConflicts(taskData),
        AIService.predictWeeklyTasks(taskData),
        WeatherService.getCurrentWeather() // FIX: Removed the 'location' argument
      ]);

      // Handle successful results
      if (groups.status === 'fulfilled') setTaskGroups(groups.value);
      if (weather.status === 'fulfilled') setWeatherSuggestions(weather.value);
      if (suggestions.status === 'fulfilled') setSmartSuggestions(suggestions.value);
      if (conflicts.status === 'fulfilled') setTaskConflicts(conflicts.value);
      if (prediction.status === 'fulfilled') setWeeklyPrediction(prediction.value);
      if (weatherData.status === 'fulfilled') setCurrentWeather(weatherData.value);

      // Log any failed requests
      [groups, weather, suggestions, conflicts, prediction, weatherData].forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`AI feature ${index} failed:`, result.reason);
        }
      });
    } catch (error) {
      console.error('Failed to load AI features:', error);
    }
  };

  const startFocusMode = async () => {
    try {
      // Try to get AI recommendations, but provide fallback if it fails
      let focusRecommendations: FocusRecommendations;
      try {
        focusRecommendations = await AIService.getFocusModeRecommendations(tasks);
      } catch (error) {
        console.log('AI focus recommendations failed, using fallback:', error);
        // Fallback: select the first urgent task, or first pending task
        const urgentTask = tasks.find(t => t.priority === 'urgent' && !t.status);
        const pendingTask = tasks.find(t => !t.status);
        const recommendedTask = urgentTask || pendingTask;
        
        if (recommendedTask) {
          focusRecommendations = {
            recommendedTask: recommendedTask.id,
            duration: 25,
            environment: 'Quiet workspace with minimal distractions',
            distractions: ['Phone notifications', 'Social media', 'Email']
          };
        } else {
          // No tasks available
          alert('No tasks available for focus mode. Please add some tasks first.');
          return;
        }
      }

      const recommendedTask = tasks.find(t => t.id === focusRecommendations.recommendedTask);
      
      if (recommendedTask) {
        setFocusMode(true);
        setFocusSession({
          taskId: recommendedTask.id,
          taskName: recommendedTask.name,
          duration: focusRecommendations.duration || 25,
          startTime: new Date(),
          environment: focusRecommendations.environment || 'Quiet workspace',
          distractions: focusRecommendations.distractions || ['Phone', 'Social media', 'Email']
        });
        setFocusTimer((focusRecommendations.duration || 25) * 60);
        
        const interval = setInterval(() => {
          setFocusTimer(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              endFocusMode();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        setFocusInterval(interval);
      } else {
        alert('No suitable task found for focus mode. Please add some tasks first.');
      }
    } catch (error) {
      console.error('Error starting focus mode:', error);
      alert('Failed to start focus mode. Please try again.');
    }
  };

  const endFocusMode = () => {
    setFocusMode(false);
    setFocusSession(null);
    setFocusTimer(0);
    if (focusInterval) {
      clearInterval(focusInterval);
      setFocusInterval(null);
    }
    startBreakTimer();
  };

  const startBreakTimer = async () => {
    try {
      // Try to get AI break timer suggestions, but provide fallback if it fails
      let breakTimerData: BreakTimerData;
      try {
        const aiBreakTimer = await AIService.suggestBreakTimer({});
        // Convert AI response to our format
        breakTimerData = {
          duration: aiBreakTimer.duration || 5,
          activity: aiBreakTimer.activity || 'Take a short break to stretch and refresh',
          benefits: aiBreakTimer.benefits || ['Reduces eye strain', 'Improves focus', 'Boosts productivity']
        };
      } catch (error) {
        console.log('AI break timer failed, using fallback:', error);
        // Fallback: 5-minute break
        breakTimerData = {
          duration: 5,
          activity: 'Take a short break to stretch and refresh',
          benefits: ['Reduces eye strain', 'Improves focus', 'Boosts productivity']
        };
      }

      // Convert to BreakTimer format for state
      const breakTimerForState: BreakTimer = {
        id: Date.now().toString(),
        startTime: new Date(),
        endTime: new Date(Date.now() + breakTimerData.duration * 60 * 1000),
        duration: breakTimerData.duration,
        type: 'short',
        activity: breakTimerData.activity,
        benefits: breakTimerData.benefits
      };

      setBreakTimer(breakTimerForState);
      setBreakTime(breakTimerData.duration * 60);
      
      const interval = setInterval(() => {
        setBreakTime(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            endBreakTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setBreakInterval(interval);
    } catch (error) {
      console.error('Error starting break timer:', error);
      // Still show a basic break timer even if AI fails
      const fallbackBreak: BreakTimer = {
        id: Date.now().toString(),
        startTime: new Date(),
        endTime: new Date(Date.now() + 5 * 60 * 1000),
        duration: 5,
        type: 'short',
        activity: 'Take a short break',
        benefits: ['Rest your eyes', 'Stretch', 'Stay hydrated']
      };
      setBreakTimer(fallbackBreak);
      setBreakTime(5 * 60);
      
      const interval = setInterval(() => {
        setBreakTime(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            endBreakTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setBreakInterval(interval);
    }
  };

  const endBreakTimer = () => {
    setBreakTimer(null);
    setBreakTime(0);
    if (breakInterval) {
      clearInterval(breakInterval);
      setBreakInterval(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-200 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading AI Task Manager...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Error Display */}
      {aiError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={20} />
            <p className="text-red-800 dark:text-red-200">{aiError}</p>
            <button
              onClick={() => setAiError(null)}
              className="ml-auto text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Brain className="text-purple-600" size={32} />
            AI Task Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Intelligent task management powered by AI
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTasks}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'overview', name: 'Overview', icon: <BarChart3 size={18} /> },
          { id: 'groups', name: 'AI Groups', icon: <Users size={18} /> },
          { id: 'weather', name: 'Weather AI', icon: <Cloud size={18} /> },
                  { id: 'suggestions', name: 'Smart Suggestions', icon: <Lightbulb size={18} /> },
        { id: 'prediction', name: 'Weekly Prediction', icon: <TrendingUp size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/80 dark:bg-gray-900/60 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Task Statistics */}
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Task Statistics</h3>
              <BarChart3 className="text-purple-600" size={24} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Tasks</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{tasks.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Completed</span>
                <span className="font-semibold text-green-600">{tasks.filter(t => t.status).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Pending</span>
                <span className="font-semibold text-orange-600">{tasks.filter(t => !t.status).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Urgent</span>
                <span className="font-semibold text-red-600">{tasks.filter(t => t.priority === 'urgent' && !t.status).length}</span>
              </div>
            </div>
          </div>

          {/* AI Groups Summary */}
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Groups</h3>
              <Users className="text-blue-600" size={24} />
            </div>
            <div className="space-y-3">
              {taskGroups.slice(0, 4).map(group => (
                <div key={group.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="text-gray-600 dark:text-gray-400">{group.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{group.tasks.length}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Suggestions Summary */}
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Smart Suggestions</h3>
              <Lightbulb className="text-yellow-600" size={24} />
            </div>
            <div className="space-y-3">
              {smartSuggestions.slice(0, 3).map((suggestion, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Zap className="text-yellow-500" size={16} />
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {suggestion.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Break Timer */}
          {breakTimer && (
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Break Time</h3>
                <Coffee className="text-orange-600" size={24} />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {formatTime(breakTime)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Take a break and recharge!
                </p>
                <button
                  onClick={endBreakTimer}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm"
                >
                  End Break
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Groups Tab */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {taskGroups && taskGroups.length > 0 ? taskGroups.map(group => (
            <div key={group.id} className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: group.color }}
                />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{group.name}</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{group.description}</p>
              <div className="space-y-2">
                {group.tasks.slice(0, 5).map(taskId => {
                  const task = tasks.find(t => t.id === taskId);
                  return task ? (
                    <div key={taskId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{task.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )) : (
            <div className="col-span-full bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 text-center">
              <Users className="text-gray-400 mx-auto mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Task Groups</h3>
              <p className="text-gray-600 dark:text-gray-400">AI will group your tasks once you have some tasks available.</p>
            </div>
          )}
        </div>
      )}

      {/* Weather AI Tab */}
      {activeTab === 'weather' && (
        <div className="space-y-6">
          {currentWeather ? (
            <>
              {/* Current Weather */}
              <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Current Weather</h3>
                  <div className="text-3xl">{WeatherService.getWeatherIcon(currentWeather.condition)}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {currentWeather.temperature}°C
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 capitalize">
                      {currentWeather.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {currentWeather.location}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Humidity</span>
                      <span className="text-gray-900 dark:text-gray-100">{currentWeather.humidity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Wind Speed</span>
                      <span className="text-gray-900 dark:text-gray-100">{currentWeather.windSpeed} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Type</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        currentWeather.isIndoor ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {currentWeather.isIndoor ? 'Indoor' : 'Outdoor'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Suggestions */}
              {weatherSuggestions && weatherSuggestions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {weatherSuggestions.map((suggestion, index) => (
                    <div key={index} className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-2xl">{WeatherService.getWeatherIcon(suggestion.weather)}</div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                          {suggestion.weather} Weather
                        </h4>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{suggestion.suggestion}</p>
                      <div className="space-y-2">
                        {suggestion.tasks.slice(0, 3).map(taskId => {
                          const task = tasks.find(t => t.id === taskId);
                          return task ? (
                            <div key={taskId} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <CheckCircle className="text-green-500" size={16} />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{task.name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Task Categorization */}
              <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Task Categorization</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {(() => {
                    const categorized = WeatherService.getCategorizedTasks(tasks);
                    return [
                      { 
                        title: 'Indoor Tasks', 
                        tasks: categorized.indoor, 
                        color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
                        icon: '🏠'
                      },
                      { 
                        title: 'Outdoor Tasks', 
                        tasks: categorized.outdoor, 
                        color: 'bg-green-50 dark:bg-green-900/20 text-green-600',
                        icon: '🌳'
                      },
                      { 
                        title: 'Flexible Tasks', 
                        tasks: categorized.flexible, 
                        color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
                        icon: '🔄'
                      }
                    ].map((category, index) => (
                      <div key={index} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{category.icon}</span>
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100">{category.title}</h5>
                        </div>
                        <div className="text-2xl font-bold mb-2">{category.tasks.length}</div>
                        <div className="space-y-1">
                          {category.tasks.slice(0, 3).map(task => (
                            <div key={task.id} className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {task.name}
                            </div>
                          ))}
                          {category.tasks.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{category.tasks.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Weather-based Task Recommendations */}
              <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Weather-based Recommendations</h4>
                <div className="space-y-3">
                  {WeatherService.getWeatherSuggestions(currentWeather, tasks).map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Lightbulb className="text-yellow-500 mt-1" size={16} />
                      <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 text-center">
              <Cloud className="text-gray-400 mx-auto mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Weather Data Unavailable</h3>
              <p className="text-gray-600 dark:text-gray-400">Weather information will be available once the AI service is connected.</p>
            </div>
          )}
        </div>
      )}

      {/* Focus Mode Tab */}
      {activeTab === 'focus' && (
        <div className="space-y-6">
          {focusMode ? (
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 text-center">
              <div className="mb-6">
                <div className="text-6xl font-bold text-green-600 mb-4">
                  {formatTime(focusTimer)}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Focus Session Active
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Working on: {focusSession?.taskName}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Environment</h4>
                  <p className="text-gray-600 dark:text-gray-400">{focusSession?.environment}</p>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Avoid Distractions</h4>
                  <ul className="text-gray-600 dark:text-gray-400 text-sm">
                    {focusSession?.distractions?.map((distraction: string, index: number) => (
                      <li key={index}>• {distraction}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <button
                onClick={endFocusMode}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 mx-auto"
              >
                <Square size={20} />
                End Session
              </button>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 text-center">
              <Target className="text-green-600 mx-auto mb-4" size={64} />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Ready to Focus?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                AI will recommend the best task and optimal focus settings for maximum productivity.
              </p>
              <button
                onClick={startFocusMode}
                className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-lg font-semibold transition-all duration-200 mx-auto"
              >
                <Play size={24} />
                Start Focus Mode
              </button>
            </div>
          )}
        </div>
      )}

      {/* Smart Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {smartSuggestions && smartSuggestions.length > 0 ? smartSuggestions.map((suggestion, index) => (
            <div key={index} className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  suggestion.type === 'recurring' ? 'bg-blue-100 text-blue-600' :
                  suggestion.type === 'scheduling' ? 'bg-green-100 text-green-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  <Lightbulb size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {suggestion.title}
                  </h4>
                  <p className="text-sm text-gray-500 capitalize">{suggestion.type}</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{suggestion.description}</p>
              <div className="space-y-2 mb-4">
                {suggestion.tasks.slice(0, 3).map(taskId => {
                  const task = tasks.find(t => t.id === taskId);
                  return task ? (
                    <div key={taskId} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <CheckCircle className="text-green-500" size={16} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{task.name}</span>
                    </div>
                  ) : null;
                })}
              </div>
              <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200">
                {suggestion.action}
              </button>
            </div>
          )) : (
            <div className="col-span-full bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 text-center">
              <Lightbulb className="text-gray-400 mx-auto mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Smart Suggestions</h3>
              <p className="text-gray-600 dark:text-gray-400">AI will provide smart suggestions once you have more tasks and patterns to analyze.</p>
            </div>
          )}
        </div>
      )}

      

      {/* Weekly Prediction Tab */}
      {activeTab === 'prediction' && (
        <div className="space-y-6">
          {weeklyPrediction ? (
            <>
              <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-4 mb-6">
                  <TrendingUp className="text-purple-600" size={32} />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Weekly Prediction
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{weeklyPrediction.week}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {weeklyPrediction.predictedTasks}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Predicted Tasks</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {weeklyPrediction.predictedCompletion.toFixed(1)}%
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Completion Rate</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {tasks.filter(t => !t.status).length}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Current Pending</p>
                  </div>
                </div>

                {weeklyPrediction.predictedTaskIds && weeklyPrediction.predictedTaskIds.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Predicted Tasks</h4>
                    <div className="space-y-2">
                      {weeklyPrediction.predictedTaskIds.map((taskId) => {
                        const task = tasks.find(t => t.id === taskId);
                        return task ? (
                          <div key={taskId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{task.name}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">AI Recommendations</h4>
                <div className="space-y-3">
                  {weeklyPrediction.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Lightbulb className="text-yellow-500 mt-1" size={16} />
                      <p className="text-gray-700 dark:text-gray-300">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 text-center">
              <TrendingUp className="text-gray-400 mx-auto mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Weekly Prediction Unavailable</h3>
              <p className="text-gray-600 dark:text-gray-400">AI predictions will be available once you have more task history to analyze.</p>
            </div>
          )}
        </div>
      )}

      {/* Voice Commands Tab */}
      {activeTab === 'voice' && (
        <div className="space-y-6">
          <VoiceCommands 
            onCommandProcessed={(command) => {
              console.log('Voice command processed:', command);
              // Handle the command here
            }}
            tasks={tasks}
          />
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
};

export default AITaskManager;