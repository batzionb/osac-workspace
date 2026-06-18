#!/bin/bash
# gsd-validate-commit.sh — PreToolUse hook: enforce Conventional Commits format
#
# OPT-IN: This hook is a no-op unless config.json has hooks.community: true.

allow() {
  echo '{"permission":"allow"}'
  exit 0
}

deny() {
  echo "{\"permission\":\"deny\",\"agent_message\":\"$1\",\"decision\":\"block\",\"reason\":\"$1\"}"
  exit 2
}

if [ -f .planning/config.json ]; then
  ENABLED=$(node -e "try{const c=require('./.planning/config.json');process.stdout.write(c.hooks?.community===true?'1':'0')}catch{process.stdout.write('0')}" 2>/dev/null)
  if [ "$ENABLED" != "1" ]; then allow; fi
else
  allow
fi

INPUT=$(cat)

CMD=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{process.stdout.write(JSON.parse(d).tool_input?.command||'')}catch{}})" 2>/dev/null)

if [[ "$CMD" =~ ^git[[:space:]]+commit ]]; then
  MSG=""
  if [[ "$CMD" =~ -m[[:space:]]+\"([^\"]+)\" ]]; then
    MSG="${BASH_REMATCH[1]}"
  elif [[ "$CMD" =~ -m[[:space:]]+\'([^\']+)\' ]]; then
    MSG="${BASH_REMATCH[1]}"
  fi

  if [ -n "$MSG" ]; then
    SUBJECT=$(echo "$MSG" | head -1)
    if ! [[ "$SUBJECT" =~ ^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\(.+\))?:[[:space:]].+ ]]; then
      deny "Commit message must follow Conventional Commits: <type>(<scope>): <subject>. Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore. Subject must be <=72 chars, lowercase, imperative mood, no trailing period."
    fi
    if [ ${#SUBJECT} -gt 72 ]; then
      deny "Commit subject must be 72 characters or less."
    fi
  fi
fi

allow
