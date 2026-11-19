import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types/task';
import { SearchInput } from '../components/SearchInput';
import { StatusFilter } from '../components/StatusFilter';
import { TaskList } from '../components/TaskList';
import { Pagination } from '../components/Pagination';
import { TaskFormModal } from '../components/TaskFormModal';
import { deleteTask } from '../api/tasks';

export function TaskListScreen() {
  const { tasks, meta, loading, filter, setFilter, refresh } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

      {/* Floating Action Button for Add Task */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsCreateOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <TaskFormModal
        task={editingTask}
        visible={!!editingTask || isCreateOpen}
        onClose={() => {
          setEditingTask(null);
          setIsCreateOpen(false);
        }}
        onSaved={refresh}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContainer: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 80, // Keeps it above the pagination bar
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -4, // Centers the + visually
  },
});
