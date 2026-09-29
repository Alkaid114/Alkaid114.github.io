---
title: "[自然语言处理] 自然语言统计建模与经典技术"
published: 2026-09-29 13:56:00
tags: ["自然语言处理", "NLP"]
category: 自然语言处理
draft: false
---

## 统计语言模型

计算句子或词汇序列出现概率的模型

$$
\begin{aligned}
P(\omega_1, \omega_2, \ldots, \omega_n) &= P(\omega_1) P(\omega_2|\omega_1) P(\omega_3|\omega_1, \omega_2) \ldots P(\omega_n|\omega_1, \ldots, \omega_{n-1}) \\
&= \prod_{i=1}^{n} P(\omega_i|\omega_1, \ldots, \omega_{i-1})
\end{aligned}
$$

- $\omega_i$: 词汇序列中的第$i$个词

本质全概率公式，计算一个词序列的联合概率。

## 马尔可夫假设与n-gram模型

直接计算$P(\omega_i|\omega_1, \ldots, \omega_{i-1})$非常困难，因此引入马尔可夫假设：一个词的出现只依赖于它前面有限个($n-1$个)词。

n-gram模型：

$$
P(\omega_i|\omega_1, \ldots, \omega_{i-1}) \approx P(\omega_i|\omega_{i-n+1}, \ldots, \omega_{i-1})
$$

常见形式：

- unigram模型：$n=1$，假设每个词独立出现
- bigram模型：$n=2$，假设每个词只依赖于前一个词
- trigram模型：$n=3$，假设每个词只依赖于前两个词

### 数据稀疏问题

当测试集中出现训练集中未出现过的词时，会导致整个句子概率为0：

$$
P(\omega^{\text{unk}}_i|\omega_1, \ldots, \omega_{i-1}) = 0 \Rightarrow P(\omega_1, \ldots, \omega_n) = 0
$$

为了解决这个问题，引入平滑方法，常用的是拉普拉斯平滑：

$$
P(\omega_i^{\text{unk}}|\omega_{i-n+1}, \ldots, \omega_{i-1}) = \frac{C(\omega_{i-n+1}, \ldots, \omega_i^{\text{unk}}) + 1}{C(\omega_{i-n+1}, \ldots, \omega_{i-1}) + |V|}
$$

- $|V|$: 词汇表大小(训练集中所有不同词的数量)
- $C(\omega_{i-n+1}, \ldots, \omega_i^{\text{unk}})$: 训练集中出现过的词序列$(\omega_{i-n+1}, \ldots, \omega_i^{\text{unk}})$的次数，必须是按顺序、连续出现在训练集语料中

## 汉语分词

### 基于字典的分词

#### 正向最大匹配法FMM

- 设字典中最长词的长度为$I$
- 从左到右扫描句子，取当前字开始的长度为$I$的字符串
- 如果在字典中，则切出该词，否则去掉最后一个字
- 直到找到字典中的词或只剩一个字

#### 逆向最大匹配法RMM

- 与FMM类似，只是从右到左扫描句子

通常比FMM更有效

#### 双向最大匹配

分别做FMM和RMM，比较切分结果：

- 选分词数最少的
- 若分词数相同，则选单字词(只有一个字的词)最少的

e.g.: 我们在野生动物园玩

- FMM: 我们/在野/生动/物/园/玩(6词，3单字词)
- RMM: 我们/在/野生动物园/玩(4词，1单字词)

选RMM的结果

#### 最少分词法

分词结果中，分词数最少的结果为最优分词结果

#### 最大词频分词法

思想：出现频率越高的词越可靠

### 分词歧义

#### 交集型切分歧义

汉字串ABC，若AB和BC都是词，则B称为交集串

#### 组合型切分歧义

汉字串AB，若A、B、AB都是词

### 新词与未登录词

词典无法穷尽所有词
