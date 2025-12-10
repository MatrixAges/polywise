# Polywise thinking

功能模块设计：

- Explorer：基于 Graph 的记忆探索
- Writer：基于记忆和索引到的关联文件创造文章
- Canvas：基于画布的结构化知识创造
- Importer：数据导入
- Broswer：内置的浏览器功能
- Recall：巩固记忆的闪卡

**Chrome Extension**

- 支持保存文本为记忆
- 支持整页处理成 markdown 保存为记忆
- 支持 Rewriter（识别 Input 或者 Textarea，显示Rewrite/Write按钮），在 Polywise 的配置界面为不同平台的 Rewriter 配置 prompts，Rewriter 会根据你的记忆和语气输出符合你表达的内容

后台静默运行的模块：

**Memory**

- 分为短期记忆，长期记忆，行为记忆（Actions memory）和认知记忆（Known Memory），所有的记忆都为情景记忆（关联 Graph 节点）
- 每个 Graph 节点和边都具备模拟人类记忆的若干属性：size（大小，激活次数越多，size 越大，连接越多，越快被“想”到），边具有 length（“长短”）属性。

**FST**

Full-self Thinking（考虑作为 mcp 存在）：

- 支持对期记忆，长期记忆，Actions Memory，Known Memory 的写入和读取
- 支持“模拟睡眠”，对记忆进行整理、优化，对记忆系统的缓存进行清理和重建

支持实时反应的功能，提供一个实时数据输入管道，实时调整记忆，输出 Actions，Known 文本或语音给到用户。

实时输入：

- 监听语音
- 监看屏幕内容

# Roadmap

- 导入：先实现最简单的文本导入

# Features

## Explorer

分为左右两侧面板，左侧为输入面板，支持切换

- 文本检索：文本检索输入框在上方，下方显示检索到的记忆列表，
- agentic ai 检索：ai 检索输入框在下方，上方为与 ai 的聊天内容

右侧为 graph 节点图，支持点击 graph 节点探索记忆网络

## Writer

左侧为文本编辑器，右侧为 chat 面板，chat 面板支持切换 chat 或 refs（检索到引用，包含本地文件，网址，记忆等内容）

## Canvas

分为左右两侧面板，左侧为 ai chat 面板，右侧为画布，支持通过 chat 创建节点，或手动添加内容到节点，支持对画布进行对话，扩展画布内容

## Importer

支持导入数据到 Polywise 中，分为以下几种类型的数据导入模式：

### 应用内导入

使用 Polywise 提供的导入功能进行导入，支持以下几种方式：

- 文本导入：直接粘贴文本内容到输入框，点击按钮进行导入
- 网址导入：输入网址，使用 curl 自行抓取网页 html 并转换为 markdown 格式
- 文件导入：上传 txt、docx 等格式的文件，自动转换成 markdown
- 渲染网页导入：使用 Browser View，渲染实际网页，并将网页 html 转换为 markdown

### 浏览器插件导入

- 支持选中文本内容一键导入到 Polywise
- 支持解析整个页面的内容并导入

### Service Push

在开启应用的情况下，应用回开放一个本地端口，通过访问 http://localhost:本地端口/api/import ，可实现通过 api 导入数据，不要注意的是，首次导入需要手动点击同意授权，api导入的内容会放到暂存区，需手动入库。

## Broswer

内置的浏览器功能。

- 支持 sessions 和 cookies 管理
- 支持自带的网址导航
- 支持多 Tab
- 支持一键转换网页内容为 markdown
- 支持识别第三方 chat 页面比如 Deepseek chat，应用内 Preload 页面注入，根据询问内容自动检索记忆，在右侧面板显示检索到的记忆，支持一键传送到输入框，支持选中 ai 回答内容一键保存到记忆。

## Recall

- 支持输入提示词生成闪卡（可选择从记忆生成和从闪卡库选择，也可自定义二者的数量配置）
- 支持保存闪卡到闪卡库
- 闪卡样式库，自行根据 prompt 创建闪卡样式（闪卡本质上一段 html，即不限定样式，不限定格式）
