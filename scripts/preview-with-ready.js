#!/usr/bin/env node

import { spawn } from 'child_process';
import { platform } from 'os';

// Start vite preview
const command = platform() === 'win32' ? 'npm.cmd' : 'npm';
const args = ['run', 'generate-catalog'];

// First run generate-catalog
const catalogProcess = spawn(command, args, {
  stdio: 'inherit',
  shell: true
});

catalogProcess.on('close', (code) => {
  if (code !== 0) {
    process.exit(code);
  }

  // Then start vite preview
  const previewProcess = spawn(command, ['exec', 'vite', 'preview'], {
    stdio: 'pipe',
    shell: true
  });

  let readyPrinted = false;

  // Monitor output for ready signal
  previewProcess.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);

    // Print 'ready' once when server is listening
    if (!readyPrinted && (output.includes('Local:') || output.includes('listening'))) {
      console.log('ready');
      readyPrinted = true;
    }
  });

  previewProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  previewProcess.on('close', (code) => {
    process.exit(code);
  });
});
