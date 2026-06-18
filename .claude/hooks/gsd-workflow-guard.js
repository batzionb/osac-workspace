#!/usr/bin/env node
// gsd-hook-version: 1.36.0
// GSD Workflow Guard — PreToolUse hook

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

    if (data.tool_input?.is_subagent || data.session_type === 'task') {
      allowPreToolUse();
    }

    const filePath = data.tool_input?.file_path || data.tool_input?.path || '';

    if (filePath.includes('.planning/') || filePath.includes('.planning\\')) {
      allowPreToolUse();
    }

    if (filePath.includes('.artifacts/') || filePath.includes('.artifacts\\')) {
      allowPreToolUse();
    }

    const allowedPatterns = [
      /\.gitignore$/,
      /\.env/,
      /CLAUDE\.md$/,
      /AGENTS\.md$/,
      /GEMINI\.md$/,
      /settings\.json$/,
      /\.claude\/hooks\//,
    ];
    if (allowedPatterns.some(p => p.test(filePath))) {
      allowPreToolUse();
    }

    const cwd = data.cwd || process.cwd();
    const configPath = path.join(cwd, '.planning', 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (!config.hooks?.workflow_guard) {
          allowPreToolUse();
        }
      } catch (e) {
        allowPreToolUse();
      }
    } else {
      allowPreToolUse();
    }

    const message =
      `⚠️ WORKFLOW ADVISORY: You're editing ${path.basename(filePath)} directly without a GSD command. ` +
      'This edit will not be tracked in STATE.md or produce a SUMMARY.md. ' +
      'Consider using /gsd-fast for trivial fixes or /gsd-quick for larger changes ' +
      'to maintain project state tracking. ' +
      'If this is intentional (e.g., user explicitly asked for a direct edit), proceed normally.';

    allowPreToolUseWithAdvisory(message);
  } catch (e) {
    allowPreToolUse();
  }
});
