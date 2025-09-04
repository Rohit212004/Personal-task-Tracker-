import { GoogleGenerativeAI } from '@google/generative-ai';

// Types for AI features
export interface TaskGroup {
  id: string;
  name: string;
  description: string;
  tasks: number[];
  color: string;
}

export interface WeatherSuggestion {
  weather: string;
  suggestion: string;
  tasks: number[];
}

export interface SmartSuggestion {
  type: 'recurring' | 'scheduling' | 'optimization';
  title: string;
  description: string;
  action: string;
  tasks: number[];
}

export interface FocusSession {
  id: string;
  taskId: number;
  duration: number; // in minutes
  startTime: Date;
  endTime: Date;
  completed: boolean;
}

export interface TaskConflict {
  taskId1: number;
  taskId2: number;
  conflictType: 'time' | 'priority' | 'resource';
  description: string;
  resolution: string;
}

export interface BreakTimer {
  id: string;
  duration: number; // in minutes
  startTime: Date;
  endTime: Date;
  type: 'short' | 'long';
  activity: string;
  benefits: string[];
}

export interface VoiceCommand {
  command: string;
  action: string;
  parameters: any;
  response?: string;
}

export interface WeeklyPrediction {
  week: string;
  predictedTasks: number;
  predictedCompletion: number;
  recommendations: string[];
  predictedTaskIds?: number[];
}

export interface FocusRecommendations {
  recommendedTask: number;
  duration: number;
  environment: string;
  distractions: string[];
  technique?: string;
}

