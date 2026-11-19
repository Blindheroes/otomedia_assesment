import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Pagination as Meta } from '../types/task';

interface Props {
  meta: Meta;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, loading, onPageChange }: Props) {
  const isFirst = meta.page <= 1;
  const isLast = meta.page >= meta.total_pages;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        disabled={isFirst || loading}
        onPress={() => onPageChange(meta.page - 1)}
        style={[styles.btn, (isFirst || loading) && styles.btnDisabled]}
      >
        <Text style={styles.btnText}>‹ Prev</Text>
      </TouchableOpacity>

      <Text style={styles.pageText}>
        Page {meta.page} of {meta.total_pages || 1}
      </Text>

      <TouchableOpacity
        disabled={isLast || loading}
        onPress={() => onPageChange(meta.page + 1)}
        style={[styles.btn, (isLast || loading) && styles.btnDisabled]}
      >
        <Text style={styles.btnText}>Next ›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  btn: { padding: 8 },
  btnDisabled: { opacity: 0.3 },
  btnText: { color: '#007AFF', fontSize: 16, fontWeight: '500' },
  pageText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
});
