import { useState, useEffect, useCallback } from 'react';
import { Task, TaskListResult, TaskFilter } from '../types/task';
import { getTasks } from '../api/tasks';

const INITIAL_FILTER: TaskFilter = {
  page: 1,
  limit: 5,
  sort: 'created_at:desc',
};

export function useTasks() {
  const [data, setData] = useState<TaskListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>(INITIAL_FILTER);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTasks(filter);
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks: data?.items || [],
    meta: data?.meta,
    loading,
    error,
    filter,
    setFilter,
    refresh: fetchTasks, // Used for Task 4.2 (refresh after update)
  };
}
