# Document Sync Policy

仅当正式 decision 要求同步 `ARCHITECTURE.md`、`docs/modules/` 或相关需求规格说明书时读取本文档。

## Allowed

- 只消除 decision 已明确覆盖的架构/产品口径冲突。
- 只同步 `ARCHITECTURE.md`、`docs/modules/` 和相关需求规格说明书。
- 同步后用 `rg` 或等价方式确认旧冲突表述已消除。

## Forbidden

- 不修改 `src/` 业务代码。
- 不修改 `tests/` 测试代码或测试意图。
- 不改写内层运行日志。
- 不扩展 decision 未覆盖的产品范围、权限范围或测试意图。

完成同步后回到外层循环顶部，由下一轮 supervisor 重新裁决 `next_action`。
