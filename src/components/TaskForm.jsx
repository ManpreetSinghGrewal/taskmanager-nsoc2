import React, { useState, useRef } from 'react';
import { getTodayDate } from '../utils/taskUtils';

export default function TaskForm({ onAddTask, historyMode, onToggleHistory }) {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isPressed, setIsPressed] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    onAddTask({
      text: trimmed,
      dueDate: dueDate || getTodayDate(),
      priority,
      completed: false,
      completedAt: null
    });

    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 180);

    setText('');
    inputRef.current?.focus();
  };

  return (
    <form id="todo-form" aria-label="Add new task" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        id="todo-input"
        type="text"
        placeholder="New Task..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
      />
      <input
        id="todo-date"
        type="date"
        aria-label="Task due date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <select
        id="todo-priority"
        aria-label="Task priority"
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <button
        type="submit"
        className={isPressed ? 'btn-pressed' : ''}
      >
        Add task
      </button>
      <button
        id="history-toggle"
        className="history-button"
        type="button"
        onClick={onToggleHistory}
        aria-pressed={historyMode}
      >
        {historyMode ? 'Back to tasks' : 'History'}
      </button>
    </form>
  );
}
