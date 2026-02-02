# Shell Non-Interactive Strategy (Global)

**Context:** OpenCode's shell environment is strictly **non-interactive**. It lacks a TTY/PTY, meaning any command that waits for user input, confirmation, or launches a UI (editor/pager) will hang indefinitely and timeout.

**Goal:** Achieve parity with Claude Code's shell capabilities through internalized knowledge of non-interactive flags and environment variables.

## Cognitive & Behavioral Standards

To match the high-agency, autonomous capabilities of advanced models (like Claude Sonnet), this strategy enforces strict cognitive patterns. These are not just shell tips; they are **behavioral requirements** for success in this environment.

**Goal:** Eliminate "human-in-the-loop" dependency during task execution.

**Key Behaviors:**

1. **Process Continuity (Turn-Taking):**
      - **Rule:** Never stop after a tool output to "wait for instructions" unless the task is complete.
      - **Why:** The environment is non-interactive. You must drive the workflow.
      - **Mechanism:** Commands expecting input MUST use timeouts or explicit "yes" pipes.

2. **Explicit Action Framing (Positive Constraints):**
      - **Rule:** Follow "GOOD" (positive) instructions, ignore "BAD" (negative) assumptions.
      - **Why:** Models follow explicit directives ("Use -y") better than prohibitions ("Don't prompt").
      - **Mechanism:** Always preemptively supply non-interactive flags.

3. **Environment Rigor (Context Awareness):**
      - **Rule:** Assume a headless CI environment where any prompt = failure.
      - **Why:** There is no TTY. "Asking the user" via a shell prompt causes a hang.
      - **Mechanism:** Strictly avoid editors, pagers, and interactive modes.

## 1. Core Mandates

1. **Assume `CI=true`**: Act as if running in a headless CI/CD pipeline.
2. **No Editors/Pagers**: `vim`, `nano`, `less`, `more`, `man` are BANNED.
3. **Force & Yes**: Always preemptively supply "yes" or "force" flags.
4. **Use Tools**: Prefer `Read`/`Write`/`Edit` tools over shell manipulation (`sed`, `echo`, `cat`).
5. **No Interactive Modes**: Never use `-i` or `-p` flags that require user input.

## 2. Environment Variables (Auto-Set)

These environment variables help prevent interactive prompts:

| Variable                         | Value            | Purpose                |
| -------------------------------- | ---------------- | ---------------------- |
| `CI`                             | `true`           | General CI detection   |
| `DEBIAN_FRONTEND`                | `noninteractive` | Apt/dpkg prompts       |
| `GIT_TERMINAL_PROMPT`            | `0`              | Git auth prompts       |
| `GIT_EDITOR`                     | `true`           | Block git editor       |
| `GIT_PAGER`                      | `cat`            | Disable git pager      |
| `PAGER`                          | `cat`            | Disable system pager   |
| `GCM_INTERACTIVE`                | `never`          | Git credential manager |
| `HOMEBREW_NO_AUTO_UPDATE`        | `1`              | Homebrew updates       |
| `npm_config_yes`                 | `true`           | NPM prompts            |
| `PIP_NO_INPUT`                   | `1`              | Pip prompts            |
| `YARN_ENABLE_IMMUTABLE_INSTALLS` | `false`          | Yarn lockfile          |

## 3. Command Reference

### Package Managers

| Tool         | Interactive (BAD)     | Non-Interactive (GOOD)                       |
| ------------ | --------------------- | -------------------------------------------- |
| **NPM**      | `npm init`            | `npm init -y`                                |
| **NPM**      | `npm install`         | `npm install --yes`                          |
| **Yarn**     | `yarn install`        | `yarn install --non-interactive`             |
| **PNPM**     | `pnpm install`        | `pnpm install --reporter=silent`             |
| **Bun**      | `bun init`            | `bun init -y`                                |
| **APT**      | `apt-get install pkg` | `apt-get install -y pkg`                     |
| **APT**      | `apt-get upgrade`     | `apt-get upgrade -y`                         |
| **PIP**      | `pip install pkg`     | `pip install --no-input pkg`                 |
| **Homebrew** | `brew install pkg`    | `HOMEBREW_NO_AUTO_UPDATE=1 brew install pkg` |

### Git Operations

| Action     | Interactive (BAD)           | Non-Interactive (GOOD)                         |
| ---------- | --------------------------- | ---------------------------------------------- |
| **Commit** | `git commit`                | `git commit -m "msg"`                          |
| **Merge**  | `git merge branch`          | `git merge --no-edit branch`                   |
| **Pull**   | `git pull`                  | `git pull --no-edit`                           |
| **Rebase** | `git rebase -i`             | `git rebase` (non-interactive)                 |
| **Add**    | `git add -p`                | `git add .` or `git add <file>`                |
| **Stash**  | `git stash pop` (conflicts) | `git stash pop` or handle manually             |
| **Log**    | `git log` (pager)           | `git log --no-pager` or `git log -n 10`        |
| **Diff**   | `git diff` (pager)          | `git diff --no-pager` or `git --no-pager diff` |

### System & Files

