# Stop Report Template

仅当 `next_action=stop` 时读取本文档。

## Read Before Reporting

必须读取：

- `se.evolution/project/runs/operator/{RUN_ID}/supervisor.status.json`
- `se.evolution/project/runs/operator/{RUN_ID}/summary.md`

以下情况再读取 `runner.log` 尾部：

- `result=stalled`
- runner 或 Codex 工具异常
- 工作区改动无法判断归属
- summary 无法解释停止原因

## Report Format

```text
结果：stop
触发 stop 的裁决条件：{对应 `se.evolution/framework/prompts/loop.md` 动作裁决表中的一行}
operator 运行目录：se.evolution/project/runs/operator/{RUN_ID}
内层运行目录：se.evolution/project/runs/inner/{RUN_ID 或未知}
观测：{result}/{reason}
建议下一步：{用户或维护者需要做什么}
```

外层不再做停止/继续的二次分类——`next_action=stop` 即停止。`continue` 与 `decide` 不会进入本模板。

若 supervisor 兜底注入了 `stop`（runner stall / Codex 异常 / 无 status 文件），在"触发 stop 的裁决条件"中注明并提示用户检查 runner 日志和进程树。

