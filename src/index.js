#!/usr/bin/env node

/**
 * Campus Task Manager - Command Line Interface
 *
 * A beginner-friendly CLI application for college students to organize
 * assignments, projects, deadlines, and daily academic tasks.
 * Supports both interactive terminal menu and direct command-line arguments.
 */

const readline = require('node:readline');
const taskManager = require('./taskManager');
const storage = require('./storage');

// ANSI Color codes for clean terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

/**
 * Creates a stream-safe input reader supporting interactive and piped inputs.
 */
function createInputReader() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });
  const iterator = rl[Symbol.asyncIterator]();

  return {
    async ask(promptText) {
      if (promptText) {
        process.stdout.write(promptText);
      }
      const { value, done } = await iterator.next();
      if (done) return null;
      return typeof value === 'string' ? value.trim() : '';
    },
    close() {
      rl.close();
    }
  };
}

/**
 * Prints the main menu header.
 */
function printBanner() {
  console.log(`\n${COLORS.cyan}${COLORS.bright}====================================================${COLORS.reset}`);
  console.log(`${COLORS.cyan}${COLORS.bright}            🎓 CAMPUS TASK MANAGER 🎓              ${COLORS.reset}`);
  console.log(`${COLORS.cyan}       Academic Planner & Assignment Tracker        ${COLORS.reset}`);
  console.log(`${COLORS.cyan}${COLORS.bright}====================================================${COLORS.reset}`);
}

/**
 * Displays the menu choices to the user.
 */
function displayMenu() {
  console.log(`\n${COLORS.bright}MAIN MENU:${COLORS.reset}`);
  console.log(`  ${COLORS.yellow}[1]${COLORS.reset} 📋 View All Academic Tasks`);
  console.log(`  ${COLORS.yellow}[2]${COLORS.reset} ➕ Add a New College Task`);
  console.log(`  ${COLORS.yellow}[3]${COLORS.reset} ✅ Mark a Task as Completed`);
  console.log(`  ${COLORS.yellow}[4]${COLORS.reset} 🗑️  Delete a Task`);
  console.log(`  ${COLORS.yellow}[5]${COLORS.reset} 📊 View Summary & Statistics`);
  console.log(`  ${COLORS.yellow}[6]${COLORS.reset} 🚪 Exit`);
}

/**
 * Displays all tasks in a formatted terminal table.
 */
function handleListTasks() {
  const tasks = taskManager.getAllTasks();

  console.log(`\n${COLORS.bright}--- Current Academic Tasks ---${COLORS.reset}`);

  if (tasks.length === 0) {
    console.log(`${COLORS.dim}No tasks found. Select option [2] or run "campus-tasks add" to create one!${COLORS.reset}\n`);
    return;
  }

  const pad = (str, len) => String(str || '').padEnd(len).slice(0, len);
  console.log(
    `${COLORS.bright}${pad('ID', 4)}  ${pad('Status', 11)}  ${pad('Subject', 12)}  ${pad('Due Date', 12)}  Title${COLORS.reset}`
  );
  console.log('-'.repeat(75));

  for (const task of tasks) {
    const statusLabel = task.completed
      ? `${COLORS.green}[COMPLETED]${COLORS.reset}`
      : `${COLORS.yellow}[PENDING]  ${COLORS.reset}`;
    const idStr = pad(task.id, 4);
    const subStr = pad(task.subject || 'General', 12);
    const dueStr = pad(task.dueDate || 'No date', 12);

    console.log(`${idStr}  ${statusLabel}  ${subStr}  ${dueStr}  ${task.title}`);
  }
  console.log('-'.repeat(75));
  console.log(`Total: ${tasks.length} task(s) on file.\n`);
}

/**
 * Prompts user for details to create a new task.
 * @param {object} reader
 */
