# IMPROVEMENT_LOOP · 顶层设计

> 本文档面向人类（与未来的 AI 维护者），讲清楚"这套持续改进系统是什么、为什么这样设计"。
> 运行时 prompt 在 `se.evolution/framework/prompts/loop.md`，每轮 Codex 执行只读它，不读本文。

---

## 一、问题与目标

### 1.1 解决什么

让一个有 `ARCHITECTURE.md` 设计基准的项目，**在没有人持续盯着的情况下**，主动发现并修复"代码偏离设计"的缺口。

具体到一轮：扫描 → 计划 → 修复 → 验证 → 归档 → 决定下一步。

### 1.2 不解决什么

- 不替代架构设计本身：`ARCHITECTURE.md` 仍由人写
- 不替代用户决策重大问题：架构口径分歧、安全风险等必须交回人
- 不做长期记忆：每一轮的"上下文"必须能从 `PROBLEM_REGISTRY.md` 重建

### 1.3 成功标准

- 一轮内能闭合一个具体问题：从发现到 commit
- 跨轮稳定：随时停掉，下次从台账可恢复
- 自停机：遇到无法独立判断的情况能主动停下，而非乱来

---

## 二、系统模型

### 2.1 闭环控制结构

系统是一个三层的闭环控制器，状态和控制信号沿明确方向流动：

```
       ┌─────────────────────────────────────────┐
       │  外层 OPERATOR (control plane)          │
       │  - 读 next_action 执行动作              │
       │  - 写 decision 文件                     │
       │  - 不持有跨轮状态                       │
       └────────────┬────────────────────────────┘
                    │ 触发 supervisor
                    ▼
       ┌─────────────────────────────────────────┐
       │  supervisor (process boundary)          │
       │  - 启动内层进程                         │
       │  - stall / crash / 非法值兜底           │
       │  - 透传 next_action                     │
       └────────────┬────────────────────────────┘
                    │ exec runner
                    ▼
       ┌─────────────────────────────────────────┐
       │  内层 LOOP (data plane)                 │
       │  - 扫描 / 调度 / 归档                   │
       │  - 裁决 next_action                     │
       │  - 唯一拥有跨轮状态（台账）             │
       └─────────────────────────────────────────┘
```

外层 ↔ 内层 之间**唯一接口**是 `supervisor.status.json` 中的 `next_action` 字段。这一约束决定了下文几乎所有设计选择。

每一层都有自己的循环行为，结构详见 §三。

### 2.2 核心抽象

| 抽象 | 含义 | 承载 |
|------|------|------|
| **问题（Problem）** | 一个有 ID、标签、状态、证据链的改进对象 | `PROBLEM_REGISTRY.md` 一行 |
| **台账（Registry）** | 全系统唯一状态源 | `PROBLEM_REGISTRY.md` |
| **轮次（Round）** | 原子执行单元；输入是台账 + 工作区，输出是新台账 + `next_action` | runner 一次 exec |
| **裁决（Verdict）** | 一轮的对外控制信号；`continue` / `decide` / `stop` 三选一 | `next_action` 字段 |
| **决策（Decision）** | 人工介入的形式化载体；解锁 `[ARCH_ISSUE]` / 架构口径分歧 | `se.evolution/project/decisions/{ID}.md` |

这五个抽象覆盖了系统全部状态——其他一切（伪代码、STEP、动作裁决表）都是它们之上的执行细节。

### 2.3 系统不变式

系统的正确性建立在以下不变式之上。任何修改若可能破坏它们，必须先修改本文档。

1. **台账是唯一状态源**：任何跨轮记忆都必须能从 `PROBLEM_REGISTRY.md` 恢复
2. **跨轮记忆只在台账**：内外层均不持有进程内长期状态；重启即从台账重建
3. **decision 写权独占外层**：内层只读，避免子代理污染人工决策
4. **supervisor 必须兜底**：进程异常、非法 next_action、stall 都必须落到 `stop`，不能让外层读到空字段

---

## 三、循环结构

系统是两层嵌套循环，分别对应不同的时间尺度和故障域。

### 3.1 外层循环（OPERATOR）

外层是一个无状态的 while 循环，每次迭代触发一次 supervisor 调用：

```text
while true:
  run_supervisor()                          # 触发一次内层多轮执行
  read supervisor.status.json
  if next_action == stop:
    report_and_exit()
    break
  execute(next_action)                      # continue: 不动作 / decide: 写 decision
```

迭代之间外层不持有任何记忆。所有跨迭代的信息都通过台账（持久化状态）和 `supervisor.status.json`（控制信号）流动。

### 3.2 内层循环（runner）

一次 supervisor 调用启动 runner 子进程；runner 在同一进程内顺序执行最多 N 轮 Codex（默认 N=10）：

