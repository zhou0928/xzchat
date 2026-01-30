import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');

export class CommentManager {
  constructor() {
    this.comments = [];
    this.loadComments();
  }

  async loadComments() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(COMMENTS_FILE, 'utf-8');
      this.comments = JSON.parse(data);
    } catch (error) {
      this.comments = [];
      await this.saveComments();
    }
  }

  async saveComments() {
    await fs.writeFile(COMMENTS_FILE, JSON.stringify(this.comments, null, 2), 'utf-8');
  }

  addComment(target, author, content) {
    this.comments.push({
      id: Date.now().toString(),
      target,
      author,
      content,
      timestamp: new Date().toISOString()
    });
    this.saveComments();
    return { success: true };
  }

  getComments(target) { return this.comments.filter(c => c.target === target); }

  deleteComment(id) {
    this.comments = this.comments.filter(c => c.id !== id);
    this.saveComments();
    return { success: true };
  }
}
