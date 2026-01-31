---
name: commit-generator
description: Used when committing code or generating commit messages to ensure Conventional Commits compliance.
---

# Instructions

1.    **Analyze Changes**: Run `git diff --cached` to retrieve all changes in the staging area.
2.    **Generate Message**: Create a commit message following the [Conventional Commits](https://www.conventionalcommits.org/) specification.
3.    **Format**: Use the structure `<type>(<scope>): <description>`.
      - **Types**: feat, fix, docs, style, refactor, test, chore, etc.
      - **Scope**: Optional, but recommended if the change is specific to a module.
      - **Description**: Concise, imperative mood, no period at the end.
4.    **Confirmation**: Present the generated message to the user.
5.    **Execution**: If the user approves, execute `git commit -m "<message>"`.
