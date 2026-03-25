import { spawn } from 'node:child_process';

process.env.EXPO_NO_DEPENDENCY_VALIDATION = process.env.EXPO_NO_DEPENDENCY_VALIDATION ?? '1';
const args = process.argv.slice(2);
const platformArgs = args.length > 0 ? args : ['--web'];

const child = spawn('expo', ['start', '--clear', ...platformArgs], {
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
