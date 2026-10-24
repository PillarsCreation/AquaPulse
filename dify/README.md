# AquaPulse 智讯通 · Dify 编排工程

本目录为 AquaPulse 智讯通的 **LLMOps / RAG / Agent / AI Workflow** 编排工程，包含可在 Dify 平台直接导入的工作流 DSL、知识库语料、提示词模板与评测集，与前端作品 `AquaPulse-完整版-Dify.html` 一一对应。

---

## 一、为什么用 Dify

防汛应急场景下，大模型**不能独立承担决策**：水文推演需要确定性计算，转移指令必须锚定官方预案，任何幻觉都可能带来生命代价。因此我们把系统拆成四类能力，全部落到 Dify：

| 能力 | Dify 载体 | 解决的真问题 |
|------|-----------|--------------|
| **AI Workflow** | 工作流编排 | 八步水文模型链是确定性计算链，必须用 Code 节点串联，而不是让 LLM 瞎猜 |
| **Agent** | Agent 应用（Function Calling / ReAct） | 村民 SOS 到达后，需自主完成"检索预案 → 调用模型 → 匹配队伍 → 规划路线 → 下发" |
| **RAG** | 知识库 + 知识检索节点 | 所有转移指令锚定《防汛应急预案》原文，可溯源、可核查，杜绝幻觉 |
| **LLMOps** | 提示词版本 + 标注评测 + 日志监控 | 每月算法迭代需回归评测，确保"越用越准"而不是越改越差 |

**核心设计原则：LLM 只做"翻译"与"编排"，不做"计算"。** 所有数值结论由 Code 节点确定性产出，LLM 负责把结构化推演结果转译为村民看得懂的指令。

---

## 二、目录结构

```
dify/
├── workflows/
│   ├── 01-flood-8step-derivation.yml   # 八步模型链推演（旗舰 Workflow）
│   ├── 02-sos-dispatch-agent.yml       # SOS 智能派单（Agent 应用）
│   ├── 03-emergency-plan-rag.yml       # 应急预案 RAG 检索（Chatflow）
│   ├── 04-disaster-assessment.yml      # 灾后 AI 定损报告（Workflow）
│   └── 05-icejam-derivation.yml        # 凌汛推演引擎（秋冬春 Workflow）
├── knowledge/
│   ├── 01-防汛应急预案汇编.md           # RAG 语料：官方预案条款
│   ├── 02-历史山洪灾情案例库.md         # RAG 语料：复盘案例
│   └── 03-山洪滑坡避险指引.md           # RAG 语料：避险知识
└── llmops/
    ├── 评测集.csv                       # 回归评测数据（50 条）
    └── 提示词模板.md                    # 各节点提示词与版本记录
```

---

## 三、导入步骤

1. 打开 Dify（云端 dify.ai 或私有化部署），进入「工作室」→「导入 DSL」。
2. 选择 `workflows/` 下的 YAML 文件，Dify 会自动识别应用类型并创建。
3. 导入后需手动补齐两项配置：
   - **模型供应商**：在系统设置中配置一家 LLM（推荐 Qwen / GLM / DeepSeek），并在各 LLM 节点选中。
   - **自定义工具**：`02-sos-dispatch-agent.yml` 用到 `dispatch_task` / `beidou_send` 工具，需在「工具」→「自定义工具」中按 Schema 创建（Schema 见下文）。
4. 知识库导入：新建知识库 → 上传 `knowledge/` 下三个 Markdown → 分段策略选「自动」，最大长度 512，重叠 64 → 在「知识检索」节点绑定该知识库。
5. 点击「发布」即可获得可调用的 WebApp 与 API。

---

## 四、自定义工具 Schema

`02-sos-dispatch-agent.yml` 依赖两个自定义工具，用于把 Agent 决策落到业务系统：

**dispatch_task（救援派单）**
```json
{
  "name": "dispatch_task",
  "description": "向指定救援队伍下发救援任务包，包含目标坐标、伤情、物资清单与最优路线",
  "parameters": {
    "type": "object",
    "properties": {
      "team_id":   { "type": "string", "description": "救援队伍 ID" },
      "target":    { "type": "string", "description": "求助人姓名" },
      "lng":       { "type": "number", "description": "目标经度 WGS84" },
      "lat":       { "type": "number", "description": "目标纬度 WGS84" },
      "injury":    { "type": "string", "enum": ["none","minor","severe"] },
      "materials": { "type": "array", "items": { "type": "string" } },
      "route":     { "type": "string", "description": "推荐路线文本" },
      "eta_min":   { "type": "integer" }
    },
    "required": ["team_id","target","lng","lat"]
  }
}
```

**beidou_send（北斗短报文下发）**
```json
{
  "name": "beidou_send",
  "description": "在公网中断时，通过北斗短报文备份链路下发精简任务包（限 78 字节汉字）",
  "parameters": {
    "type": "object",
    "properties": {
      "terminal_id": { "type": "string" },
      "content":     { "type": "string", "maxLength": 39 }
    },
    "required": ["terminal_id","content"]
  }
}
```

---

## 五、与前端作品的对应关系

前端 `AquaPulse-完整版-Dify.html` 登录后进入「Dify AI 中枢」即可看到本工程的运行时表现：

| 前端 Tab | 对应 DSL |
|----------|----------|
| AI Workflow · 八步模型链 | `01-flood-8step-derivation.yml` |
| Agent · SOS 智能派单 | `02-sos-dispatch-agent.yml`（ReAct 轨迹实时打印） |
| RAG · 应急预案检索 | `03-emergency-plan-rag.yml` |
| LLMOps · 评测与监控 | `llmops/评测集.csv` + 提示词版本记录 |

---

## 六、企业采纳路径（MVP → 生产）

| 阶段 | 内容 | 周期 |
|------|------|------|
| P0 试点 | 单县部署，接入气象局雷达 + 雨量站，跑通八步推演 | 2 周 |
| P1 扩面 | 接入水利部水位站、应急局预案库，四角色终端上线 | 6 周 |
| P2 闭环 | 北斗短报文备份链路、无人机正射定损、保险直连 | 12 周 |
| P3 运营 | LLMOps 常态化评测，月度模型迭代，跨县协同 | 持续 |

**成本结构**：G 端初装 50–100 万，年费 10–20 万；相比传统数千万硬件大屏，节省资金可转入险工险段加固。避免一次工业园区进水事故挽回的损失，即足以覆盖系统十年订阅费用，ROI 可达 1:50 以上。
