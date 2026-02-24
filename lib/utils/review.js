import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const REVIEWS_FILE = path.join(DATA_DIR, 'code-reviews-collab.json');

export class ReviewManager {
  constructor() {
    this.reviews = [];
    this.loadReviews();
  }

  async loadReviews() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const data = await fs.readFile(REVIEWS_FILE, 'utf-8');
      this.reviews = JSON.parse(data);
    } catch (error) {
      this.reviews = [];
      await this.saveReviews();
    }
  }

  async saveReviews() {
    await fs.writeFile(REVIEWS_FILE, JSON.stringify(this.reviews, null, 2), 'utf-8');
  }

  createReview(title, author, changes) {
    this.reviews.push({
      id: Date.now().toString(),
      title,
      author,
      changes,
      status: 'open',
      comments: [],
      createdAt: new Date().toISOString()
    });
    this.saveReviews();
    return { success: true };
  }

  addComment(reviewId, author, content) {
    const review = this.reviews.find(r => r.id === reviewId);
    if (review) {
      review.comments.push({ author, content, timestamp: new Date().toISOString() });
      this.saveReviews();
    }
    return { success: !!review };
  }

  listReviews() { return this.reviews; }

  updateStatus(id, status) {
    const review = this.reviews.find(r => r.id === id);
    if (review) {
      review.status = status;
      this.saveReviews();
    }
    return { success: !!review };
  }
}

// 默认导出
const reviewManager = new ReviewManager();
export default reviewManager;
