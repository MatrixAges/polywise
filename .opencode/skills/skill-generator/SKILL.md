---
name: skill-generator
description: 当用户需要创建新的 OpenCode 技能时调用此函数。它会自动创建目录结构并编写符合规范的 SKILL.md 文件。
---

# Skill Generator (技能生成器)

此技能用于在项目中为 AI 扩展新的专门技能，确保新的技能文件符合项目的格式要求。

## 1. 技能结构

每个新技能必须放置在 `.opencode/skills/{skill-name}/` 目录下，并且其主文件必须命名为 `SKILL.md`。

## 2. SKILL.md 格式要求

必须在文件顶部包含 YAML Frontmatter 描述，包含以下两个字段：

```yaml
---
name: { skill-name }
description: { 一段描述该技能触发时机和作用的英文或中文文本 }
---
```

## 3. 生成指南

1. **创建目录**：在 `.opencode/skills/` 下新建技能同名文件夹。
2. **编写内容**：使用 Markdown 语法，详细列出该技能下的：
      - 核心架构/原理
      - 命名与代码风格规范
      - 具体执行的最佳实践
      - 强制性的红线（什么绝对不能做）
3. **语言对齐**：新技能的内容应尽量使用中文（为了与统一规范对齐），但 YAML 头部的 `name` 必须是英文字母和中划线。
