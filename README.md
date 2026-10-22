# APEX Flagship AI · 从零造 AI，并造尺子证明它没骗你

> **一套开源的"AI 验伪"方法与实物** —— 不是造一个 AI 给你看，是造一把尺子，证明它没在糊弄你。
> 作者：**晨星** · GitHub: [CJX0712](https://github.com/CJX0712)

在这个人人都能被 AI 生成物说服的时代，"**怎么知道 AI 没在糊弄你**"正在变成一种稀缺能力。

**APEX Flagship AI 是一支用零依赖 JavaScript 从零造出来的 AI 舰队**——反向自动微分、带 RoPE 的 Transformer、KV-Cache 推理引擎、能对话的迷你 LLM、BPE 子词分词，全部开源、可跑、可复现。但真正让它与众不同的不是"从零造了个 AI"（这种事不缺人做），是第二件事：

**每一艘船都自带一把尺子。** 注意力是不是真有用、位置编码外推会不会崩、模型裸放大会不会翻车——都不靠嘴说，用**可独立复现的基准**量化裁决，**包括照出并公开作者自己的失败**（外推崩塌、裸放大翻车、被尺子证伪后主动修正的旧结论）。

本仓库是舰队的**统一品牌门户与导航中枢**——把零散的旗舰仓库收拢成一个有身份、有架构、有门禁的整体。

> 站在世界顶级成果之上 · 零重写 · 集大成 · 有尺子 · 闭环开源

---

## 一、舰队总览

### ① 核心引擎

| 仓库 | 自检 | 一句话定位 |
|------|------|-----------|
| [flagship-ai-engine](https://github.com/CJX0712/flagship-ai-engine) | ![62/62](https://img.shields.io/badge/self--test-62%2F62-success) | 零依赖、可验证的世界顶级 AI 算法集大成引擎 · 348 个 API 单文件内联 · 浏览器 / Node 双跑 |

### ② 锻造实物（四件 + 总装）

| 仓库 | 自检 | 它证明了什么 |
|------|------|------------|
| [flagship-algo-forge](https://github.com/CJX0712/flagship-algo-forge) | ![8/8](https://img.shields.io/badge/self--test-8%2F8-success) | 零依赖复用世界顶级基础算法（注意力 / LayerNorm / AdamW / Xavier / Top-p），每条都是可独立交叉验证的数学不变量 |
| [flagship-transformer](https://github.com/CJX0712/flagship-transformer) | ![9/9](https://img.shields.io/badge/self--test-9%2F9-success) | 从零反向自动微分 + **RoPE** + 归纳任务注意力**碾压**无注意力基线 + **YaRN** 补长度外推 + **⑤ 系列**：长度课程 + 重调配方，原生外推 L=40 达 **0.75**（逼近同分布上限 0.89，发现"外推相对性"并诚实修正旧结论） |
| [flagship-rag-engine](https://github.com/CJX0712/flagship-rag-engine) | ![9/9](https://img.shields.io/badge/self--test-9%2F9-success) | 工业级 **KV-Cache 增量解码**（与全量重算**逐位等价**）+ **BM25** 检索 + 端到端 **RAG** 管线 |
| [flagship-llm-chat](https://github.com/CJX0712/flagship-llm-chat) | ![15/15](https://img.shields.io/badge/self--test-15%2F15-success) | 可对话迷你 LLM 服务层 + **⑥ BPE 子词分词**：答案命中率 76%→100%、token 省 41%，把引擎变成真能对话的系统 |
| [flagship-monorepo](https://github.com/CJX0712/flagship-monorepo) | ![29/29](https://img.shields.io/badge/self--test-29%2F29-success) | 四件实物**一键聚合自检总装**（submodule 形式） |

### ③ 旗舰家族（姊妹项目，同作者 · 晨星）

| 仓库 | 门禁 | 定位 |
|------|------|------|
| [innovation-flagship-ai](https://github.com/CJX0712/innovation-flagship-ai) | — | **创新旗舰 AI 总纲**：十层架构 · 零重写集大成 · CPU 可运行可复现可验证 |
| [axiom-ai](https://github.com/CJX0712/axiom-ai) | ![64 invariants](https://img.shields.io/badge/invariants-64-blue) | 自验证 AI 微指令操作系统：十层架构 × 1024 微指令 × 64 项数学不变量 |
| [tianji-ai](https://github.com/CJX0712/tianji-ai) | ![17/17](https://img.shields.io/badge/gates-17%2F17-success) | 世界顶级混合架构语言模型全栈（Gated DeltaNet × MLA × MoE × Muon2 × 投机解码 × 对齐） |

---

## 二、十层锻造架构（旗舰家族映射）

旗舰 AI 把"创新旗舰 AI"的十层分解架构落到可运行代码上：

| 层 | 名称 | 落地仓库 |
|----|------|---------|
| L1 | 数学基础内核（数值 / 线代 / 概率 / 优化） | flagship-ai-engine · flagship-algo-forge |
| L2 | 自动微分引擎（反向模式、逐 op 解析梯度） | flagship-ai-engine |
| L3 | 注意力与位置编码（RoPE / YaRN / NTK） | flagship-transformer |
| L4 | 序列建模 Transformer（因果多头注意力、RMSNorm、AdamW） | flagship-transformer |
| L5 | 推理加速（KV-Cache 增量解码，逐位等价） | flagship-rag-engine |
| L6 | 检索增强（BM25 + 端到端 RAG） | flagship-rag-engine |
| L7 | 分词与训练（BPE 子词分词、重复惩罚） | flagship-llm-chat |
| L8 | 对话服务（句末符截断、权重持久化） | flagship-llm-chat |
| L9 | 端到端集成（聚合自检总装） | flagship-monorepo |
| L10 | 验证门禁与闭环（不变量自检 + CI + 开源署名） | 全舰队 |

> 更权威的"十层 × 1024 微指令"原始设计见 [innovation-flagship-ai](https://github.com/CJX0712/innovation-flagship-ai) 与 [axiom-ai](https://github.com/CJX0712/axiom-ai)。

---

## 三、旗舰哲学（四条，缺一不可）

- **① 零重写**：任何需求先检索世界已有最优解——顶级数学 / 算法 / 代码 / 开源项目——直接复用、组合、超越。绝不从零造轮子。
- **② 集大成**：每一行代码、每个模块都站在世界顶级成果之上；凡有更强现成方案，立即替换自写。
- **③ 有尺子（最关键）**："最先进"若由作者自定，会退化成无人打分的美学竞赛。每条自检都是可被独立实现交叉验证的数学不变量；每个基准都有真实对手。尺子照出的不是胜利，是洞（KV-Cache 早期偏差 4.19 → 拆 qLen/kvLen 后逐位等价 0.00；原生 RoPE 外推崩塌 0.19 → YaRN 救回 0.52）。
- **④ 闭环交付**：成果完整开源至 GitHub，可运行、可复现、可验证，署名晨星。

---

## 四、如何导航 / 参与

- 想看**最全算法内核**：进 [flagship-ai-engine](https://github.com/CJX0712/flagship-ai-engine)（62/62 自检，348 API）。
- 想看**四件可跑实物**：进 [flagship-monorepo](https://github.com/CJX0712/flagship-monorepo)（聚合总装，29/29）。
- 想看**十层总纲 / 微指令操作系统**：进 [innovation-flagship-ai](https://github.com/CJX0712/innovation-flagship-ai) / [axiom-ai](https://github.com/CJX0712/axiom-ai)。
- 想看**前沿混合架构 LM 全栈**：进 [tianji-ai](https://github.com/CJX0712/tianji-ai)。

所有仓库均为 **MIT 协议**，零依赖、CPU 可跑、可复现。

---

<p align="center">
  <b>从零造 AI，并造尺子证明它没骗你</b><br>
  APEX Flagship AI · 一套开源的"AI 验伪"方法与实物 · 作者 晨星<br>
  <a href="https://github.com/CJX0712">github.com/CJX0712</a>
</p>
