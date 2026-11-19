import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types/task';
import { SearchInput } from '../components/SearchInput';
import { StatusFilter } from '../components/StatusFilter';
import { TaskList } from '../components/TaskList';
import { Pagination } from '../components/Pagination';
import { TaskFormModal } from '../components/TaskFormModal';

export function TaskListScreen() {
  const { tasks, meta, loading, filter, setFilter, refresh } = useTasks();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleSearch = useCallback(
    (keyword: string) => {
      setFilter(prev => ({ ...prev, keyword, page: 1 }));
    },
    [setFilter],
  );

  const handleStatusChange = (status: string) => {
    setFilter(prev => ({ ...prev, status, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilter(prev => ({ ...prev, page }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.largeTitle}>Tasks</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setIsCreateOpen(true)}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <SearchInput onSearch={handleSearch} />
      <StatusFilter
        current={filter.status || ''}
        onChange={handleStatusChange}
      />

      <View style={styles.listContainer}>
        <TaskList tasks={tasks} loading={loading} onEdit={setEditingTask} />
      </View>

      {meta && meta.total_pages > 0 && !loading && (
        <Pagination
          meta={meta}
          loading={loading}
          onPageChange={handlePageChange}
        />
      )}

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
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.4,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: { color: '#FFF', fontSize: 24, fontWeight: '400', marginTop: -2 },
  listContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 70,
  },
});
