/* eslint-disable no-console */
import chalk from 'chalk';

function formatLog(...content) {
  console.log(...content);
  console.log();
}

export function successLog(...args) {
  const [message, ...rest] = args;
  formatLog(chalk.green(message), ...rest);
}

export function warnLog(...args) {
  const [message, ...rest] = args;
  formatLog(chalk.yellow.bold(` ${message} `), ...rest);
}

export function errorLog(...args) {
  const [message, ...rest] = args;
  formatLog(chalk.white.bgRed.bold(` ${message} `), ...rest);
}

export function log(...args) {
  formatLog(...args);
}

export function logEntries(files) {
  log(`\n${files.map(file => `  ${file}`).join('\n')}`);
}

export default log;
