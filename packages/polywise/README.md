# Polywise

Polywise CLI for starting the local server and calling the backend API.

Docs: https://polywise.io/docs/intro

## Install

```bash
npm install -g polywise
```

## Upgrade

```bash
polywise upgrade
```

## Usage

Polywise CLI is designed for progressive discovery: start from the root help, narrow to a command group, inspect a concrete command, then run it.

```bash
polywise start
```

Visit Web UI http://localhost:3072/app/ .

### Root help

Use the root help to see the top-level command surface.

```bash
polywise -h
```

This level tells you:

- how to start the local server with `start`
- how to inspect a command schema with `input_schema`
- which API groups are available, such as `session`, `project`, and `search`
- which next-level `-h` command to run

### Group help

Use group help when you already know the domain you want to work in.

```bash
polywise session -h
```

This level shows:

- the available subcommands under `session`
- a short summary for each subcommand
- the next level to inspect with `polywise session <command> -h`

### Command help

Use command help before calling an unfamiliar RPC command.

```bash
polywise session create -h
```

This level shows:

- what the command does
- the HTTP method and API path behind it
- the parameter list
- the matching `polywise input_schema <rpc_path>` command
- concrete examples you can run directly

### Input schema

Use `input_schema` when you need the exact input structure for a command.

```bash
polywise input_schema session.create
```

This prints the RPC path, HTTP method, API path, parameter definitions, a CLI command skeleton, and a JSON template.

### Run commands

After checking help or schema, run the actual command.

```bash
polywise start
polywise start -d
polywise session create --title "Daily Review"
```
