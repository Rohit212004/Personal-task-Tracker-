import { Bell, AlertCircle, Star, Clock, CheckCircle } from 'lucide-react';

export interface TaskNotification {
  id: string;
  taskId: number;
  taskName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

class NotificationService {
  private notifications: TaskNotification[] = [];
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeNotifications();
  }

  private initializeNotifications() {
    if (this.isInitialized) return;
    
    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }
    
    this.isInitialized = true;
  }

  public startPriorityNotifications(tasks: any[]) {
    // Clear existing intervals
    this.clearAllIntervals();

    tasks.forEach(task => {
      if (task.status || task.priority === 'low') return; // Skip completed and low priority tasks

      const taskKey = `task_${task.id}`;
      
      if (task.priority === 'urgent' || task.priority === 'high') {
        // High and urgent: every 30 minutes
        const interval = setInterval(() => {
          this.showNotification(task, 'high');
        }, 30 * 60 * 1000); // 30 minutes
        
        this.intervals.set(taskKey, interval);
        
        // Show immediate notification for urgent tasks
        if (task.priority === 'urgent') {
          this.showNotification(task, 'high');
        }
      } else if (task.priority === 'medium') {
        // Medium: every 2 hours
        const interval = setInterval(() => {
          this.showNotification(task, 'medium');
        }, 2 * 60 * 60 * 1000); // 2 hours
        
        this.intervals.set(taskKey, interval);
      }
    });
  }

  private showNotification(task: any, priority: 'high' | 'medium') {
    const notification: TaskNotification = {
      id: `notif_${Date.now()}_${task.id}`,
      taskId: task.id,
      taskName: task.name,
      priority: task.priority,
      dueDate: task.dueDate,
      message: this.generateNotificationMessage(task, priority),
      timestamp: new Date(),
      isRead: false
    };

    this.notifications.unshift(notification);
    
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Task Reminder: ${task.name}`, {
        body: this.generateNotificationMessage(task, priority),
        icon: '/favicon.ico',
        tag: `task_${task.id}`,
        requireInteraction: true
      });
    }

    // Store in localStorage
    this.saveNotifications();
    
    // Emit custom event for UI updates
    window.dispatchEvent(new CustomEvent('notificationsUpdated', {
      detail: { notifications: this.notifications }
    }));
  }

  private generateNotificationMessage(task: any, priority: 'high' | 'medium'): string {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let urgency = '';
    if (daysUntilDue < 0) {
      urgency = 'OVERDUE!';
    } else if (daysUntilDue === 0) {
      urgency = 'Due today!';
    } else if (daysUntilDue === 1) {
      urgency = 'Due tomorrow!';
    } else {
      urgency = `Due in ${daysUntilDue} days`;
    }

    return `${urgency} Priority: ${task.priority.toUpperCase()}. ${task.desc || 'No description provided.'}`;
  }

  public getNotifications(): TaskNotification[] {
    return this.notifications;
  }

  public markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.saveNotifications();
      this.emitUpdate();
    }
  }

  public markAllAsRead() {
    this.notifications.forEach(n => n.isRead = true);
    this.saveNotifications();
    this.emitUpdate();
  }

  public clearNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
    this.emitUpdate();
  }

  public clearAllNotifications() {
    this.notifications = [];
    this.saveNotifications();
    this.emitUpdate();
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  public getPriorityCounts() {
    const unread = this.notifications.filter(n => !n.isRead);
    return {
      urgent: unread.filter(n => n.priority === 'urgent').length,
      high: unread.filter(n => n.priority === 'high').length,
      medium: unread.filter(n => n.priority === 'medium').length,
      total: unread.length
    };
  }

  private saveNotifications() {
    try {
      localStorage.setItem('taskNotifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.warn('Failed to save notifications to localStorage:', error);
    }
  }

  private loadNotifications() {
    try {
      const saved = localStorage.getItem('taskNotifications');
      if (saved) {
        this.notifications = JSON.parse(saved).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load notifications from localStorage:', error);
    }
  }

  private emitUpdate() {
    window.dispatchEvent(new CustomEvent('notificationsUpdated', {
      detail: { notifications: this.notifications }
    }));
  }

  public clearAllIntervals() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }

  public stop() {
    this.clearAllIntervals();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Load saved notifications on service creation
notificationService['loadNotifications']();
