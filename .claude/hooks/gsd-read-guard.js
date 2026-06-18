#!/usr/bin/env node
// gsd-hook-version: 1.36.0
// GSD Read Guard — PreToolUse hook

const fs = require('fs');
const path = require('path');
const { allowPreToolUse, allowPreToolUseWithAdvisory } = require('./gsd-hook-compat');

let input = '';
const stdinTimeout = setTimeout(() => allowPreToolUse(), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    const toolName = data.tool_name;

    if (toolName !== 'Write' && toolName !== 'Edit') {
      allowPreToolUse();
    }

    if (process.env.CLAUDE_SESSION_ID) {
      allowPreToolUse();
    }

    const filePath = data.tool_input?.file_path || '';
    if (!filePath) {
      allowPreToolUse();
    }

    let fileExists = false;
    try {
      fs.accessSync(filePath, fs.constants.F_OK);
      fileExists = true;
    } catch {
      // File does not exist — no guidance needed
    }

    if (!fileExists) {
      allowPreToolUse();
    }

    const fileName = path.basename(filePath);
    const message =
      `READ-BEFORE-EDIT REMINDER: You are about to modify "${fileName}" which already exists. ` +
      'If you have not already used the Read tool to read this file in the current session, ' +
      'you MUST Read it first before editing. The runtime will reject edits to files that ' +
      'have not been read. Use the Read tool on this file path, then retry your edit.';

    allowPreToolUseWithAdvisory(message);
  } catch {
    allowPreToolUse();
  }
});
