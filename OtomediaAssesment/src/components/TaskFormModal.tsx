import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Task, TaskStatus } from '../types/task';
import { updateTask, createTask, deleteTask } from '../api/tasks';

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
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = { title, description, status };
      if (isEditing) await updateTask(task!.id, payload);
      else await createTask(payload);
      onSaved();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(task!.id);
          onSaved();
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelBtn}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.header}>
              {isEditing ? 'Edit Task' : 'New Task'}
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !title.trim()}
            >
              <Text style={[styles.saveBtn, !title.trim() && { opacity: 0.3 }]}>
                {saving ? '...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.group}>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Title"
                placeholderTextColor="#C7C7CC"
              />
              <View style={styles.divider} />
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Description"
                placeholderTextColor="#C7C7CC"
              />
            </View>

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

            {isEditing && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteText}>Delete Task</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '60%',
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: '#C7C7CC',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: { fontSize: 17, fontWeight: '600', color: '#000' },
  cancelBtn: { fontSize: 17, color: '#007AFF' },
  saveBtn: { fontSize: 17, fontWeight: '600', color: '#007AFF' },
  form: { flex: 1 },
  group: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  input: { padding: 16, fontSize: 17, color: '#000' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(60,60,67,0.12)',
    marginLeft: 16,
  },
  row: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statusBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statusBtnActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  statusTextActive: { color: '#FFF' },
  deleteBtn: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  deleteText: { fontSize: 17, fontWeight: '500', color: '#FF3B30' },
});
