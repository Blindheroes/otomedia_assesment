import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Task, TaskStatus } from '../types/task';
import { updateTask, createTask } from '../api/tasks';

interface Props {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function TaskFormModal({ task, visible, onClose, onSaved }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [saving, setSaving] = useState(false);

  const isEditing = !!task;

  // Sync state when modal opens
  useEffect(() => {
    if (visible) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setStatus(task.status);
      } else {
        setTitle('');
        setDescription('');
        setStatus('todo');
      }
    }
  }, [task, visible]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Title is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = { title, description, status };
      if (isEditing) {
        await updateTask(task!.id, payload);
      } else {
        await createTask(payload);
      }
      onSaved(); // Triggers refresh
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </Text>

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Add details..."
          />

          <Text style={styles.label}>Status</Text>
          <View style={styles.row}>
            {(['todo', 'in_progress', 'done'] as TaskStatus[]).map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusBtn,
                  status === s && styles.statusBtnActive,
                ]}
                onPress={() => setStatus(s)}
              >
                <Text
                  style={[
                    styles.statusText,
                    status === s && styles.statusTextActive,
                  ]}
                >
                  {s.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button title="Cancel" onPress={onClose} color="red" />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title={saving ? 'Saving...' : isEditing ? 'Save' : 'Create'}
                onPress={handleSave}
                disabled={saving}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: { backgroundColor: '#fff', padding: 20, borderRadius: 8 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  statusBtnActive: { backgroundColor: '#007AFF' },
  statusText: { color: '#333', fontSize: 12 },
  statusTextActive: { color: '#fff', fontWeight: 'bold' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
});
