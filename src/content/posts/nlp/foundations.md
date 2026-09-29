---
title: "[自然语言处理] NLP基础理论"
published: 2026-09-29 9:00:00
tags: ["自然语言处理", "NLP"]
category: 自然语言处理
draft: false
---

## 信息论复习

### 熵

度量单个随机变量在所有可能取值上的**平均不确定性**

$$
H(X) = -\sum_{x \in X} p(x) \log p(x)
$$

- $X$: 离散随机变量
- $p(x)$: 概率分布，随机变量$X$取值为$x$的概率

单位：

- 比特：以2为底
- 纳特：以e为底

性质：

- 分布越均匀，熵越大
- 分布被少数取值主导，熵越小
- 若某个$p(x) = 1$，则熵为0

### 联合熵

度量多个随机变量同时出现的总不确定性

$$
H(X, Y) = -\sum_{x \in X} \sum_{y \in Y} p(x, y) \log p(x, y)
$$

性质：

- 若$X$和$Y$独立，则$p(x, y) = p(x)p(y)$，所以$H(X, Y) = H(X) + H(Y)$
- 若存在依赖关系，则$H(X, Y) < H(X) + H(Y)$，因为已知一个变量会减少另一个变量的不确定性

### 条件熵

已知随机变量$X$后，随机变量$Y$还剩多少不确定性

$$
H(Y|X) = -\sum_{x \in X} p(x) H(Y|X=x)
$$

$H(Y|X=x)$就是随机变量$Y$在$X=x$的条件下的熵，也就是用$p(y|x)$计算的熵：

$$
H(Y|X=x) = -\sum_{y \in Y} p(y|x) \log p(y|x)
$$

所以：

$$
\begin{aligned}
H(Y|X) &= -\sum_{x \in X} \sum_{y \in Y} p(x) p(y|x) \log p(y|x) \\
&= -\sum_{x \in X} \sum_{y \in Y} p(x, y) \log p(y|x) \\
\end{aligned}
$$

重要关系：

$$
H(Y|X) = H(X, Y) - H(X)
$$

可以类比$p(y|x) = \dfrac{p(x, y)}{p(x)}$，因为熵是对数，所以乘除变加减

性质：

- 若$Y$高度依赖$X$，则$H(Y|X)$显著降低
- 若$Y$与$X$独立，则$H(Y|X) = H(Y)$，因为已知$X$不会减少$Y$的不确定性

### 交叉熵

衡量模型预测分布于真实分布之间的差异

真实分布$X \sim p(x)$，模型预测分布$Y \sim q(x)$：

$$
H(p, q) = -\sum_{x \in X} p(x) \log q(x)
$$

意为用预测分布$q(x)$来编码真实分布$p(x)$时所需的平均信息量

### 相对熵(KL散度)

衡量两个分布的相对差异

$$
D_{KL}(p||q) = \sum_{x \in X} p(x) \log \frac{p(x)}{q(x)}
$$

性质：

- $p(x) = q(x)$时，$D_{KL}(p||q) = 0$
- 非对称：$D_{KL}(p||q) \neq D_{KL}(q||p)$

与交叉熵、熵的关系：

$$
D_{KL}(p||q) = H(p, q) - H(p)
$$

### 困惑度(Perplexity)

衡量分布的不确定性，也用于衡量两个分布的差异，常用于评价概率分布预测效果

$$
\begin{aligned}
\text{Perplexity}(p,q) &= 2^{-\sum_{x \in X} p(x) \log q(x)} \\
&= 2^{H(p, q)} \\
&= 2^{H(p)} \cdot 2^{D_{KL}(p||q)} \\
\end{aligned}
$$
