import { request } from './client';
import { Task, TaskListResult, TaskFilter } from '../types/task';

export function getTasks(filter: TaskFilter) {
  const params = new URLSearchParams();
  if (filter.status) params.append('status', filter.status);
  if (filter.keyword) params.append('keyword', filter.keyword);
  if (filter.assignee) params.append('assignee', filter.assignee);
  params.append('page', filter.page.toString());
  params.append('limit', filter.limit.toString());
  if (filter.sort) params.append('sort', filter.sort);

  return request<TaskListResult>(`/tasks?${params.toString()}`);
}

export function createTask(payload: Partial<Task>) {
  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTask(id: number, payload: Partial<Task>) {
  return request<Task>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteTask(id: number) {
  return request<void>(`/tasks/${id}`, { method: 'DELETE' });
}
