import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

interface Props {
  onSearch: (keyword: string) => void;
}

export function SearchInput({ onSearch }: Props) {
  const [text, setText] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(text);
    }, 300);
    return () => clearTimeout(handler);
  }, [text, onSearch]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        placeholder="Search tasks..."
        placeholderTextColor="#8E8E93"
        value={text}
        onChangeText={setText}
        returnKeyType="search"
      />
      {text.length > 0 && (
        <TouchableOpacity onPress={() => setText('')} style={styles.clearBtn}>
          <Text style={styles.clearIcon}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderRadius: 10,
    marginHorizontal: 16,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 12,
  },
  icon: { fontSize: 16, marginRight: 6 },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    height: '100%',
    paddingVertical: 0,
  },
  clearBtn: { padding: 4 },
  clearIcon: { color: '#8E8E93', fontSize: 18, fontWeight: 'bold' },
});
