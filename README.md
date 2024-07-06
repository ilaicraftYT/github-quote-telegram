# githubquotebot

A Telegram bot that sends code from GitHub.

## Usage

Open up any file within a GitHub repository, click on a line number or various (holding <kbd>Shift</kbd>) and in any chat, type `@githubquotebot` and paste the URL (should end with `#L5-L21`, for example).

## Running
To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.ts
```

Fill up `.env.example` before running.