import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  current: string;
  onChange: (status: string) => void;
}

const OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Todo', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
];

export function StatusFilter({ current, onChange }: Props) {
  return (
    <View style={styles.container}>
      {OPTIONS.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.btn, current === opt.value && styles.activeBtn]}
          onPress={() => onChange(opt.value)}
        >
          <Text
            style={[styles.text, current === opt.value && styles.activeText]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 10,
    gap: 8,
  },
  btn: { padding: 8, borderRadius: 16, backgroundColor: '#eee' },
  activeBtn: { backgroundColor: '#007AFF' },
  text: { color: '#333', fontSize: 12 },
  activeText: { color: '#fff', fontWeight: 'bold' },
});