async function handleAddTaskInteractive(reader) {
  console.log(`\n${COLORS.bright}--- Add a New Academic Task ---${COLORS.reset}`);

  const title = await reader.ask(`${COLORS.cyan}Enter task title/description: ${COLORS.reset}`);
  if (title === null) return;
  if (!title) {
    console.log(`${COLORS.red}❌ Error: Task title cannot be empty.${COLORS.reset}`);
    return;
  }

  const subject = await reader.ask(`${COLORS.cyan}Enter subject / course code (e.g. CS 201) [optional]: ${COLORS.reset}`);
  if (subject === null) return;

  const dueDate = await reader.ask(`${COLORS.cyan}Enter due date (e.g. 2026-11-30) [optional]: ${COLORS.reset}`);
  if (dueDate === null) return;

  try {
    const newTask = taskManager.addTask({ title, subject, dueDate });
    console.log(`\n${COLORS.green}✅ Task #${newTask.id} successfully added!${COLORS.reset}`);
    console.log(`   Title:   ${newTask.title}`);
    console.log(`   Subject: ${newTask.subject}`);
    console.log(`   Due:     ${newTask.dueDate}`);
  } catch (err) {
    console.log(`${COLORS.red}❌ Failed to add task: ${err.message}${COLORS.reset}`);
  }
}

/**
 * Direct CLI handler for adding a task.
 */
function handleAddTaskDirect(title, subject, dueDate) {
  if (!title || !title.trim()) {
    console.log(`${COLORS.red}❌ Error: Task title cannot be empty.${COLORS.reset}`);
    console.log(`Usage: campus-tasks add "<title>" "[subject]" "[due-date]"`);
    return;
  }

  try {
    const newTask = taskManager.addTask({ title, subject, dueDate });
    console.log(`\n${COLORS.green}✅ Task #${newTask.id} successfully added!${COLORS.reset}`);
    console.log(`   Title:   ${newTask.title}`);
    console.log(`   Subject: ${newTask.subject}`);
    console.log(`   Due:     ${newTask.dueDate}\n`);
  } catch (err) {
    console.log(`${COLORS.red}❌ Failed to add task: ${err.message}${COLORS.reset}`);
  }
}

/**
 * Prompts user for task ID to mark as completed.
 * @param {object} reader
 */
async function handleCompleteTaskInteractive(reader) {
  console.log(`\n${COLORS.bright}--- Mark Task as Completed ---${COLORS.reset}`);
  const idInput = await reader.ask(`${COLORS.cyan}Enter Task ID to complete: ${COLORS.reset}`);

  if (idInput === null) return;
  if (!idInput) {
    console.log(`${COLORS.red}❌ Error: Task ID cannot be empty.${COLORS.reset}`);
    return;
  }

  try {
    const completed = taskManager.completeTask(idInput);
    console.log(`\n${COLORS.green}✅ Task #${completed.id} marked as COMPLETED!${COLORS.reset}`);
    console.log(`   "${completed.title}" (${completed.subject})`);
  } catch (err) {
    console.log(`${COLORS.red}❌ ${err.message}${COLORS.reset}`);
  }
}

/**
 * Direct CLI handler for completing a task.
 */
function handleCompleteTaskDirect(idInput) {
  if (!idInput) {
    console.log(`${COLORS.red}❌ Error: Please provide a Task ID.${COLORS.reset}`);
    console.log(`Usage: campus-tasks complete <id>`);
    return;
  }

  try {
    const completed = taskManager.completeTask(idInput);
    console.log(`\n${COLORS.green}✅ Task #${completed.id} marked as COMPLETED!${COLORS.reset}`);
    console.log(`   "${completed.title}" (${completed.subject})\n`);
  } catch (err) {
    console.log(`${COLORS.red}❌ ${err.message}${COLORS.reset}`);
  }
}

/**
 * Prompts user for task ID to delete.
 * @param {object} reader
 */
async function handleDeleteTaskInteractive(reader) {
  console.log(`\n${COLORS.bright}--- Delete Academic Task ---${COLORS.reset}`);
  const idInput = await reader.ask(`${COLORS.cyan}Enter Task ID to delete: ${COLORS.reset}`);

  if (idInput === null) return;
  if (!idInput) {
    console.log(`${COLORS.red}❌ Error: Task ID cannot be empty.${COLORS.reset}`);
    return;
  }

  try {
    const deleted = taskManager.deleteTask(idInput);
    console.log(`\n${COLORS.green}🗑️  Task #${deleted.id} "${deleted.title}" successfully deleted.${COLORS.reset}`);
  } catch (err) {
    console.log(`${COLORS.red}❌ ${err.message}${COLORS.reset}`);
  }
}

/**
 * Direct CLI handler for deleting a task.
 */
