# 更新日志 2026-04-29

## 动画多样性优化

### 问题
动画触发概率分配严重偏向基础状态（idle/walk/sit），happy、surprised、annoyed 等有趣动画几乎没有出场机会。

### 改动

#### 1. 性格化动画触发配置（personalities.js）

每个性格的 `behavior` 新增 3 个字段：

```js
expressions: { happy: 0.xx, surprised: 0.xx, annoyed: 0.xx },  // action loop 触发概率
sitBreak: 0.xx,        // sit 结束后闪现表情的概率
idleExpr: 0.xx,        // idle 微动画触发表情的概率
exprBias: [...],       // 偏好闪现的状态（权重分布）
```

| 性格 | happy | surprised | annoyed | sit后闪现 | idle表情 | 偏好 |
|---|---|---|---|---|---|---|
| 粘人精 | 15% | 8% | 3% | 30% | 20% | happy 为主 |
| 傲娇毒舌 | 5% | 6% | 12% | 25% | 15% | annoyed 为主 |
| 元气夸夸 | 20% | 10% | 2% | 35% | 25% | happy 为主 |
| 戏精 | 10% | 12% | 8% | 35% | 25% | 三种均等 |

**总表演动画触发率**：粘人精 26%、傲娇毒舌 23%、元气夸夸 32%、戏精 30%

#### 2. 调度逻辑重构（pet.js）

**`scheduleNextAction`** — 表演动画触发改为性格驱动：
- happy/surprised/annoyed 各有独立触发阈值，从性格配置读取
- 新增 annoyed 状态的独立触发路径和文本（`啧。`、`（甩尾巴）`、`（撇头）`）
- sit 结束后的随机闪现概率从固定 20% 改为性格配置

**`_playRandomExpression`** — 表情偏好性格化：
- 原来等概率随机 happy/surprised/annoyed
- 现在从 `exprBias` 读取权重，每个性格闪现不同状态

**`_playIdleAnimation`** — idle 微动画概率性格化：
- 原来固定 15%
- 现在从 `idleExpr` 读取，偏好从 `exprBias` 读取

---

## 文本大量扩充

### 问题
每个性格每个文本分类只有 2-4 条，重复感强。

### 改动

每个性格从 ~50 条扩充到 **124-128 条**，每个分类扩充到 4-8 条。

保留所有原有文本，只在数组末尾追加新文本。

| 分类 | 原数量 | 扩充后 |
|---|---|---|
| companionRemind | 4 | 8 |
| companionEncourage | 3 | 6 |
| companionSad | 3 | 5-6 |
| sit | 3-4 | 8 |
| lookAround | 2-3 | 5-6 |
| yawn | 2-3 | 5-6 |
| encourage | 3 | 6 |
| click2 | 2-3 | 6 |
| click3 | 2-3 | 5-6 |
| click4Plus | 3 | 6 |
| seekAttention | 3 | 6 |
| morningGreet | 2 | 4 |
| noonGreet | 2 | 4 |
| eveningGreet | 2 | 4 |
| nightGreet | 2 | 4 |
| longWork | 2 | 4 |
| healthBreak | 5-6 | 8 |
| healthWater | 2-3 | 4 |
| moodHigh | 3 | 5-6 |
| moodLow | 3 | 5 |
| nearbyGreet | 2-3 | 4 |

各性格文本风格：
- **粘人精**：软萌、依赖、撒娇、害怕被抛弃
- **傲娇毒舌**：嘴硬心软、毒舌、假装不在意
- **元气夸夸**：热情、感叹号、真诚赞美
- **戏精**：舞台术语、戏剧化、自导自演

---

## 涉及文件

| 文件 | 变更 |
|---|---|
| `src/js/personalities.js` | 文本扩充 + 新增性格化动画配置 |
| `src/js/pet.js` | 动画触发逻辑性格化、新增 annoyed 触发路径 |
