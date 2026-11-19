import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types/task';
import { SearchInput } from '../components/SearchInput';
import { StatusFilter } from '../components/StatusFilter';
import { TaskList } from '../components/TaskList';
import { Pagination } from '../components/Pagination';
import { EditTaskModal } from '../components/EditTaskModal';
import { deleteTask } from '../api/tasks';

export function TaskListScreen() {
  const { tasks, meta, loading, filter, setFilter, refresh } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleSearch = (keyword: string) => {
    setFilter(prev => ({ ...prev, keyword, page: 1 }));
  };

  const handleStatusChange = (status: string) => {
    setFilter(prev => ({ ...prev, status, page: 1 }));
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(id);
            refresh();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <SearchInput onSearch={handleSearch} />
      <StatusFilter
        current={filter.status || ''}
        onChange={handleStatusChange}
      />

      <View style={styles.listContainer}>
        <TaskList
          tasks={tasks}
          loading={loading}
          onEdit={setEditingTask}
          onDelete={handleDelete}
        />
      </View>

      {meta && meta.total_pages > 0 && (
        <Pagination
          meta={meta}
          onPageChange={page => setFilter(prev => ({ ...prev, page }))}
        />
      )}

      <EditTaskModal
        task={editingTask}
        visible={!!editingTask}
        onClose={() => setEditingTask(null)}
        onUpdated={refresh} // Task 4.2: refresh list after update
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContainer: { flex: 1 },
});
