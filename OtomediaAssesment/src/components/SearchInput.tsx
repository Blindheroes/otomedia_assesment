import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

interface Props {
  onSearch: (keyword: string) => void;
}

export function SearchInput({ onSearch }: Props) {
  const [text, setText] = useState('');

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search tasks..."
        value={text}
        onChangeText={setText}
        onSubmitEditing={() => onSearch(text)}
        returnKeyType="search"
      />
      <Button title="Search" onPress={() => onSearch(text)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 10, gap: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 10,
  },
});
