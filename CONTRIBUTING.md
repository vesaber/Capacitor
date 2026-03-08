# Contributing to Capacitor

Thank you for contributing to Capacitor... READ before opening a PR plz

## Getting Started

1. Fork the repo on GitHub and clone your fork locally.
2. Install dependencies:
   ```sh
   bun install
   ```
3. Create a `.env` file in the project root with the following:
   ```
   BOT_TOKEN=your_token_here
   ```

## Branch Workflow

- Always branch off `dev`, not `main`.
- Name branches descriptively: `feat/my-feature`, `fix/bug-name`.
- Open PRs targeting the `dev` branch on the main repo.
- PRs targeting `main` directly will be nuked.. /srs

## Development

Run the bot:
```sh
bun run index.ts
```

Type check before submitting:
```sh
bunx tsc
```

CI runs the type check automatically on every PR to `dev`.

## Adding a Command

1. Create `commands/<name>.ts` exporting a `CommandSchema`.
2. Register it in `commands/index.ts`.
3. Add it to the correct category in `commands/help.ts`.
4. Follow existing patterns:
   - Use color `0x2D8A4E` for embeds.
   - Set `requireElevated: false` unless the command needs elevated permissions.

## Commit Messages

- Use present tense, imperative mood: `add roll command`, `fix ping latency`.
- Prefix with a type:
  - `feat:` — new feature
  - `fix:` — bug fix
  - `refactor:` — code restructure, no behavior change
  - `chore:` — maintenance, deps, config

## Pull Request Guidelines

- Describe what your PR does and why.
- Make sure `bunx tsc` passes locally before opening a PR.
