import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Task } from '../types/task';

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

export function TaskItem({ task, onEdit, onDelete }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.meta}>
          {task.status} • {task.assignee || 'Unassigned'}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onEdit(task)} style={styles.actionBtn}>
          <Text style={{ color: 'blue' }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(task.id)}
          style={styles.actionBtn}
        >
          <Text style={{ color: 'red' }}>Del</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: 'bold' },
  meta: { fontSize: 12, color: '#666', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  actionBtn: { padding: 5 },
});
