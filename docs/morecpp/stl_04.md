> [!NOTE]
>
> priority_queue

# 使用

| 操作       | 堆       | 红黑树   |
| ---------- | -------- | -------- |
| 插入       | O(log n) | O(log n) |
| 删除最大值 | O(log n) | O(log n) |
| 查最大值   | O(1)     | O(log n) |

## 优缺点

优点：

- 堆可以 **O(1) 取最大值**
- 常数更小（数组 vs 指针）

缺点：

- 不能有序遍历
- 不能查任意元素

## 定义方式

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

## 各个接口的使用

| 成员函数 | 功能                     |
| -------- | ------------------------ |
| push     | 插入元素到队尾，并排序   |
| pop      | 弹出队头元素（堆顶元素） |
| top      | 访问对头元素（堆顶元素） |
| size     | 获取队列中的有效元素个数 |
| empty    | 判断队列是否为空         |
| swap     | 交换两个队列的内容       |

priority_queue不提供find函数

# 底层实现

priority_queue默认使用**顺序存储的完全二叉树**实现。

完全二叉树有一个性质：

- 对于下标为`i`的结点
- 左孩子`2i+1`
- 右孩子`2i+2`

priority_queue的底层vector被设置为了protected，所以无法直接获取底层vector的数据和迭代器。

**prioirty只保证父节点和子节点有序，不保证兄弟结点之间有序。**

# 触发扩容

priority_queue的底层默认是vector，所以扩容和vector一模一样。

# 迭代器

**标准库根本没有priority_queue的迭代器！**

# 上浮下沉

**push**：O(logn)

将元素插入数组末尾，执行上浮。直到满足性质。

**pop删除堆顶**：O(logn)

1. 取出堆顶
2. 用最后一个元素覆盖根
3. 删除最后一个元素
4. 执行下沉

**top访问堆顶**：O(1)

## 上浮

新元素插入末尾不断和父结点比较，如果更大就交换。

```c++
void siftUp(vector<int>& heap, int i) {
    while (i > 0) {
        int parent = (i - 1) / 2;

        // 如果已经满足堆性质，停止
        if (heap[parent] >= heap[i]) break;

        // 否则交换
        swap(heap[parent], heap[i]);

        // 继续向上
        i = parent;
    }
}
```

堆只要求满足父子关系，不满足兄弟关系。

所以只要这个结点比父节点大，那一定比另一个兄弟结点大。

## 下沉

根结点被替换后从上往下回复堆结构。

```c++
void siftDown(vector<int>& heap, int n, int i) {
    while (true) {
        int left = 2 * i + 1;
        int right = 2 * i + 2;
        int largest = i;

        // 找最大值
        if (left < n && heap[left] > heap[largest])
            largest = left;

        if (right < n && heap[right] > heap[largest])
            largest = right;

        // 如果已经满足堆性质
        if (largest == i) break;

        // 交换
        swap(heap[i], heap[largest]);

        // 继续向下
        i = largest;
    }
}
```

## 插入

```c++
void push(vector<int>& heap, int x) {
    heap.push_back(x);
    siftUp(heap, heap.size() - 1);
}
```

## 删除

```c++
void pop(vector<int>& heap) {
    int n = heap.size();
    swap(heap[0], heap[n - 1]); // 堆顶换到最后
    heap.pop_back();            // 删除

    siftDown(heap, heap.size(), 0);
}
```

## 建堆

```c++
for (int i = (n - 2) / 2; i >= 0; --i) {
    siftDown(a, n, i);
}
```

