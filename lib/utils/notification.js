import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');

export class NotificationManager {
  constructor() {
    this.notifications = [];
    this.loadNotifications();
  }

  async loadNotifications() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(NOTIFICATIONS_FILE, 'utf-8');
      this.notifications = JSON.parse(data);
    } catch (error) {
      this.notifications = [];
      await this.saveNotifications();
    }
  }

  async saveNotifications() {
    await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(this.notifications, null, 2), 'utf-8');
  }

  create(title, message, type = 'info') {
    this.notifications.unshift({
      id: Date.now().toString(),
      title,
      message,
      type,
      read: false,
      timestamp: new Date().toISOString()
    });
    if (this.notifications.length > 100) this.notifications = this.notifications.slice(0, 100);
    this.saveNotifications();
    return { success: true };
  }

  list(unreadOnly = false) {
    return unreadOnly ? this.notifications.filter(n => !n.read) : this.notifications;
  }

  markAsRead(id) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
    this.saveNotifications();
    return { success: !!notif };
  }

  markAllRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    return { success: true };
  }

  delete(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    return { success: true };
  }
}

// 默认导出
const notificationManager = new NotificationManager();
export default notificationManager;
