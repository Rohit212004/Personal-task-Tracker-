import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Circle, Plus, Edit2, Trash2, AlertCircle, Clock, Star, Bell } from "lucide-react";

interface TodoItem {
  id: number;
  name: string;
  desc: string;
  dueDate: string;
  status: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const API_URL = "http://localhost:8080/api/tasks";

const Todo: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [toggleSubmit, setToggleSubmit] = useState(true);
  const [isEditItem, setIsEditItem] = useState<number | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [deleteMessage, setDeleteMessage] = useState(false);
  const [inputTitle, setInputTitle] = useState("");
  const [inputDesc, setInputDesc] = useState("");
  const [inputDueDate, setInputDueDate] = useState("");
  const [inputPriority, setInputPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [items, setItems] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Helpers
  const getTodayLocalISO = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayISO = getTodayLocalISO();

  // Load tasks from backend
  useEffect(() => {
    fetchTasks();
  }, []);
  useEffect(() => {
    const editId = searchParams.get('editId');
    if (editId && items.length > 0) {
      const idNum = parseInt(editId, 10);
      const task = items.find(t => t.id === idNum);
      if (task) {
        setInputTitle(task.name);
        setInputDesc(task.desc);
        setInputDueDate(task.dueDate);
        setInputPriority(task.priority);
        setIsEditItem(task.id);
        setToggleSubmit(false);
        setShowForm(true);
      }
    }
  }, [searchParams, items]);

  // Check for priority notifications
  useEffect(() => {
    checkNotifications();
  }, [items]);



  // Save to localStorage as backup
  const saveToLocalStorage = (tasks: TodoItem[]) => {
    try {
      localStorage.setItem('todoTasks', JSON.stringify(tasks));
      localStorage.setItem('todoTasksTimestamp', Date.now().toString());
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  };

  // Load from localStorage as fallback
  const loadFromLocalStorage = (): TodoItem[] | null => {
    try {
      const savedTasks = localStorage.getItem('todoTasks');
      const timestamp = localStorage.getItem('todoTasksTimestamp');
      
      if (savedTasks && timestamp) {
        const timeDiff = Date.now() - parseInt(timestamp);
        // Use localStorage data if it's less than 1 hour old
        if (timeDiff < 3600000) {
          return JSON.parse(savedTasks);
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
    return null;
  };

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Debug: Log what we get from backend
      console.log('Raw data from backend:', data);
      
      // Ensure priority field exists for all tasks
      const tasksWithPriority = data.map((task: any, index: number) => {
        const priority = task.priority || 'medium';
        console.log(`Task ${task.id || index}: priority = ${priority}`);
        
        return {
          ...task,
          priority: priority as 'low' | 'medium' | 'high' | 'urgent'
        };
      });
      
      console.log('Processed tasks with priority:', tasksWithPriority);
      
      setItems(tasksWithPriority);
      saveToLocalStorage(tasksWithPriority); // Backup to localStorage
      setError(null);
      
    } catch (err) {
      console.error("Failed to load tasks from API:", err);
      setError("Failed to load tasks from server");
      
      // Try to load from localStorage first
      const localTasks = loadFromLocalStorage();
      if (localTasks && localTasks.length > 0) {
        console.log('Loading tasks from localStorage backup:', localTasks);
        setItems(localTasks);
      } else {
        // Fallback to mock data
        console.log('Using fallback mock data');
        const mockTasks = [
          { id: 1, name: "Review project proposal", desc: "Review the Q4 project proposal", dueDate: new Date().toISOString().split('T')[0], status: false, priority: 'high' as const },
          { id: 2, name: "Update documentation", desc: "Update API documentation", dueDate: new Date().toISOString().split('T')[0], status: true, priority: 'medium' as const },
          { id: 3, name: "Team meeting", desc: "Weekly team sync meeting", dueDate: new Date().toISOString().split('T')[0], status: false, priority: 'urgent' as const },
          { id: 4, name: "Code review", desc: "Review pull requests", dueDate: new Date().toISOString().split('T')[0], status: false, priority: 'low' as const },
        ];
        setItems(mockTasks);
        saveToLocalStorage(mockTasks);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkNotifications = () => {
    const today = new Date();
    const urgentTasks = items.filter(task => {
      if (task.status) return false;
      const dueDate = new Date(task.dueDate);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      return (
        (task.priority === 'urgent' && daysDiff <= 1) ||
        (task.priority === 'high' && daysDiff <= 2) ||
        (task.priority === 'medium' && daysDiff <= 0) ||
        (task.priority === 'low' && daysDiff < 0)
      );
    });

    if (urgentTasks.length > 0 && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          urgentTasks.forEach(task => {
            new Notification(`Task Due: ${task.name}`, {
              body: `Priority: ${task.priority.toUpperCase()} - Due: ${task.dueDate}`,
              icon: '/favicon.ico'
            });
          });
        }
      });
    }
  };

  // INPUT HANDLERS
  const handleInput = (e: ChangeEvent<HTMLInputElement>) => setInputTitle(e.target.value);
  const handleInputDesc = (e: ChangeEvent<HTMLInputElement>) => setInputDesc(e.target.value);
  const handleDueDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && value < todayISO) {
      alert('Due date cannot be in the past. It has been set to today.');
      setInputDueDate(todayISO);
      return;
    }
    setInputDueDate(value);
  };
  const handlePriorityChange = (e: ChangeEvent<HTMLSelectElement>) => setInputPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent');

  // Toggle task completion
  const handleToggleComplete = async (id: number) => {
    const task = items.find(t => t.id === id);
    if (!task) return;

    const updatedTask = { ...task, status: !task.status };

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const newItems = items.map(t => t.id === id ? updatedTask : t);
      setItems(newItems);
      saveToLocalStorage(newItems); // Update localStorage backup
      
    } catch (error) {
      console.error("Error updating task:", error);
      // Update locally even if API fails
      const newItems = items.map(t => t.id === id ? updatedTask : t);
      setItems(newItems);
      saveToLocalStorage(newItems);
    }
  };

