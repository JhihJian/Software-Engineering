# se.architecture

`se.architecture` 把项目上下文编译成可维护、可校验、可追溯的架构基线。它用于从 PRD、源码、接口、数据库、测试和历史决策中提取稳定架构事实，并生成 `ARCHITECTURE.md`、模块文档、术语表、来源映射和决策记录。

## 运行过程

1. Agent 读取稳定入口 `.se/framework/architecture/framework/prompts/architecture.md`。
2. Agent 按入口指向读取 `.se/framework/architecture/framework/guides/workflow.md`。
3. Agent 根据任务类型懒加载 `build.md`、`maintenance.md`、`checklist.md` 或 `framework/meta/` 下的长期规范。
4. Agent 读取或写入 `.se/project/architecture/` 下的当前架构产物。
5. Agent 运行结构检查，并把无法确认的信息标记为待确认。

## 标准目录

```text
se.architecture/
  README.md
  framework/
    meta/
    prompts/
    guides/
    tools/
  project.template/
```

## Agent 入口

```text
.se/framework/architecture/framework/prompts/architecture.md
```

运行时主流程：

```text
.se/framework/architecture/framework/guides/workflow.md
```

## 最小初始化

```bash
mkdir -p .se/framework .se/project .se/runtime
cp -r se.architecture .se/framework/architecture
cp -r .se/framework/architecture/project.template .se/project/architecture
```

初始化后根据目标项目更新 `.se/project/architecture/source-map.md`，再按 `.se/framework/architecture/framework/guides/workflow.md` 构建或维护架构文档。运行产物写入 `.se/runtime/{task}/`。
