import React from 'react';
import { FlatList, Text, View, StyleSheet } from 'react-native';
import { Task } from '../types/task';
import { TaskItem } from './TaskItem';

interface Props {
  tasks: Task[];
  loading: boolean;
  onEdit: (task: Task) => void;
}

export function TaskList({ tasks, loading, onEdit }: Props) {
  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        {[1, 2, 3, 4, 5].map(i => (
          <View key={i} style={styles.skeletonRow}>
            <View style={styles.skeletonCircle} />
            <View style={{ flex: 1 }}>
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonSubtitle} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (!loading && tasks.length === 0) {
    return (
      <View style={{ alignItems: 'center', marginTop: 50 }}>
        <Text style={{ fontSize: 40, marginBottom: 10 }}>📝</Text>
        <Text style={{ color: '#000', fontSize: 17, fontWeight: '600' }}>
          No Tasks Found
        </Text>
        <Text style={{ color: '#8E8E93', fontSize: 15, marginTop: 4 }}>
          Try adjusting your filter.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => <TaskItem task={item} onEdit={onEdit} />}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}

const styles = StyleSheet.create({
  skeletonContainer: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    overflow: 'hidden',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  skeletonCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E5E5EA',
    marginRight: 12,
  },
  skeletonTitle: {
    width: '60%',
    height: 16,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
    marginBottom: 6,
  },
  skeletonSubtitle: {
    width: '35%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
  },
});
