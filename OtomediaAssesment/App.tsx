import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { TaskListScreen } from './src/screens/TaskListScreen';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <TaskListScreen />
    </SafeAreaProvider>
  );
}

export default App;
