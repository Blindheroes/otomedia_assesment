export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface TaskListResult {
  items: Task[];
  meta: Pagination;
}

export interface TaskFilter {
  status?: string;
  keyword?: string;
  assignee?: string;
  page: number;
  limit: number;
  sort?: string;
}
