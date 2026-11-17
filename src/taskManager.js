/**
 * Task Manager business logic for Campus Task Manager.
 * Implements adding, listing, completing, and deleting academic tasks.
 */

const { loadTasks, saveTasks, getDefaultStoragePath } = require('./storage');

/**
 * Retrieves all academic tasks from persistent storage.
 *
 * @param {string} [storagePath] - Optional custom path for storage
 * @returns {Array<object>} List of all tasks
 */
function getAllTasks(storagePath = getDefaultStoragePath()) {
  return loadTasks(storagePath);
}

/**
 * Finds a single task by its numeric ID.
 *
 * @param {number|string} id - The ID of the task
 * @param {string} [storagePath] - Optional custom path for storage
 * @returns {object|null} The task object, or null if not found
 */
function getTaskById(id, storagePath = getDefaultStoragePath()) {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) return null;

  const tasks = loadTasks(storagePath);
  return tasks.find((t) => t.id === numericId) || null;
}

/**
 * Adds a new college task and persists it to the JSON file.
 *
 * @param {object} taskData - Task attributes
 * @param {string} taskData.title - Task title / description
 * @param {string} [taskData.subject] - Course name or code (e.g., CS 201)
 * @param {string} [taskData.dueDate] - Target deadline (e.g., 2026-11-30)
 * @param {string} [storagePath] - Optional custom storage path
 * @returns {object} The newly created task object
 * @throws {Error} If title is empty or invalid
 */
function addTask({ title, subject, dueDate }, storagePath = getDefaultStoragePath()) {
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new Error('Task title is required and cannot be empty.');
  }

  const tasks = loadTasks(storagePath);

  // Calculate the next sequential numeric ID
  const nextId = tasks.reduce((maxId, task) => Math.max(maxId, Number(task.id) || 0), 0) + 1;

  const cleanSubject = (subject && typeof subject === 'string' && subject.trim())
    ? subject.trim()
    : 'General Academic';

  const cleanDueDate = (dueDate && typeof dueDate === 'string' && dueDate.trim())
    ? dueDate.trim()
    : 'No deadline';

  const newTask = {
    id: nextId,
    title: title.trim(),
    subject: cleanSubject,
    dueDate: cleanDueDate,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  saveTasks(tasks, storagePath);

  return newTask;
}

/**
 * Marks an existing task as completed.
 *
 * @param {number|string} id - The task ID to complete
 * @param {string} [storagePath] - Optional custom storage path
 * @returns {object} The updated task object
 * @throws {Error} If task ID is invalid or task not found
 */
function completeTask(id, storagePath = getDefaultStoragePath()) {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    throw new Error(`Invalid task ID: "${id}". Task ID must be a number.`);
  }

  const tasks = loadTasks(storagePath);
  const taskIndex = tasks.findIndex((t) => t.id === numericId);

  if (taskIndex === -1) {
    throw new Error(`Task with ID ${numericId} was not found.`);
  }

  tasks[taskIndex].completed = true;
  tasks[taskIndex].completedAt = new Date().toISOString();

  saveTasks(tasks, storagePath);
  return tasks[taskIndex];
}

/**
 * Deletes a task by ID.
 *
 * @param {number|string} id - The task ID to delete
 * @param {string} [storagePath] - Optional custom storage path
 * @returns {object} The deleted task object
 * @throws {Error} If task ID is invalid or task not found
 */
function deleteTask(id, storagePath = getDefaultStoragePath()) {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    throw new Error(`Invalid task ID: "${id}". Task ID must be a number.`);
  }

  const tasks = loadTasks(storagePath);
  const taskIndex = tasks.findIndex((t) => t.id === numericId);

  if (taskIndex === -1) {
    throw new Error(`Task with ID ${numericId} was not found.`);
  }

  const [removedTask] = tasks.splice(taskIndex, 1);
  saveTasks(tasks, storagePath);

  return removedTask;
}

/**
 * Computes summary statistics for academic tasks.
 *
 * @param {string} [storagePath] - Optional custom storage path
 * @returns {{ total: number, completed: number, pending: number }}
 */
function getTaskStatistics(storagePath = getDefaultStoragePath()) {
  const tasks = loadTasks(storagePath);
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;

  return { total, completed, pending };
}

module.exports = {
  getAllTasks,
  getTaskById,
  addTask,
  completeTask,
  deleteTask,
  getTaskStatistics
};
