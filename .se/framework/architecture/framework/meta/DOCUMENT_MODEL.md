# 文档模型

ARCHITECTURE 系列文档由规范、实践和项目产物组成。项目产物再细分为顶层基线、模块设计、术语表、来源映射和架构决策。

## 必备文件

```text
se.architecture/
  README.md
  framework/
    meta/
      ARCHITECTURE_SPEC.md
      DOCUMENT_MODEL.md
      INVARIANT_RULES.md
      AGENT_RULES.md
    prompts/
      architecture.md
    guides/
      workflow.md
      build.md
      maintenance.md
      checklist.md
    tools/
      lint-architecture.ts
  project.template/
    ARCHITECTURE.md
    glossary.md
    source-map.md
    modules/
    decisions/
      README.md
  project/
    ARCHITECTURE.md
    glossary.md
    source-map.md
    modules/
      01-xxx模块.md
    decisions/
      README.md
```

## 项目产物

| 文件 | 作用 |
| --- | --- |
| `project/ARCHITECTURE.md` | 当前项目的顶层架构基线 |
| `project/modules/*.md` | 模块级详细设计 |
| `project/glossary.md` | 项目术语表，统一业务和技术命名 |
| `project/source-map.md` | 架构结论与输入来源的映射 |
| `project/decisions/*.md` | 重要架构决策记录 |

## 中间模型

工程化生成时 SHOULD 先抽取结构化架构模型，再渲染 Markdown。模型至少包含：

- project：项目名称、领域、版本
- entities：领域实体
- states：核心状态
- roles：角色和权限主体
- modules：模块、职责、依赖
- capabilities：通用能力和业务能力
- invariants：系统不变量
- sources：输入来源和证据

## 变更规则

- 顶层基线变化 MUST 同步检查模块文档。
- 模块边界变化 SHOULD 记录架构决策。
- 从输入资料推断但无法确认的结论 MUST 标记为待确认。
- 删除或改写架构结论时 SHOULD 更新 `source-map.md`。
