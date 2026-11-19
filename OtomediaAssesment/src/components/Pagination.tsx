import React from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { Pagination as Meta } from '../types/task';

interface Props {
  meta: Meta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: Props) {
  return (
    <View style={styles.container}>
      <Button
        title="Prev"
        disabled={meta.page <= 1}
        onPress={() => onPageChange(meta.page - 1)}
      />
      <Text>
        Page {meta.page} of {meta.total_pages || 1}
      </Text>
      <Button
        title="Next"
        disabled={meta.page >= meta.total_pages}
        onPress={() => onPageChange(meta.page + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
});
