import { spawn } from 'node:child_process';

process.env.EXPO_NO_DEPENDENCY_VALIDATION = process.env.EXPO_NO_DEPENDENCY_VALIDATION ?? '1';

const child = spawn('expo', ['start'], {
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
