import { spawn } from 'node:child_process';

process.env.EXPO_NO_DEPENDENCY_VALIDATION = process.env.EXPO_NO_DEPENDENCY_VALIDATION ?? '1';
const args = process.argv.slice(2);

const child = spawn('expo', ['start', ...args], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
