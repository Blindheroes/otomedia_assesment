import React from 'react';
import { FlatList, ActivityIndicator, Text, View } from 'react-native';
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
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  }

  if (!loading && tasks.length === 0) {
    return (
      <Text style={{ textAlign: 'center', marginTop: 50 }}>
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
