> [!NOTE]
>
> 关于priority_queue的底层原理请看C++基础的STL章

# 介绍

优先级队列默认使用vector作为底层容器，在vector上使用了堆算法将vector中的结构构造成堆的结构。

因此priority_queue就是堆，所有需要用到堆的位置都可以考虑使用priority_queue。

# 定义方式

使用vector作为底层容器，内部构造大堆：

```c++
priority_queue<int, vector<int>, less<int>> q1;
```

使用vector作为底层容器，内部构造小堆：

```c++
priority_queue<int, vector<int>, greater<int>> q2;
```

大堆是堆顶元素最大，那么为什么传入`less<int>`？

小堆是堆顶元素最小，那么为什么传入`greater<int>`？

`less<int>()`：表示 "a < b" 为 true 时，a 排在 b 后面 → 最终大的元素排在堆顶（大根堆）。

`greater<int>()`：表示 "a > b" 为 true 时，a 排在 b 后面 → 最终小的元素排在堆顶（小根堆）。

不指定底层容器和内部构造：

```c++
priority_queue<int> q;
```

**默认使用vector作为底层容器，内部默认构造大堆结构**

# 各个接口的使用

| 成员函数 | 功能                     |
| -------- | ------------------------ |
| push     | 插入元素到队尾，并排序   |
| pop      | 弹出队头元素（堆顶元素） |
| top      | 访问对头元素（堆顶元素） |
| size     | 获取队列中的有效元素个数 |
| empty    | 判断队列是否为空         |
| swap     | 交换两个队列的内容       |

priority_queue不提供find函数

# 其它

priority_queue的底层vector被设置为了protected，所以无法直接获取底层vector的数据和迭代器。