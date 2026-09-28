---
title: "[强化学习] 主动&被动强化学习"
published: 2026-09-28 11:00:00
tags: ["强化学习", "SARSA", "Q-learning", "时序差分法", "蒙特卡洛方法"]
category: 强化学习
draft: false
---

## 主动学习与被动学习的区别

- 主动学习：策略未固定，智能体可以主动选择动作来探索环境，改进策略$\pi$，以获得更高的回报，逼近最优策略$\pi^*$
- 被动学习：给定策略$\pi$，评价该策略的价值函数$V^\pi(s)$和动作价值函数$Q^\pi(s, a)$

## 两者的典型学习方法

- 被动学习：TD(0)和蒙特卡洛方法(MC)
- 主动学习：SARSA、Q-learning、DQN

## 被动学习方法

被动学习的输入是一个固定的策略$\pi$，输出是该策略的价值函数$V^\pi(s)$和动作价值函数$Q^\pi(s, a)$

如果环境的状态转移概率$P(s'|s, a)$和奖励函数$R(s, a)$已知，则称为**模型已知**，否则称为**模型未知**

### 模型已知

[使用贝尔曼方程](/post/rl/foundations#贝尔曼方程)

### 模型未知

#### 蒙特卡洛方法(MC)

直接让智能体从某状态出发，按给定策略$\pi$与环境交互，直到终止状态，得到真实的回报$G_t$

$$
V^\pi(s) \leftarrow V^\pi(s) + \alpha [G_t - V^\pi(s)]
$$

特点：

- 需要等待回合结束才能计算回报$G_t$，因此不适合长期任务
- 无偏，但方差较大

> [!TIP]
> $\alpha$为学习率，$0 < \alpha \leq 1$

#### 时序差分法TD(0)

无须等待完整回合结束，每步都可更新

由于：

$$
G_t = r_{t} + \gamma G_{t+1}
$$

但是$G_{t+1}$是未知的，因此用$V^\pi(s_{t+1})$来近似：

$$
G_t \approx r_{t} + \gamma V^\pi(s_{t+1})
$$

代入更新公式得*TD(0)更新公式*：

$$
V^\pi(s_t) \leftarrow V^\pi(s_t) + \alpha [r_{t} + \gamma V^\pi(s_{t+1}) - V^\pi(s_t)]
$$

## 主动学习方法

为了让智能体能发现更优策略避免陷入局部最优，需要平衡探索(exploration)和利用(exploitation)，常用的办法是为策略引入随机性，例如$\epsilon$-greedy策略。

### $\epsilon$-greedy策略

以概率$\epsilon$选择一个随机动作，以概率$1-\epsilon$选择当前最优动作(也叫贪心动作)

$$
a_t = \begin{cases}
\text{随机选择一个动作 }a \in A(s_t), & p < \epsilon\\
\arg\max_{a} Q(s_t, a), & p \geq \epsilon
\end{cases}
$$

> [!WARNING]
> 真正选中贪心动作的概率并非$1-\epsilon$，而是$(1-\epsilon) + \dfrac{\epsilon}{|A(s_t)|}$，因为随机选择动作时也可能选中贪心动作

### $\epsilon$衰减

常见做法：

$$
\epsilon_k = \max(\epsilon_{\min}, \epsilon_0 \cdot \lambda^k)
$$

- $\epsilon_0$为初始值，$\epsilon_{\min}$为设定的最小值以避免衰减到0，$\lambda$为衰减率，$k$为当前Episode数

## 主动学习中的时序差分方法

### SARSA

$$
\boxed{
\begin{array}{rl}
1: & \text{初始化每个 }Q(s, a)\text{ 为 }0\\
2: & \text{for 周期 }i=1 \text{ to }M \text{ do}\\
3: & \qquad \text{for 时间步 }t=0 \text{ to }T-1 \text{ do}\\
4: & \qquad \qquad \text{根据当前策略 }\pi\text{选择动作 }a_t\text{并执行},\text{得到 }r_{t+1}, s_{t+1}\\
5: & \qquad \qquad \text{根据当前策略 }\pi\text{在 }s_{t+1}\text{选择动作 }a_{t+1}\\
6: & \qquad \qquad Q(s_t, a_t)_{\text{target}} = r_{t+1} + \gamma Q(s_{t+1}, a_{t+1})\\
7: & \qquad \qquad Q(s_t, a_t) \gets Q(s_t, a_t) + \alpha [Q(s_t, a_t)_{\text{target}} - Q(s_t, a_t)]\\
8: & \qquad \text{结束循环}\\
9: & \text{结束循环}\\
10: & \text{返回 }Q(s, a)
\end{array}
}
$$

- $\alpha$为学习率，$0 < \alpha \leq 1$，用来控制每次更新的幅度

SARSA选择动作基于旧的策略$\pi$，因此是一个**on-policy**(在线)算法。**行为策略和目标策略相同**。策略中的随机因素如果选择了奖励较低的动作，则会影响到Q值的更新，导致Q值收敛到一个较低的值。从而学习到更**保守**的策略。

> [!TIP]
> SARSA是$S \rightarrow A \rightarrow R \rightarrow S' \rightarrow A'$的缩写

### Q-learning

$$
\boxed{
\begin{array}{rl}
1: & \text{初始化每个 }Q(s, a)\text{ 为 }0\\
2: & \text{for 周期 }i=1 \text{ to }M \text{ do}\\
3: & \qquad \text{for 时间步 }t=0 \text{ to }T-1 \text{ do}\\
4: & \qquad \qquad \text{根据当前策略 }\pi\text{选择动作 }a_t\text{并执行},\text{得到 }r_{t+1}, s_{t+1}\\
5: & \qquad \qquad Q(s_t, a_t)_{\text{target}} = r_{t+1} + \gamma \max_{a} Q(s_{t+1}, a)\\
6: & \qquad \qquad Q(s_t, a_t) \gets Q(s_t, a_t) + \alpha [Q(s_t, a_t)_{\text{target}} - Q(s_t, a_t)]\\
7: & \qquad \text{结束循环}\\
8: & \text{结束循环}\\
9: & \text{返回 }Q(s, a)
\end{array}
}
$$

Q-learning选择动作直接用最大的$Q(s_{t+1}, a)$，是一个**off-policy**(离线)算法。**行为策略和目标策略不同**。即使策略的随机性导致选择了奖励较低的动作，也不会拉低Q值，Q值始终选择历史最优，Q值会收敛到一个较高的值，从而学习到更**激进**的策略。
