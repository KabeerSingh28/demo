/**
 * Unit & Integration Test Suite for Campus Task Manager.
 * Uses native Node.js test runner (node:test) and assertions (node:assert).
 *
 * Verifies:
 * 1. Adding academic tasks
 * 2. Listing tasks
 * 3. Marking tasks completed
 * 4. Deleting tasks
 * 5. Input validation & error handling
 * 6. Local JSON storage persistence
 * 7. Programmatic integration with @kabeersingh/readme-buddy
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const {
  getAllTasks,
  getTaskById,
  addTask,
  completeTask,
  deleteTask,
  getTaskStatistics
} = require('../src/taskManager');
const { loadTasks, saveTasks } = require('../src/storage');
const { generateReadme, buildMarkdown } = require('@kabeersingh/readme-buddy');

// Setup isolated temporary storage for clean tests
function createTempStorage() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'campus-task-test-'));
  const tempFile = path.join(tempDir, 'test-tasks.json');
  return {
    path: tempFile,
    cleanup: () => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (_) {}
    }
  };
}

test('Campus Task Manager - Core Operations', async (t) => {
  const tempStorage = createTempStorage();

  t.after(() => {
    tempStorage.cleanup();
  });

  await t.test('1. Adding a new academic task succeeds and persists to JSON', () => {
    const task = addTask(
      {
        title: 'Complete Operating Systems Lab 2',
        subject: 'CS 305',
        dueDate: '2026-11-28'
      },
      tempStorage.path
    );

    assert.strictEqual(task.id, 1);
    assert.strictEqual(task.title, 'Complete Operating Systems Lab 2');
    assert.strictEqual(task.subject, 'CS 305');
    assert.strictEqual(task.dueDate, '2026-11-28');
    assert.strictEqual(task.completed, false);
    assert.ok(task.createdAt, 'Should contain createdAt timestamp');

    // Verify it was written to disk
    const saved = loadTasks(tempStorage.path);
    assert.strictEqual(saved.length, 1);
    assert.strictEqual(saved[0].title, 'Complete Operating Systems Lab 2');
  });

  await t.test('2. Adding a second task increments ID sequentially', () => {
    const task2 = addTask(
      {
        title: 'Math Quiz Preparation',
        subject: 'MATH 240',
        dueDate: '2026-11-22'
      },
      tempStorage.path
    );

    assert.strictEqual(task2.id, 2);
    const all = getAllTasks(tempStorage.path);
    assert.strictEqual(all.length, 2);
  });

  await t.test('3. Retrieving all tasks and by ID', () => {
    const tasks = getAllTasks(tempStorage.path);
    assert.strictEqual(tasks.length, 2);

    const task1 = getTaskById(1, tempStorage.path);
    assert.ok(task1);
    assert.strictEqual(task1.id, 1);

    const nonExistent = getTaskById(999, tempStorage.path);
    assert.strictEqual(nonExistent, null);
  });

  await t.test('4. Marking a task as completed', () => {
    const updated = completeTask(1, tempStorage.path);
    assert.strictEqual(updated.completed, true);
    assert.ok(updated.completedAt, 'Should record completedAt timestamp');

    // Verify persistence
    const reloaded = getTaskById(1, tempStorage.path);
    assert.strictEqual(reloaded.completed, true);
  });

  await t.test('5. Calculating task statistics', () => {
    const stats = getTaskStatistics(tempStorage.path);
    assert.strictEqual(stats.total, 2);
    assert.strictEqual(stats.completed, 1);
    assert.strictEqual(stats.pending, 1);
  });

  await t.test('6. Deleting a task', () => {
    const deleted = deleteTask(1, tempStorage.path);
    assert.strictEqual(deleted.id, 1);

    const remaining = getAllTasks(tempStorage.path);
    assert.strictEqual(remaining.length, 1);
    assert.strictEqual(remaining[0].id, 2);
  });

  await t.test('7. Validation & Error Handling', () => {
    // Empty title should throw
    assert.throws(() => {
      addTask({ title: '   ', subject: 'CS 101' }, tempStorage.path);
    }, /Task title is required/);

    // Invalid ID for completeTask should throw
    assert.throws(() => {
      completeTask('invalid-id', tempStorage.path);
    }, /Invalid task ID/);

    // Non-existent task ID for completeTask should throw
    assert.throws(() => {
      completeTask(999, tempStorage.path);
    }, /not found/);

    // Invalid ID for deleteTask should throw
    assert.throws(() => {
      deleteTask('invalid-id', tempStorage.path);
    }, /Invalid task ID/);

    // Non-existent task ID for deleteTask should throw
    assert.throws(() => {
      deleteTask(999, tempStorage.path);
    }, /not found/);
  });
});

test('Package Integration: @kabeersingh/readme-buddy', async (t) => {
  await t.test('1. Programmatic buildMarkdown generates valid documentation', () => {
    const samplePkg = {
      name: 'campus-task-manager-demo',
      version: '1.0.0',
      description: 'A simple CLI task manager for students.',
      license: 'MIT',
      scripts: {
        start: 'node src/index.js',
        test: 'node test/taskManager.test.js'
      }
    };

    const markdown = buildMarkdown(samplePkg);
    assert.ok(markdown.includes('# campus-task-manager-demo'), 'Should include title');
    assert.ok(markdown.includes('A simple CLI task manager for students.'), 'Should include description');
    assert.ok(markdown.includes('npm run start'), 'Should include scripts table');
    assert.ok(markdown.includes('MIT'), 'Should include license');
  });

  await t.test('2. generateReadme runs successfully with dryRun=true', () => {
    const result = generateReadme({
      projectDir: path.resolve(__dirname, '..'),
      dryRun: true
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.dryRun, true);
    assert.strictEqual(result.outputPath, null);
    assert.ok(result.content.length > 0);
    assert.ok(result.sectionsGenerated.includes('Project Title'));
    assert.ok(result.sectionsGenerated.includes('Available Scripts'));
    assert.ok(result.sectionsGenerated.includes('License'));
  });
});
