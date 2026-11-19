import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Task } from '../types/task';

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskItem({ task, onEdit }: Props) {
  const isDone = task.status === 'done';

  const statusColors = {
    todo: { bg: 'rgba(255, 149, 0, 0.12)', text: '#FF9500' },
    in_progress: { bg: 'rgba(0, 122, 255, 0.12)', text: '#007AFF' },
    done: { bg: 'rgba(52, 199, 89, 0.12)', text: '#34C759' },
  };
  const color = statusColors[task.status] || statusColors.todo;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onEdit(task)}
      activeOpacity={0.6}
    >
      <View style={styles.ringContainer}>
        <View style={[styles.ring, isDone && styles.ringDone]}>
          {isDone && <Text style={styles.checkIcon}>✓</Text>}
        </View>
      </View>

      <View style={styles.content}>
        <Text
          style={[styles.title, isDone && styles.titleDone]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        {task.description ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {task.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: color.bg }]}>
            <Text style={[styles.badgeText, { color: color.text }]}>
              {task.status.replace('_', ' ')}
            </Text>
          </View>
          <Text style={styles.metaText}>• {task.assignee || 'Unassigned'}</Text>
        </View>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(60,60,67,0.12)',
  },
  ringContainer: { marginRight: 12 },
  ring: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringDone: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  checkIcon: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '600', color: '#000' },
  titleDone: { color: '#8E8E93', textDecorationLine: 'line-through' },
  subtitle: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  metaText: { fontSize: 13, color: '#8E8E93', textTransform: 'capitalize' },
  chevron: { fontSize: 22, color: '#C7C7CC', marginLeft: 8 },
});
