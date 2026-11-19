import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from 'react-native';
import { Task, TaskStatus } from '../types/task';
import { updateTask } from '../api/tasks';

interface Props {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onUpdated: () => void; // Task 4.2: Refresh list after update
}

export function EditTaskModal({ task, visible, onClose, onUpdated }: Props) {
  const [title, setTitle] = useState(task?.title || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [saving, setSaving] = useState(false);

  // Sync state when modal opens with a new task
  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setStatus(task.status);
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);
    try {
      await updateTask(task.id, { title, status });
      onUpdated(); // Triggers refresh
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
          <Text style={styles.header}>Edit Task</Text>

          <Text>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />

          <Text>Status</Text>
          <View style={styles.row}>
            {(['todo', 'in_progress', 'done'] as TaskStatus[]).map(s => (
              <Button
                key={s}
                title={s}
                color={status === s ? '#007AFF' : '#999'}
                onPress={() => setStatus(s)}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Button title="Cancel" onPress={onClose} color="red" />
            <Button
              title={saving ? 'Saving...' : 'Save'}
              onPress={handleSave}
              disabled={saving}
            />
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
  modal: { backgroundColor: '#fff', padding: 20, borderRadius: 8, gap: 10 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
    marginTop: 20,
  },
});