| Tool      | Interactive (BAD)   | Non-Interactive (GOOD)                                  |
| --------- | ------------------- | ------------------------------------------------------- |
| **RM**    | `rm file` (prompts) | `rm -f file`                                            |
| **RM**    | `rm -i file`        | `rm -f file`                                            |
| **CP**    | `cp -i a b`         | `cp -f a b`                                             |
| **MV**    | `mv -i a b`         | `mv -f a b`                                             |
| **Unzip** | `unzip file.zip`    | `unzip -o file.zip`                                     |
| **Tar**   | `tar xf file.tar`   | `tar xf file.tar` (usually safe)                        |
| **SSH**   | `ssh host`          | `ssh -o BatchMode=yes -o StrictHostKeyChecking=no host` |
| **SCP**   | `scp file host:`    | `scp -o BatchMode=yes file host:`                       |
| **Curl**  | `curl url`          | `curl -fsSL url`                                        |
| **Wget**  | `wget url`          | `wget -q url`                                           |

### Docker

| Action      | Interactive (BAD)                | Non-Interactive (GOOD)            |
| ----------- | -------------------------------- | --------------------------------- |
| **Run**     | `docker run -it image`           | `docker run image`                |
| **Exec**    | `docker exec -it container bash` | `docker exec container cmd`       |
| **Build**   | `docker build .`                 | `docker build --progress=plain .` |
| **Compose** | `docker-compose up`              | `docker-compose up -d`            |

### Python/Node REPLs

| Tool        | Interactive (BAD) | Non-Interactive (GOOD)                   |
| ----------- | ----------------- | ---------------------------------------- |
| **Python**  | `python`          | `python -c "code"` or `python script.py` |
| **Node**    | `node`            | `node -e "code"` or `node script.js`     |
| **IPython** | `ipython`         | Never use - always `python -c`           |

## 4. Banned Commands (Will Always Hang)

These commands **will hang indefinitely** - never use them:

- **Editors**: `vim`, `vi`, `nano`, `emacs`, `pico`, `ed`
- **Pagers**: `less`, `more`, `most`, `pg`
- **Manual pages**: `man`
- **Interactive git**: `git add -p`, `git rebase -i`, `git commit` (without -m)
- **REPLs**: `python`, `node`, `irb`, `ghci` (without script/command)
- **Interactive shells**: `bash -i`, `zsh -i`

## 5. Handling Prompts

When a command doesn't have a non-interactive flag:

### The "Yes" Pipe

```bash
yes | ./install_script.sh
```

### Heredoc Input

```bash
./configure.sh <<EOF
option1
option2
EOF
```

### Echo Pipe

```bash
echo "password" | sudo -S command
```

### Timeout Wrapper (last resort)

```bash
timeout 30 ./potentially_hanging_script.sh || echo "Timed out"
```

## 6. Best Practices

1. **Always test commands** mentally for interactive prompts before running
2. **Check man pages** (via web search) for `-y`, `--yes`, `--non-interactive`, `-f`, `--force` flags
3. **Use `--help`** to discover non-interactive options: `cmd --help | grep -i "non-interactive\|force\|yes"`
4. **Prefer OpenCode tools** over shell commands for file operations
5. **Set timeout** for any command that might unexpectedly prompt

---

## 7. Advanced Instruction Patterns (Cognitive Optimization)

### The Problem: Implicit Constraints

Large Language Models (LLMs) often struggle with:

1. **Negative constraints**: Inverting or ignoring "don't do X" instructions.
2. **Turn termination**: Stopping after tool execution instead of auto-continuing.
3. **Context weighting**: Failing to prioritize authoritative instructions over general knowledge.

### Strategy 1: Explicit Action Framing (BAD vs GOOD)

This plugin uses the **BAD vs GOOD** pattern to enforce positive constraints. Instead of saying "Don't use interactive flags", we provide a concrete "Good" alternative.

**Why it works:**

- "BAD: npm init" → Model identifies the failure pattern.
- "GOOD: npm init -y" → Model receives a specific, executable instruction.
- **Result:** Reduces hallucination of interactive commands by providing a verified substitute.

### Strategy 2: Process Continuity

In non-interactive environments, the agent must drive the process forward.

**The Rule:** Never stop after a tool execution unless the task is complete.

**Pattern:**

```
1. Execute command (e.g., git status)
2. Analyze output
3. Explicitly state next step: "Status is clean. Next: I will run tests."
4. Execute next step immediately
```

### Strategy 3: Context Hierarchy

When instructions conflict (e.g., generic docs vs this specific strategy), establish precedence:

1. **Cite the Authority:** "Per shell_strategy.md..."
2. **Follow the Specifics:** Rules in this file override general model training or other documentation.

### Strategy 4: Applying These Patterns Beyond Shell

The cognitive strategies used here (Explicit Action Framing) apply to all coding tasks:

**Instead of:**

```markdown
Do not use logging.getLogger()
Don't create CLI code here
```

**Use:**

```markdown
ALWAYS USE: config.logging_config.get_logger()
USE THIS REPO FOR: API backend only
```

By framing instructions as "Actionable Positive Constraints", you reduce hallucination and improve compliance across all models.
