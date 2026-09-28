---
title: "[强化学习] 深度强化学习DQN"
published: 2026-09-28 11:51:00
tags: ["强化学习", "深度强化学习", "DQN", "Q-learning"]
category: 强化学习
draft: false
---

## 为什么传统的Q-learning不合适了

### 状态过多

当状态空间过大时，传统的Q-learning需要为每个状态-动作对维护一个Q值表，Q表会非常巨大

### 状态连续

比如CartPole(小车上的倒立摆)环境，状态是连续的，无法用Q表表示

### 没有泛化

Q表里没有的状态-动作对无法得到Q值，无法泛化到未见过的状态

## DQN的基本思想

以一个神经网络替代Q表，输入一个状态，输出该状态下所有动作的Q值，所有状态共享同一个神经网络的参数

原Q-learning的更新过程替换为神经网络的训练过程

## DQN的网络结构

以CartPole环境为例，状态是一个4维向量(位置、速度、角度、角速度)，动作是2个离散动作(左移、右移)，DQN的输出是一个2维向量，表示在当前状态下采取每个动作的Q值：

$$
Q(s, \cdot; \theta) = \begin{bmatrix}
Q(s, a_1; \theta) \\
Q(s, a_2; \theta)
\end{bmatrix}
$$

网络结构可以是一个简单的全连接神经网络，输入层为4个神经元，输出层为2个神经元，中间可以有若干隐藏层

## DQN的损失函数

TD目标：

$$
y_t = r_{t+1} + (1 - d_t)\gamma \max_{a'} Q(s_{t+1}, a'; \theta^-)
$$

- $\theta^-$的含义在文后的目标网络(Target Network)中有介绍
- $a^{\prime}$表示下一状态的所有可能动作
- $d_t$表示回合是否到达终止状态，若到达终止状态则$d_t=1$，否则$d_t=0$。若$d_t=1$，则下一状态不存在，所以不应加上$\gamma \max_{a'} Q(s_{t+1}, a'; \theta^-)$

使用均方误差(MSE)作为损失函数，目标是最小化预测的Q值与目标Q值之间的差距

$$
L(\theta) = \frac{1}{2}\left[y_t - Q(s, a; \theta) \right]^2
$$

参数更新：

$$
\theta \leftarrow \theta + \eta \nabla_\theta L(\theta)
$$

## 为什么直接使用神经网络训练会不稳定

### 连续的样本高度相关

> [!TIP]
> i.i.d. (independent and identically distributed) 独立同分布假设

常见的深度学习场景中，训练样本是独立同分布的，而强化学习中，智能体与环境交互产生的样本是高度相关的，连续的状态之间存在强相关性，违背i.i.d.假设，这会导致训练不稳定

### 目标Q值不断变化

常见的深度学习场景中，训练目标是固定的，而强化学习中，目标Q值是由当前网络参数计算得到的，导致网络自己追自己

### 参数共享

由于所有状态共享同一个神经网络的参数，参数更新会影响大量其他状态的Q值

## DQN的改进方法

### 经验回放(Experience Replay)

用于解决连续样本高度相关的问题

把每次交互得到的「经验」(状态、动作、奖励、下一状态)存储起来：

$$
(s_t, a_t, r_{t+1}, s_{t+1}, d_t) \rightarrow \mathcal{D}
$$

训练时从**经验池**中随机抽取一份mini-batch：

$$
\mathcal{D} = \{(s_i, a_i, r_{i+1}, s_{i+1}, d_i)\}_{i=1}^N
$$

### 目标网络(Target Network)

用于解决目标Q值不断变化的问题

做法是分离出两套网络：在线网络$Q(s, a; \theta)$和目标网络$Q(s, a; \theta^-)$，两者的结构完全相同

在线网络用于真正训练，负责Q值预测和梯度更新，目标网络用于生成TD目标：

$$
y_t = r_{t+1} + \gamma \max_{a'} Q(s_{t+1}, a'; \theta^-)
$$

每隔$M$个时间步，将在线网络的参数复制给目标网络：

$$
\theta^- \leftarrow \theta
$$

## DQN完整训练流程

$$
\boxed{
\begin{array}{rl}
& \text{初始化经验池 }\mathcal{D} \\
& \text{初始化在线网络 }Q(s, a; \theta)\\
& \text{初始化目标网络 }Q(s, a; \theta^-) \text{ 并令 } \theta^- = \theta \\
& \text{设定目标网络更新频率 } M \\
& \text{for episode: } \\
& \quad \text{for t: } \\
& \quad \quad a_t = \epsilon\text{-greedy}(Q(s_t, \cdot; \theta)) \\
& \quad \quad \text{Agent执行动作 } a_t\text{ 获得奖励 }r_{t+1}\text{和下一状态}s_{t+1}\\
& \quad \quad \text{将经验 }(s_t, a_t, r_{t+1}, s_{t+1}, d_t)\text{ 存入经验池 }\mathcal{D} \\
& \quad \quad \text{从经验池 }\mathcal{D}\text{中随机抽取一份mini-batch } \\
& \quad \quad y_t = r_{t+1} + (1 - d_t)\gamma \max_{a'} Q(s_{t+1}, a'; \theta^-) \\
& \quad \quad L(\theta) = \frac{1}{2}\left[y_t - Q(s, a; \theta) \right]^2 \\
& \quad \quad \theta \leftarrow \theta + \eta \nabla_\theta L(\theta) \\
& \quad \quad \text{每隔 } M \text{ 个时间步，将在线网络的参数复制给目标网络 } \theta^- \leftarrow \theta \\
& \text{end for} \\
\end{array}
}
$$

## DQN为什么不是普通监督学习

- 目标依赖网络自身
- 没有固定的标签
- 训练样本不是独立同分布的
- 存在bootstrapping(自举)问题，目标Q值是由当前网络参数计算得到的

## DQN只能输出离散的动作

若动作空间是连续的，需要使用其他方法
