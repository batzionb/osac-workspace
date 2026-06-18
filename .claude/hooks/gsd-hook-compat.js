// gsd-hook-compat.js — dual Cursor + Claude Code hook output helpers
function writeOutput(obj) {
  process.stdout.write(JSON.stringify(obj));
}
function allowPreToolUse() {
  writeOutput({ permission: 'allow' });
  process.exit(0);
}
function allowPreToolUseWithAdvisory(message) {
  writeOutput({
    permission: 'allow',
    agent_message: message,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: message,
    },
  });
  process.exit(0);
}
function denyPreToolUse(reason) {
  writeOutput({
    permission: 'deny',
    agent_message: reason,
    decision: 'block',
    reason,
  });
  process.exit(2);
}
function finishPostToolUse(message) {
  if (message) {
    writeOutput({
      additional_context: message,
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: message,
      },
    });
  } else {
    writeOutput({});
  }
  process.exit(0);
}
module.exports = {
  writeOutput,
  allowPreToolUse,
  allowPreToolUseWithAdvisory,
  denyPreToolUse,
  finishPostToolUse,
};
