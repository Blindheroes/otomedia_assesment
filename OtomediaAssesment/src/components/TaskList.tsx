import React from 'react';
import { FlatList, ActivityIndicator, Text } from 'react-native';
import { Task } from '../types/task';
import { TaskItem } from './TaskItem';

interface Props {
  tasks: Task[];
  loading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

export function TaskList({ tasks, loading, onEdit, onDelete }: Props) {
  if (loading && tasks.length === 0) {
    return (
      <ActivityIndicator
        size="large"
        style={{ marginTop: 50 }}
        color="#007AFF"
      />
    );
  }

  if (!loading && tasks.length === 0) {
    return (
      <Text
        style={{
          textAlign: 'center',
          marginTop: 50,
          color: '#8E8E93',
          fontSize: 16,
        }}
      >
        No tasks found.
      </Text>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => (
        <TaskItem task={item} onEdit={onEdit} onDelete={onDelete} />
      )}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}
