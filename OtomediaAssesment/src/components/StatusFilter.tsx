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
      {OPTIONS.map(opt => {
        const isActive = current === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segment, isActive && styles.segmentActive]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.text, isActive && styles.textActive]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderRadius: 9,
    marginHorizontal: 16,
    padding: 2,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 7,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: { fontSize: 12, fontWeight: '500', color: '#8E8E93' },
  textActive: { color: '#000', fontWeight: '600' },
});