class AIService {
  private ai: GoogleGenerativeAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY || null;
    if (this.apiKey) {
      this.ai = new GoogleGenerativeAI(this.apiKey);
    }
  }

  private async generateAIResponse(prompt: string): Promise<string | null> {
    if (!this.ai) return null;
    
    try {
      const model = this.ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const response = await model.generateContent(prompt);
      return response.response.text();
    } catch (error) {
      console.error('AI generation failed:', error);
      return null;
    }
  }

  // 1. Task Grouping based on AI
  async groupTasksByAI(tasks: any[]): Promise<TaskGroup[]> {
    if (!this.ai) {
      return this.fallbackTaskGrouping(tasks);
    }

    try {
      const prompt = `Analyze these tasks and group them logically. Return JSON array with groups:
      Each group should have: id, name, description, tasks (array of task IDs), color (hex color)
      
      Tasks: ${JSON.stringify(tasks)}
      
      Group by: project, category, priority, or similar themes.`;

      const result = await this.generateAIResponse(prompt);
      if (result) {
        return JSON.parse(result);
      }
    } catch (error) {
      console.error('AI grouping failed:', error);
    }

    return this.fallbackTaskGrouping(tasks);
  }

  // 2. Weather-based suggestions
  async getWeatherSuggestions(tasks: any[], location: string = 'default'): Promise<WeatherSuggestion[]> {
    if (!this.ai) {
      return this.fallbackWeatherSuggestions(tasks);
    }

    try {
      // Import WeatherService to use the improved categorization
      const WeatherService = require('./WeatherService').default;
      const categorized = WeatherService.getCategorizedTasks(tasks);
      
      const prompt = `Based on weather conditions, suggest task modifications. Return JSON array:
      Each suggestion: weather, suggestion, tasks (array of task IDs)
      
      Tasks: ${JSON.stringify(tasks)}
      Categorized tasks:
      - Indoor: ${categorized.indoor.map((t: any) => `${t.name} (ID: ${t.id})`).join(', ')}
      - Outdoor: ${categorized.outdoor.map((t: any) => `${t.name} (ID: ${t.id})`).join(', ')}
      - Flexible: ${categorized.flexible.map((t: any) => `${t.name} (ID: ${t.id})`).join(', ')}
      
      Location: ${location}
      
      Consider: 
      - Indoor tasks: desk work, meetings, computer tasks, office work, home activities
      - Outdoor tasks: walking, gardening, sports, outdoor meetings, errands, travel
      - Flexible tasks: can be done either indoors or outdoors
      - Weather impact on productivity and safety
      - Temperature and condition effects on task performance`;

      const result = await this.generateAIResponse(prompt);
      if (result) {
        return JSON.parse(result);
      }
    } catch (error) {
      console.error('Weather suggestions failed:', error);
    }

    return this.fallbackWeatherSuggestions(tasks);
  }

  // 3. Smart suggestions for recurring tasks
  async getSmartSuggestions(tasks: any[]): Promise<SmartSuggestion[]> {
    if (!this.ai) {
      return this.fallbackSmartSuggestions(tasks);
    }

    try {
      const prompt = `Analyze tasks and provide smart suggestions. Return JSON array:
      Each suggestion: type (recurring/scheduling/optimization), title, description, action, tasks (array of task IDs)
      
      Tasks: ${JSON.stringify(tasks)}
      
      Look for: patterns, recurring tasks, scheduling conflicts, optimization opportunities.`;

      const result = await this.generateAIResponse(prompt);
      if (result) {
        return JSON.parse(result);
      }
    } catch (error) {
      console.error('Smart suggestions failed:', error);
    }

    return this.fallbackSmartSuggestions(tasks);
  }

  // 4. AI-based scheduling
  async suggestOptimalSchedule(tasks: any[]): Promise<any[]> {
    if (!this.ai) {
      return this.fallbackOptimalSchedule(tasks);
    }

    try {
      const prompt = `Create optimal schedule for these tasks. Return JSON array with scheduled tasks:
      Consider: priority, due dates, estimated duration, dependencies, energy levels
      
      Tasks: ${JSON.stringify(tasks)}`;

      const result = await this.generateAIResponse(prompt);
      if (result) {
        return JSON.parse(result);
      }
    } catch (error) {
      console.error('Optimal scheduling failed:', error);
    }

    return this.fallbackOptimalSchedule(tasks);
  }

  // 5. Time-based deadline suggestions
  async suggestDeadlines(tasks: any[]): Promise<any[]> {
    if (!this.ai) {
      return this.fallbackDeadlineSuggestions(tasks);
    }

    try {
      const prompt = `Suggest optimal deadlines for tasks. Return JSON array:
      Consider: task complexity, priority, dependencies, realistic timeframes
      
      Tasks: ${JSON.stringify(tasks)}`;

      const result = await this.generateAIResponse(prompt);
      if (result) {
        return JSON.parse(result);
      }
    } catch (error) {
      console.error('Deadline suggestions failed:', error);
    }

    return this.fallbackDeadlineSuggestions(tasks);
  }

  // 6. Focus mode recommendations
  async getFocusModeRecommendations(tasks: any[]): Promise<FocusRecommendations> {
    if (!this.ai) {
      return this.fallbackFocusMode(tasks);
    }

    try {
      const prompt = `Recommend focus mode settings. Return JSON object:
      Include: recommended task, duration, environment suggestions, distractions to avoid
      
      Tasks: ${JSON.stringify(tasks)}`;

      const result = await this.generateAIResponse(prompt);
      if (result) {
        return JSON.parse(result);
      }
    } catch (error) {
      console.error('Focus mode recommendations failed:', error);
    }

    return this.fallbackFocusMode(tasks);
  }

  // 7. Duplicate task detection
  async detectDuplicateTasks(tasks: any[]): Promise<any[]> {
    if (!this.ai) {
      return this.fallbackDuplicateDetection(tasks);
    }

    try {
      const prompt = `Detect duplicate or similar tasks. Return JSON array:
      Each duplicate: taskId1, taskId2, similarity, suggestion
      
      Tasks: ${JSON.stringify(tasks)}`;

      const result = await this.generateAIResponse(prompt);
      if (result) {
        return JSON.parse(result);
      }
    } catch (error) {
      console.error('Duplicate detection failed:', error);
    }

    return this.fallbackDuplicateDetection(tasks);
  }

  // 8. Task rescheduling suggestions
  async suggestRescheduling(tasks: any[]): Promise<any[]> {
    if (!this.ai) {
      return this.fallbackRescheduling(tasks);
    }

    try {
      const prompt = `Suggest task rescheduling. Return JSON array:
      Consider: conflicts, priority changes, new dependencies, time availability
      
      Tasks: ${JSON.stringify(tasks)}`;

      const result = await this.generateAIResponse(prompt);
      if (result) {
        return JSON.parse(result);
      }
    } catch (error) {
      console.error('Rescheduling suggestions failed:', error);
    }

    return this.fallbackRescheduling(tasks);
  }

  // 9. Automatic conflict resolution
  async resolveTaskConflicts(tasks: any[]): Promise<TaskConflict[]> {
    if (!this.ai) {
      return this.fallbackConflictResolution(tasks);
    }

    try {
      const prompt = `Identify and resolve task conflicts. Return JSON array:
      Each conflict: taskId1, taskId2, conflictType, description, resolution
      
      Tasks: ${JSON.stringify(tasks)}`;

      const result = await this.generateAIResponse(prompt);
      if (result) {
        return JSON.parse(result);
      }
    } catch (error) {
      console.error('Conflict resolution failed:', error);
    }

    return this.fallbackConflictResolution(tasks);
  }

  // 10. AI break timer (2-hour based)
  async suggestBreakTimer(workSession: any): Promise<BreakTimer> {
    const now = new Date();
    const breakDuration = 15; // 15 minutes break after 2 hours
    const endTime = new Date(now.getTime() + breakDuration * 60000);

    return {
      id: `break-${Date.now()}`,
      duration: breakDuration,
      startTime: now,
      endTime: endTime,
      type: 'short',
      activity: 'Mindfulness and stretching',
      benefits: ['Improves focus', 'Reduces stress', 'Increases energy']
    };
  }

  // 11. Voice command processing
  async processVoiceCommand(command: string, tasks: any[]): Promise<VoiceCommand> {
    if (!this.ai) {
      return this.fallbackVoiceCommand(command);
    }

    try {
      const prompt = `Process voice command and return JSON:
      command: original command
      action: add/delete/edit/complete/list
      parameters: relevant data
      
      Command: "${command}"
      Available tasks: ${JSON.stringify(tasks)}`;

      const result = await this.generateAIResponse(prompt);
      if (result) {
        return JSON.parse(result);
      }
    } catch (error) {
      console.error('Voice command processing failed:', error);
    }

    return this.fallbackVoiceCommand(command);
  }

  // 12. AI future predictor for weekly tasks
  async predictWeeklyTasks(tasks: any[]): Promise<WeeklyPrediction> {
    if (!this.ai) {
      return this.fallbackWeeklyPrediction(tasks);
    }

    try {
      const prompt = `Predict next week's tasks and completion. Return JSON:
      week: next week date range
      predictedTasks: estimated new tasks
      predictedCompletion: completion percentage
      recommendations: array of suggestions
      predictedTaskIds: array of task IDs likely to be worked on next week (from provided tasks)
      
      Historical tasks: ${JSON.stringify(tasks)}`;

      const result = await this.generateAIResponse(prompt);
      if (result) {
        const parsed: WeeklyPrediction = JSON.parse(result);
        if (!parsed.predictedTaskIds || !Array.isArray(parsed.predictedTaskIds)) {
          parsed.predictedTaskIds = this.derivePredictedTaskIds(tasks);
        }
        return parsed;
      }
    } catch (error) {
      console.error('Weekly prediction failed:', error);
    }

    return this.fallbackWeeklyPrediction(tasks);
  }

  // Fallback methods when AI is not available
  private fallbackTaskGrouping(tasks: any[]): TaskGroup[] {
    const groups: TaskGroup[] = [
      {
        id: 'urgent',
        name: 'Urgent Tasks',
        description: 'High priority tasks requiring immediate attention',
        tasks: tasks.filter(t => t.priority === 'urgent').map(t => t.id),
        color: '#ef4444'
      },
      {
        id: 'high',
        name: 'High Priority',
        description: 'Important tasks with high priority',
        tasks: tasks.filter(t => t.priority === 'high').map(t => t.id),
        color: '#f97316'
      },
      {
        id: 'medium',
        name: 'Medium Priority',
        description: 'Standard priority tasks',
        tasks: tasks.filter(t => t.priority === 'medium').map(t => t.id),
        color: '#eab308'
      },
      {
        id: 'low',
        name: 'Low Priority',
        description: 'Low priority tasks',
        tasks: tasks.filter(t => t.priority === 'low').map(t => t.id),
        color: '#22c55e'
      }
    ];

    return groups.filter(g => g.tasks.length > 0);
  }

  private fallbackWeatherSuggestions(tasks: any[]): WeatherSuggestion[] {
    // Import WeatherService to use the improved categorization
    const WeatherService = require('./WeatherService').default;
    const categorized = WeatherService.getCategorizedTasks(tasks);
    
    return [
      {
        weather: 'sunny',
        suggestion: `Great weather for outdoor activities! Perfect time for ${categorized.outdoor.length} outdoor tasks.`,
        tasks: categorized.outdoor.map((t: any) => t.id)
      },
      {
        weather: 'rainy',
        suggestion: `Perfect for focused indoor work. Prioritize ${categorized.indoor.length} indoor tasks.`,
        tasks: categorized.indoor.map((t: any) => t.id)
      },
      {
        weather: 'flexible',
        suggestion: `Weather is suitable for both indoor and outdoor activities. You have ${categorized.flexible.length} flexible tasks.`,
        tasks: categorized.flexible.map((t: any) => t.id)
      }
    ];
  }

  private fallbackSmartSuggestions(tasks: any[]): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    // Detect recurring patterns
    const taskNames = tasks.map(t => t.name.toLowerCase());
    const duplicates = taskNames.filter((name, index) => taskNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      suggestions.push({
        type: 'recurring',
        title: 'Recurring Tasks Detected',
        description: 'Consider setting up recurring task templates',
        action: 'Create recurring task',
        tasks: tasks.filter(t => duplicates.includes(t.name.toLowerCase())).map(t => t.id)
      });
    }

    // Scheduling optimization
    const urgentTasks = tasks.filter(t => t.priority === 'urgent' && !t.status);
    if (urgentTasks.length > 3) {
      suggestions.push({
        type: 'scheduling',
        title: 'Too Many Urgent Tasks',
        description: 'Consider delegating or rescheduling some urgent tasks',
        action: 'Review priorities',
        tasks: urgentTasks.map(t => t.id)
      });
    }

    return suggestions;
  }

  private fallbackOptimalSchedule(tasks: any[]): any[] {
    return tasks
      .filter(t => !t.status)
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .map((task, index) => ({
        ...task,
        suggestedStartTime: new Date(Date.now() + index * 60 * 60 * 1000), // 1 hour intervals
        estimatedDuration: 60 // 1 hour default
      }));
  }

  private fallbackDeadlineSuggestions(tasks: any[]): any[] {
    return tasks.map(task => ({
      ...task,
      suggestedDeadline: new Date(task.dueDate),
      reason: `Based on priority: ${task.priority}`
    }));
  }

  private fallbackFocusMode(tasks: any[]): FocusRecommendations {
    const urgentTask = tasks.find(t => t.priority === 'urgent' && !t.status);
    const highTask = tasks.find(t => t.priority === 'high' && !t.status);
    const recommendedTask = urgentTask || highTask || tasks.find(t => !t.status);

    return {
      recommendedTask: recommendedTask?.id,
      duration: 25, // 25 minutes
      environment: 'Quiet space with minimal distractions',
      distractions: ['Phone notifications', 'Social media', 'Email'],
      technique: 'Pomodoro technique recommended'
    };
  }

  private fallbackDuplicateDetection(tasks: any[]): any[] {
    const duplicates: any[] = [];
    const taskNames = tasks.map(t => t.name.toLowerCase());

    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        if (taskNames[i] === taskNames[j]) {
          duplicates.push({
            taskId1: tasks[i].id,
            taskId2: tasks[j].id,
            similarity: 1.0,
            suggestion: 'Consider merging these tasks'
          });
        }
      }
    }

    return duplicates;
  }

  private fallbackRescheduling(tasks: any[]): any[] {
    const overdueTasks = tasks.filter(t => 
      !t.status && new Date(t.dueDate) < new Date()
    );

    return overdueTasks.map(task => ({
      taskId: task.id,
      currentDueDate: task.dueDate,
      suggestedDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      reason: 'Task is overdue'
    }));
  }

  private fallbackConflictResolution(tasks: any[]): TaskConflict[] {
    const conflicts: TaskConflict[] = [];
    const urgentTasks = tasks.filter(t => t.priority === 'urgent' && !t.status);

    if (urgentTasks.length > 2) {
      conflicts.push({
        taskId1: urgentTasks[0].id,
        taskId2: urgentTasks[1].id,
        conflictType: 'priority',
        description: 'Multiple urgent tasks may overwhelm',
        resolution: 'Consider delegating one urgent task'
      });
    }

    return conflicts;
  }

  private fallbackVoiceCommand(command: string): VoiceCommand {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('add') || lowerCommand.includes('create')) {
      const taskName = command.replace(/add|create/gi, '').trim();
      return {
        command,
        action: 'add',
        parameters: { title: taskName },
        response: `Adding task: ${taskName}`
      };
    }
    
    if (lowerCommand.includes('complete') || lowerCommand.includes('done')) {
      const taskName = command.replace(/complete|done/gi, '').trim();
      return {
        command,
        action: 'complete',
        parameters: { taskName: taskName },
        response: `Marking task as complete: ${taskName}`
      };
    }

    return {
      command,
      action: 'unknown',
      parameters: {},
      response: `I didn't understand that command. Try saying "add task" or "complete task".`
    };
  }

  private fallbackWeeklyPrediction(tasks: any[]): WeeklyPrediction {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const completedThisWeek = tasks.filter(t => t.status).length;
    const totalThisWeek = tasks.length;
    const completionRate = totalThisWeek > 0 ? (completedThisWeek / totalThisWeek) * 100 : 0;
    const predictedTaskIds = this.derivePredictedTaskIds(tasks);

    return {
      week: `${new Date().toLocaleDateString()} - ${nextWeek.toLocaleDateString()}`,
      predictedTasks: Math.ceil(totalThisWeek * 1.1), // 10% increase
      predictedCompletion: Math.min(completionRate + 5, 100), // 5% improvement
      recommendations: [
        'Focus on high-priority tasks first',
        'Schedule breaks between work sessions',
        'Review and update task priorities regularly'
      ],
      predictedTaskIds
    };
  }

  // Choose the most likely tasks to work on next week: open, highest priority, earliest due
  private derivePredictedTaskIds(tasks: any[]): number[] {
    const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    const pendingSorted = tasks
      .filter((t: any) => !t.status)
      .sort((a: any, b: any) => {
        const aPriority = priorityOrder[a.priority] || 2;
        const bPriority = priorityOrder[b.priority] || 2;
        if (aPriority !== bPriority) return bPriority - aPriority;
        const aDue = new Date(a.dueDate).getTime();
        const bDue = new Date(b.dueDate).getTime();
        return aDue - bDue;
      });
    return pendingSorted.slice(0, 5).map((t: any) => t.id);
  }
}

export default new AIService();
