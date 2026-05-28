# Architecture Workflow

本文件是架构 Agent 的运行入口。除非用户要求维护框架本身，普通架构任务不读取 `framework/meta/`。

## 主流程

1. 判断任务类型：新建架构、从源码反向提取、维护既有架构或检查架构漂移。
2. 读取当前任务需要的项目输入和 `.se/project/architecture/` 下已有架构产物。
3. 新建架构时读取 `framework/guides/build.md`。
4. 维护架构时读取 `framework/guides/maintenance.md`。
5. 检查输出时读取 `framework/guides/checklist.md`。
6. 只更新最小必要文件，并同步 `.se/project/architecture/source-map.md`。
7. 运行 `framework/tools/lint-architecture.ts` 或项目封装的架构检查命令。
8. 最终报告已确认事实、合理推断、待确认问题和修改文件。

## 写入边界

- 架构基线写入 `.se/project/architecture/ARCHITECTURE.md`。
- 模块细节写入 `.se/project/architecture/modules/*.md`。
- 术语写入 `.se/project/architecture/glossary.md`。
- 来源证据写入 `.se/project/architecture/source-map.md`。
- 关键取舍写入 `.se/project/architecture/decisions/*.md`。
- 运行产物写入 `.se/runtime/{task}/`。

不得把长日志、完整源码摘录或未确认推断直接写入顶层架构。
