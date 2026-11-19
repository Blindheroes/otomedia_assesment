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

  it('renders tasks and handles live search input', async () => {
    render(<TaskListScreen />);

    // Wait for the initial fetch to resolve
    await waitFor(() => expect(screen.getByText('Task A')).toBeTruthy());

    // Type in search input
    const searchInput = screen.getByPlaceholderText('Search tasks...');
    fireEvent.changeText(searchInput, 'Task A');

    // Wait for the 300ms debounce to fire and the API to be called
    await waitFor(() => {
      expect(mockGetTasks).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: 'Task A', page: 1 }),
      );
    });
  });

  it('handles status filter selection', async () => {
    render(<TaskListScreen />);

    await waitFor(() => expect(screen.getByText('Task A')).toBeTruthy());

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