```text
for round in 1..N:
  run_codex_round()                         # 单轮执行（详见 §四）
  read round-XXX.status.json
  if status.result != "continue":
    break                                   # 提前结束
```

`result` 字段决定 runner 是否继续多轮：`continue` 继续，其余（`pause` / `blocked` / `failed` / `done`）立即跳出。N 是性能上限，防止单次 supervisor 调用无界跑死。

### 3.3 两层循环的协同

| 维度 | 外层 | 内层 |
|------|------|------|
| 一次迭代 = | 一次 supervisor 调用 | 一轮 Codex 执行 |
| 控制信号 | `next_action`（continue / decide / stop） | `result`（continue 或非 continue） |
| 进程边界 | 跨进程（重启友好） | 同一进程（共享 Codex 上下文） |
| 状态来源 | `supervisor.status.json` | `round-XXX.status.json` |
| 终止条件 | `next_action == stop` | `result != continue` 或跑满 N 轮 |

supervisor 始终把内层**最后一轮**的状态透传给外层：

- 内层 N 轮全部 `result=continue` → 跑满 N 轮自然结束 → 透传最后一轮的 `next_action`
- 内层某轮 `result != continue` → 立即跳出 → 透传该轮的 `next_action`

### 3.4 为什么要分两层循环

- **性能**：内层多轮在同一进程内执行，免去 Codex 启动 + 台账加载 + 上下文恢复的重复成本
- **鲁棒**：进程边界落在外层 ↔ 内层之间。内层 OOM / crash / stall 由 supervisor 检测并兜底（注入 `next_action=stop`），不影响外层继续运转
- **控制颗粒度**：`result` 控制单次 supervisor 调用内的提前结束（细粒度），`next_action` 控制整个系统是否进入下一外层迭代（决定性）

这种分层也使得 `next_action` 的语义更纯粹——它代表"系统级"的下一步意图，而不是"本轮 Codex 是否还想跑"这样的过程信号。

---

## 四、单轮生命周期

一轮 Codex 执行（即内层循环的一次 round）是系统的原子执行单元。其内部分 5 个阶段：

| 阶段 | 任务 | 关键产物 |
|------|------|----------|
| **准备** | 读台账恢复 state；分类工作区；累加 streak | `state`, `work`, `streaks` |
| **路由** | 根据台账状态决定本轮入口（决策恢复 / 直接计划 / 扫描） | 进入哪条主路径 |
| **工作** | 选条目、分组、调度 dev / verify 子代理 | `verify` 结果 |
| **收尾** | 更新台账、归档、压缩台账 | `archive` 成败 |
| **裁决** | 综合所有信号查"动作裁决表"，写状态文件 | `next_action`（外层接口）+ `result`（内层接口） |

注意"裁决"是最后一步而非紧接"收尾"——因为裁决依赖归档结果（"已验证改动未能归档"是一条裁决条件）。

详细 STEP 编号与每步动作见 `se.evolution/framework/prompts/loop.md`。

### 跨轮记忆：streak

由于不变式 3，进程内不能持有跨轮状态。但有些裁决条件天然跨轮（"同一问题连续两轮未恢复 → 停机"）。

解法：每个未关闭问题在 STEP 0 重新计算 `streak`，规则纯函数地依赖台账历史：

- 状态未从 `{待处理, 验证失败, 等待确认}` 集合迁出 → `streak += 1`
- 状态迁出或新增 → `streak = 0`

这样无论何时重启（外层重启或内层多轮中途断开），streak 都能从台账精确重建。

---

## 五、主要设计权衡

下面每条都对应上文已建立的抽象，按"决定 → 替代方案 → 选这条的原因"展开。

### 5.1 next_action 由内层裁决（不在外层做二次分类）

- **替代**：外层读 `(result, reason)` 再分类成 action
- **选择原因**：内层掌握完整上下文（台账、验证、归档），外层只看片面信号；二次分类必然滞后或失真
- **代价**：内层 prompt 更复杂；用动作裁决表（§ 2.2 的 Verdict 抽象）控制复杂度

### 5.2 streak 计数放内层（不在外层维护）

- **替代**：外层在 supervisor.status.json 累加 streak
- **选择原因**：违反不变式 1 和 3——外层将获得跨轮状态，使重启不再幂等
- **代价**：内层 STEP 0 多一步计算；但这是纯函数，零额外存储

### 5.3 裁决步骤（STEP 5.1）排在归档（STEP 6.1）之后

- **替代**：STEP 5.1 紧跟 STEP 5 闭环
- **选择原因**：动作裁决表中"已验证改动本轮未能归档"是一条裁决条件，依赖 `archive` 成败；若 5.1 先发生，该条规则永远无法触发
- **代价**：STEP 编号与执行顺序不一致；通过文档说明"5.1 是本轮最后一步"消化

