import {
  successLog,
  errorLog,
} from './utils/log';

function run(fn, options) {
  const task = (typeof fn.default === 'undefined') ? fn : fn.default;
  successLog(`Start Running '${task.name}${options.length ? `(${options.join(', ')})` : ''}'...`);
  const startTime = new Date();

  return task(...options).then(() => {
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    successLog(`Finished '${task.name}' in ${diff} ms`);
  });
}

if (process.argv.length > 2) {
  delete require.cache[__filename]; // eslint-disable-line no-underscore-dangle
  const module = require(`./tasks/${process.argv[2]}.js`).default; // eslint-disable-line
  run(module, process.argv.slice(3)).catch(err => errorLog(err.stack));
}