function handleDeleteTaskDirect(idInput) {
  if (!idInput) {
    console.log(`${COLORS.red}❌ Error: Please provide a Task ID.${COLORS.reset}`);
    console.log(`Usage: campus-tasks delete <id>`);
    return;
  }

  try {
    const deleted = taskManager.deleteTask(idInput);
    console.log(`\n${COLORS.green}🗑️  Task #${deleted.id} "${deleted.title}" successfully deleted.\n${COLORS.reset}`);
  } catch (err) {
    console.log(`${COLORS.red}❌ ${err.message}${COLORS.reset}`);
  }
}

/**
 * Displays task completion summary and statistics.
 */
function handleSummary() {
  const stats = taskManager.getTaskStatistics();
  const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  console.log(`\n${COLORS.bright}--- Academic Progress Summary ---${COLORS.reset}`);
  console.log(`  Total Tasks:      ${stats.total}`);
  console.log(`  Completed:        ${COLORS.green}${stats.completed}${COLORS.reset}`);
  console.log(`  Pending:          ${COLORS.yellow}${stats.pending}${COLORS.reset}`);
  console.log(`  Completion Rate:  ${COLORS.cyan}${percent}%${COLORS.reset}\n`);
}

/**
 * Displays CLI help text.
 */
function printHelp() {
  console.log(`
${COLORS.bright}Campus Task Manager v1.0.0${COLORS.reset}
A command-line task management tool for college students.

${COLORS.bright}Usage:${COLORS.reset}
  campus-tasks                         Launch interactive terminal menu
  campus-tasks list                    List all academic tasks
  campus-tasks add "<title>" "[sub]" "[due]"  Add a new task directly
  campus-tasks complete <id>           Mark a task as completed
  campus-tasks delete <id>             Delete a task
  campus-tasks stats                   View academic progress summary
  campus-tasks --help                  Show this help screen

${COLORS.bright}NPM Scripts:${COLORS.reset}
  npm start                            Launch interactive terminal menu
  npm test                             Run automated unit tests
  npm run generate-readme              Generate README via @kabeersingh/readme-buddy CLI
  npm run generate-readme:api          Generate README via programmatic API
  npm run preview-readme               Preview README in terminal (dry-run)
`);
}

/**
 * Main application loop for interactive terminal menu.
 */
async function runInteractiveCli() {
  printBanner();
  const reader = createInputReader();

  try {
    let keepRunning = true;
    while (keepRunning) {
      displayMenu();
      const choice = await reader.ask(`\n${COLORS.bright}Enter choice (1-6): ${COLORS.reset}`);

      if (choice === null || choice === '6') {
        console.log(`\n${COLORS.green}🎓 Thank you for using Campus Task Manager. Good luck with your studies!${COLORS.reset}\n`);
        keepRunning = false;
        break;
      }

      switch (choice) {
        case '1':
          handleListTasks();
          break;
        case '2':
          await handleAddTaskInteractive(reader);
          break;
        case '3':
          await handleCompleteTaskInteractive(reader);
          break;
        case '4':
          await handleDeleteTaskInteractive(reader);
          break;
        case '5':
          handleSummary();
          break;
        default:
          console.log(`\n${COLORS.red}❌ Invalid selection "${choice}". Please enter a number between 1 and 6.${COLORS.reset}`);
          break;
      }
    }
  } finally {
    reader.close();
  }
}

/**
 * CLI Entrypoint: delegates between direct flags and interactive menu.
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase() : '';

  switch (command) {
    case '--help':
    case '-h':
    case 'help':
      printHelp();
      break;

    case 'list':
    case 'ls':
    case 'view':
      handleListTasks();
      break;

    case 'add':
      handleAddTaskDirect(args[1], args[2], args[3]);
      break;

    case 'complete':
    case 'done':
      handleCompleteTaskDirect(args[1]);
      break;

    case 'delete':
    case 'rm':
      handleDeleteTaskDirect(args[1]);
      break;

    case 'stats':
    case 'summary':
      handleSummary();
      break;

    case '':
      await runInteractiveCli();
      break;

    default:
      console.log(`${COLORS.red}Unknown command "${command}".${COLORS.reset}`);
      printHelp();
      process.exit(1);
  }
}

// When invoked directly from terminal or npm start
if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal CLI Error:', err);
    process.exit(1);
  });
}

// Export modules for programmatic usage
module.exports = {
  ...taskManager,
  ...storage,
  handleListTasks,
  handleSummary,
  runInteractiveCli,
  main
};