  // SUBMIT FORM
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputTitle || !inputDesc || !inputDueDate) {
      alert("Please fill all fields");
      return;
    }
    if (inputDueDate < todayISO) {
      alert('Due date cannot be in the past');
      return;
    }

    if (!toggleSubmit && isEditItem !== null) {
      // Edit existing task
      const updatedTask: TodoItem = {
        id: isEditItem,
        name: inputTitle,
        desc: inputDesc,
        dueDate: inputDueDate,
        status: false,
        priority: inputPriority,
      };

      console.log('Updating task with priority:', updatedTask.priority);

      try {
        const res = await fetch(`${API_URL}/${isEditItem}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTask),
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const responseData = await res.json();
        console.log('Server response after update:', responseData);
        
        // Use server response if available, otherwise use our updated task
        const finalTask = responseData && responseData.id ? {
          ...responseData,
          priority: responseData.priority || updatedTask.priority
        } : updatedTask;
        
        const newItems = items.map((t) => (t.id === isEditItem ? finalTask : t));
        setItems(newItems);
        saveToLocalStorage(newItems);
        resetForm();
        
      } catch (error) {
        console.error("Error updating task:", error);
        // Update locally even if API fails
        const newItems = items.map((t) => (t.id === isEditItem ? updatedTask : t));
        setItems(newItems);
        saveToLocalStorage(newItems);
        resetForm();
        alert("Task updated locally. Server sync failed.");
      }
      // Return to dashboard after update
      navigate('/home');
    } else {
      // Add new task
      const newTask = {
        name: inputTitle,
        desc: inputDesc,
        dueDate: inputDueDate,
        status: false,
        priority: inputPriority,
      };

      console.log('Creating new task with priority:', newTask.priority);

      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTask),
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const savedTask = await res.json();
        console.log('Server response after creation:', savedTask);
        
        // Ensure the saved task has the correct priority
        const taskWithPriority = {
          ...savedTask,
          priority: savedTask.priority || newTask.priority
        };
        
        const newItems = [taskWithPriority, ...items];
        setItems(newItems);
        saveToLocalStorage(newItems);
        resetForm();
        
      } catch (error) {
        console.error("Error saving task:", error);
        // Create task locally with temporary ID if API fails
        const tempTask = {
          ...newTask,
          id: Date.now(), // Temporary ID
        };
        const newItems = [tempTask, ...items];
        setItems(newItems);
        saveToLocalStorage(newItems);
        resetForm();
        alert("Task created locally. Server sync failed.");
      }
      // Return to dashboard after create
      navigate('/home');
    }
  };

  // RESET FORM
  const resetForm = () => {
    setInputTitle("");
    setInputDesc("");
    setInputDueDate("");
    setInputPriority('medium');
    setToggleSubmit(true);
    setShowForm(false);
    setIsEditItem(null);
  };

  // DELETE
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const newItems = items.filter((t) => t.id !== id);
      setItems(newItems);
      saveToLocalStorage(newItems);
      setDeleteMessage(true);
      setTimeout(() => setDeleteMessage(false), 2000);
      
    } catch (error) {
      console.error("Error deleting task:", error);
      // Delete locally even if API fails
      const newItems = items.filter((t) => t.id !== id);
      setItems(newItems);
      saveToLocalStorage(newItems);
      setDeleteMessage(true);
      setTimeout(() => setDeleteMessage(false), 2000);
      alert("Task deleted locally. Server sync failed.");
    }
  };

  // EDIT
  const handleEdit = (id: number) => {
    const task = items.find((t) => t.id === id);
    if (task) {
      console.log('Editing task with priority:', task.priority);
      setInputTitle(task.name);
      setInputDesc(task.desc);
      setInputDueDate(task.dueDate);
      setInputPriority(task.priority || 'medium');
      setIsEditItem(task.id);
      setToggleSubmit(false);
      setShowForm(true);
    }
  };

  // ADD NEW TASK
  const handleAdd = () => {
    setShowForm(true);
    setInputTitle("");
    setInputDesc("");
    setInputDueDate("");
    setInputPriority('medium');
    setToggleSubmit(true);
    setIsEditItem(null);
  };

  // Get priority stats - with safety checks
  const totalTasks = items.length;
  const completedTasks = items.filter(t => t.status).length;
  const pendingTasks = items.filter(t => !t.status).length;
  const urgentTasks = items.filter(t => !t.status && (t.priority === 'urgent')).length;
  const highTasks = items.filter(t => !t.status && (t.priority === 'high')).length;
  const mediumTasks = items.filter(t => !t.status && (t.priority === 'medium')).length;
  const lowTasks = items.filter(t => !t.status && (t.priority === 'low')).length;

  // Safe priority functions with fallbacks
  const getPriorityColor = (priority: string | undefined) => {
    const safePriority = priority || 'medium';
    switch (safePriority) {
      case 'urgent': return 'text-white bg-gradient-to-r from-red-500 to-pink-500 border-red-400 shadow-sm';
      case 'high': return 'text-white bg-gradient-to-r from-orange-500 to-red-500 border-orange-400 shadow-sm';
      case 'medium': return 'text-white bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-400 shadow-sm';
      case 'low': return 'text-white bg-gradient-to-r from-green-500 to-emerald-500 border-green-400 shadow-sm';
      default: return 'text-white bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-400 shadow-sm';
    }
  };

  const getPriorityIcon = (priority: string | undefined) => {
    const safePriority = priority || 'medium';
    switch (safePriority) {
      case 'urgent': return <AlertCircle size={16} className="text-white" />;
      case 'high': return <Star size={16} className="text-white" />;
      case 'medium': return <Clock size={16} className="text-white" />;
      case 'low': return <Circle size={16} className="text-white" />;
      default: return <Circle size={16} className="text-white" />;
    }
  };

  const getPriorityText = (priority: string | undefined) => {
    const safePriority = priority || 'medium';
    return safePriority.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-200 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c6ffdd] via-[#fbd786] to-[#f7797d] dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your tasks and priorities efficiently.</p>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-amber-600 text-sm">
              <AlertCircle size={16} />
              <span>Using offline data - API connection failed</span>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
        >
          <Plus size={18} />
          Add New Task
        </button>
      </div>

      {/* Priority Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm dark:backdrop-blur-none p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Total Tasks</h3>
            <div className="p-2 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700">
              <Circle className="text-white" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalTasks}</p>
          <p className="text-sm text-gray-500 mt-1">all tasks</p>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm dark:backdrop-blur-none p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Completed</h3>
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
              <CheckCircle2 className="text-white" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{completedTasks}</p>
          <p className="text-sm text-gray-500 mt-1">tasks done</p>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm dark:backdrop-blur-none p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Pending</h3>
            <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600">
              <Clock className="text-white" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{pendingTasks}</p>
          <p className="text-sm text-gray-500 mt-1">remaining</p>
        </div>

        <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm dark:backdrop-blur-none p-6 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">High Priority</h3>
            <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-600">
              <Bell className="text-white" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{urgentTasks + highTasks}</p>
          <p className="text-sm text-gray-500 mt-1">urgent + high</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Task Form */}
        {showForm && (
          <div className="xl:col-span-1 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm dark:backdrop-blur-none p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              {toggleSubmit ? "Add New Task" : "Edit Task"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  placeholder="Enter task title"
                  onChange={handleInput}
                  value={inputTitle}
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  placeholder="Enter task description"
                  onChange={handleInputDesc}
                  value={inputDesc}
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  onChange={handleDueDateChange}
                  value={inputDueDate}
                  min={todayISO}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={inputPriority}
                  onChange={handlePriorityChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all text-gray-900 dark:text-gray-100"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3 px-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {toggleSubmit ? "Save Task" : "Update & Go Home"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-700 dark:text-gray-100 rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Task List */}
        <div className={`${showForm ? 'xl:col-span-2' : 'xl:col-span-3'} bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm dark:backdrop-blur-none p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Your Tasks</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {items.length} tasks • {completedTasks} completed • {pendingTasks} pending
              </p>
            </div>
          </div>

          {deleteMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-center">
              Task deleted successfully!
            </div>
          )}

          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-500 text-lg">No tasks yet!</p>
              <p className="text-gray-400 text-sm mt-1">Add your first task to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((elem) => (
                <div
                  key={elem.id}
                  className="group p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md backdrop-blur-sm dark:backdrop-blur-none transition-all duration-200 bg-white/60 dark:bg-gray-900/60"
                >
                  <div className="flex items-center gap-4">
                    {/* Clickable completion circle */}
                    <button
                      onClick={() => handleToggleComplete(elem.id)}
                      className="flex-shrink-0 hover:scale-110 transition-transform"
                    >
                      {elem.status ? (
                        <CheckCircle2 className="text-green-500" size={24} />
                      ) : (
                        <Circle className="text-gray-400 hover:text-blue-500" size={24} />
                      )}
                    </button>

                    {/* Task content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${elem.status ? "text-gray-500 line-through" : "text-gray-900"}`}>
                          #{elem.id} - {elem.name}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(elem.priority)}`}>
                          {getPriorityIcon(elem.priority)}
                          {getPriorityText(elem.priority)}
                        </span>
                      </div>
                      <p className={`text-sm ${elem.status ? "text-gray-400" : "text-gray-600"} mb-1`}>
                        {elem.desc}
                      </p>
                      <p className="text-xs text-gray-400">
                        Due: {new Date(elem.dueDate).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(elem.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(elem.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
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

export default Todo;