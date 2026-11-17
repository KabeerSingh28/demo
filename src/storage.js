/**
 * Storage module for Campus Task Manager.
 * Handles reading and writing tasks to a local persistent JSON file.
 * Uses native Node.js filesystem modules (CommonJS).
 */

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_STORAGE_PATH = path.join(__dirname, '..', 'data', 'tasks.json');

/**
 * Returns the default absolute file path for the tasks JSON database.
 * @returns {string}
 */
function getDefaultStoragePath() {
  return DEFAULT_STORAGE_PATH;
}

/**
 * Loads tasks from the JSON storage file.
 * Automatically initializes the directory and file with an empty list if they do not exist.
 *
 * @param {string} [storagePath=DEFAULT_STORAGE_PATH] - Path to tasks JSON file
 * @returns {Array<object>} Array of task objects
 */
function loadTasks(storagePath = DEFAULT_STORAGE_PATH) {
  try {
    const dir = path.dirname(storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(storagePath)) {
      fs.writeFileSync(storagePath, '[]', 'utf8');
      return [];
    }

    const rawData = fs.readFileSync(storagePath, 'utf8').trim();
    if (!rawData) {
      return [];
    }

    const parsed = JSON.parse(rawData);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (err) {
    console.error(`Warning: Could not read tasks from ${storagePath}. Initializing empty list. (${err.message})`);
    return [];
  }
}

/**
 * Saves tasks to the JSON storage file.
 *
 * @param {Array<object>} tasks - Array of task objects to save
 * @param {string} [storagePath=DEFAULT_STORAGE_PATH] - Path to tasks JSON file
 * @returns {boolean} True if saved successfully, false otherwise
 */
function saveTasks(tasks, storagePath = DEFAULT_STORAGE_PATH) {
  try {
    if (!Array.isArray(tasks)) {
      throw new Error('Tasks to save must be an array');
    }

    const dir = path.dirname(storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const formattedJson = JSON.stringify(tasks, null, 2);
    fs.writeFileSync(storagePath, formattedJson, 'utf8');
    return true;
  } catch (err) {
    console.error(`Error: Failed to save tasks to ${storagePath}: ${err.message}`);
    return false;
  }
}

module.exports = {
  getDefaultStoragePath,
  loadTasks,
  saveTasks
};
