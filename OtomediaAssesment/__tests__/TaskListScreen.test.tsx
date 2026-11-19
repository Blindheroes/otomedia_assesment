import React from 'react';
import {
  render,
  fireEvent,
  waitFor,
  screen,
} from '@testing-library/react-native';
import { TaskListScreen } from '../src/screens/TaskListScreen';
import * as tasksApi from '../src/api/tasks';

jest.mock('../src/api/tasks');

const mockGetTasks = tasksApi.getTasks as jest.Mock;

describe('TaskListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTasks.mockResolvedValue({
      items: [
        {
          id: 1,
          title: 'Task A',
          status: 'todo',
          assignee: 'Alice',
          description: '',
          created_at: '',
          updated_at: '',
        },
        {
          id: 2,
          title: 'Task B',
          status: 'done',
          assignee: 'Bob',
          description: '',
          created_at: '',
          updated_at: '',
        },
      ],
      meta: { page: 1, limit: 5, total: 2, total_pages: 1 },
    });
  });

  it('renders tasks and handles search input', async () => {
    // Just await render. RTL automatically wraps this in act()
    await render(<TaskListScreen />);

    // findByText automatically waits for the initial fetch to resolve
    expect(await screen.findByText('Task A')).toBeTruthy();

    // Type in search input
    const searchInput = screen.getByPlaceholderText('Search tasks...');
    fireEvent.changeText(searchInput, 'Task A');

    // Wait for the input state to update
    await waitFor(() => {
      expect(searchInput.props.value).toBe('Task A');
    });

    // Press the search button
    fireEvent.press(screen.getByText('Search'));

    // Verify the API was called with the keyword
    await waitFor(() => {
      expect(mockGetTasks).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: 'Task A', page: 1 }),
      );
    });
  });

  it('handles status filter selection', async () => {
    await render(<TaskListScreen />);

    expect(await screen.findByText('Task A')).toBeTruthy();

    // Press "Done" filter
    fireEvent.press(screen.getByText('Done'));

    // Verify API called with status=done
    await waitFor(() => {
      expect(mockGetTasks).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'done', page: 1 }),
      );
    });
  });
});
