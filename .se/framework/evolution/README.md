# se.evolution

`se.evolution` 围绕问题台账驱动持续改进闭环。它读取设计基准和测试入口，按“扫描、计划、修复、验证、归档、裁决”的循环推进问题，并在需要人工判断时输出正式决策项。

## 运行过程

1. Agent 或 runner 读取稳定入口 `.se/framework/evolution/framework/prompts/improvement-run.prompt.md`。
2. 入口 prompt 指向运行主流程 `.se/framework/evolution/framework/guides/workflow.md`。
3. 主流程读取 `.se/project/evolution/registry/PROBLEM_REGISTRY.md` 作为唯一跨轮状态源。
4. 循环按需调度开发、验证、台账归档和 operator 决策。
5. 每轮写入状态 JSON，输出 `next_action`：`continue`、`decide` 或 `stop`。

## 标准目录

```text
se.evolution/
  README.md
  framework/
    meta/
    prompts/
    guides/
    tools/
    templates/
  project.template/
```

## Agent 入口

```text
.se/framework/evolution/framework/prompts/improvement-run.prompt.md
```

运行时主流程：

```text
.se/framework/evolution/framework/guides/workflow.md
```

## 最小初始化

```bash
mkdir -p .se/framework .se/project .se/runtime
cp -r se.evolution .se/framework/evolution
cp -r .se/framework/evolution/project.template .se/project/evolution
mkdir -p .se/project/evolution/decisions .se/project/evolution/runs/inner .se/project/evolution/runs/operator
mkdir -p .se/project/evolution/evidence .se/project/evolution/archive .se/project/evolution/operator-guidance
```

启动内层循环：

```bash
bash se.evolution/framework/tools/run-loop.sh 1
```

启动带 supervisor 的循环：

```bash
bash se.evolution/framework/tools/supervise-loop.sh
```

运行产物写入 `.se/runtime/{task}/`。
