
# Read Before Anything Else

Read in this exact order before any implementation:

1. client/context/project-overview.md
2. client/context/architecture.md
3. client/context/ui-tokens.md
4. client/context/ui-rules.md
5. client/context/ui-registry.md
6. client/context/code-standards.md
7. client/context/library-docs.md
8. client/context/build-plan.md
9. client/context/progress-tracker.md

## Rules That Never Change

- Never use hardcoded hex values or raw Tailwind color classes
- Update `progress-tracker.md` and `ui-registry.md` after every feature
- Before any third party library — load its installed skill first,
  then read `context/library-docs.md` for project-specific rules
- If the same problem persists after one corrective prompt —
  stop immediately and run /recover

## Available Skills

- `/architect` — before any complex feature. Think before building.
- `/imprint` — after any new UI component. Capture patterns.
- `/review` — before demo or when something feels off.
- `/recover` — when something breaks after one failed correction.
- `/remember save` — when a feature spans multiple sessions.
- `/remember restore` — when returning after a multi-session feature.