### 5.4 dev / verify 拆为两个子代理（不合一）

- **替代**：单一 agent 同时改 `src/` 和 `tests/`
- **选择原因**：边界混淆会让"修 bug 顺手改测试"的回归保护失效；拆开后每份 agent 边界清晰、prompt 短
- **代价**：调度多一次派发；但分组可并行抵消

### 5.5 3 个 action 而非 4 个（合并 recover 入 continue）

- **替代**：保留 `recover` 作为"归档失败需恢复"的独立动作
- **选择原因**：外层执行上 `recover` 与 `continue` 完全等价（都是不动作 + 回循环顶），仅过程文字不同；信息冗余
- **代价**：失去过程状态的细分；但状态报告中仍可用 reason 字段表达细节

### 5.6 裁决用表而非代码（声明式而非命令式）

- **替代**：if/else 嵌套实现裁决逻辑
- **选择原因**：14 条规则的真值表易读、易审、易增删；新增条件不需改控制流
- **代价**：表本身要 25 行；但减少了"规则跨多个文件追踪"的成本

### 5.7 运行时 prompt 与设计文档分离

- **替代**：单一 `se.evolution/IMPROVEMENT_DESIGN.md` 既给 Codex 读也给人读
- **选择原因**：runtime 要最高信号密度（每行影响执行），设计文档要"为什么"（人类读者）；两者最优长度差一个数量级
- **代价**：双份；通过设计文档不含执行细节、runtime 不含"为什么"避免漂移

---

## 六、文件地图

### 6.1 目录分层原则

演进工程采用 `framework/` + `project/` 两层结构：

- `framework/` 承载跨项目通用方法论、契约、prompt、模板和工具脚本。这里不得写入当前项目的业务模块、端口、验证命令或历史问题。
- `project/` 承载当前项目适配和运行状态，包括配置、问题台账、决策实例、证据、归档、扫描记录、运行报告和日志。
- `project/project.config.yaml` 是项目适配入口。外部产品文档、测试工程入口、验证命令和运行目录都通过配置声明，避免通用 prompt 和脚本硬编码项目事实。

这种分层保证迁移到新项目时可以复制 `framework/`，再用新的 `project/` 配置、台账和证据接入目标仓库。

### 6.2 与外部工程的边界

- `.se/project/testing/` 是验证协作系统，演进工程只调用其执行入口和读取测试结果，不接管测试意图、spec、fixtures 或测试规范。
- `quality/` 是平级质量治理系统，可作为结构设计参考，但不并入演进工程。
- `ARCHITECTURE.md`、`docs/modules/` 和需求规格说明书是产品真相源，属于外部依赖文档，不迁入演进工程。
- `CLEAN_LOOP.md` 是并行清理 loop，负责工程熵治理；它不替代产品/架构一致性改进 loop。

### 6.3 文件地图

| 文件 | 角色 | 读者 |
|------|------|------|
| `se.evolution/framework/prompts/loop.md` | 内层 runtime prompt | Codex 每轮 |
| `se.evolution/framework/docs/status-file-spec.md` | 状态文件 JSON schema | Codex（STEP 5.1）；supervisor |
| `se.evolution/framework/docs/registry-spec.md` | 台账结构 + 归档规则 | Codex（STEP 0/5/6/6.1） |
| `se.evolution/framework/prompts/agent-dev.md` | 开发子代理 prompt + 任务包契约 + 门控 | 子代理；主控（STEP 3） |
| `se.evolution/framework/prompts/agent-verify.md` | 验证子代理 prompt + 验证范围契约 + 门控 | 子代理；主控（STEP 4） |
| `se.evolution/project/decisions/*.md` | 用户决策载体 | Codex（STEP 0.1 只读）；外层（写入） |
| `se.evolution/framework/prompts/improvement-run.prompt.md` | 入口 prompt（指向 loop.md） | runner |
| `se.evolution/framework/tools/supervise-loop.sh` | supervisor | OPERATOR 调用 |
| `se.evolution/framework/prompts/operator.md` | 外层控制器规范 | 外层 agent |
| `se.evolution/project/project.config.yaml` | 当前项目适配入口 | Codex；supervisor；维护者 |
| `se.evolution/project/registry/PROBLEM_REGISTRY.md` | 当前项目状态源 | Codex 每轮 |
| `se.evolution/project/evidence/` | 当前项目验证证据 | Codex；维护者 |
| `se.evolution/project/archive/` | 当前项目历史归档 | Codex；维护者 |
| `se.evolution/project/runs/` | 当前项目运行产物 | supervisor；operator；维护者 |
| `se.evolution/IMPROVEMENT_DESIGN.md`（本文） | 内层顶层设计 | 人类 / 未来 AI 维护者 |


