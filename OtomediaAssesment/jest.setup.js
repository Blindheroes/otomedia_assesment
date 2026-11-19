// Use `global` instead of `globalThis` to ensure it applies to the Jest sandbox
global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock SafeAreaContext to prevent native async measurement updates
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }) =>
      React.createElement(View, null, children),
    SafeAreaView: ({ children, style }) =>
      React.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Mock FlatList to render synchronously and avoid VirtualizedList warnings
jest.mock('react-native/Libraries/Lists/FlatList', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockFlatList = React.forwardRef((props, ref) => {
    const { data, renderItem, ListEmptyComponent } = props;

    if (!data || data.length === 0) {
      return ListEmptyComponent
        ? React.createElement(ListEmptyComponent)
        : null;
    }

    return React.createElement(
      View,
      { ref },
      data.map((item, index) =>
        React.createElement(
          View,
          { key: item.id?.toString() || index.toString() },
          renderItem({ item, index, separators: {} }),
        ),
      ),
    );
  });

  return {
    __esModule: true,
    default: MockFlatList,
  };
});
