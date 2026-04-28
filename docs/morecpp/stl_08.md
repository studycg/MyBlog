> [!NOTE]
>
> deque

# deque的结构

**Map (中控器/映射表)**：一个连续的数组，里面存储的是指向各个“数据块”的指针。

**Node/Buf (数据块/缓冲区)**：实际存储元素的连续内存块（通常是 512 字节）。

**Iterator (迭代器)**：`deque` 的迭代器包含四个指针：`cur`（当前元素）、`first`（本块起点）、`last`（本块终点）、`node`（指向中控器的对应槽位）。

```c++
        map（指针数组）
     ┌────┬────┬────┬────┬────┐
     │ *  │ *  │ *  │ *  │ *  │
     └─┬──┴─┬──┴─┬──┴─┬──┴─┬──┘
       ↓    ↓    ↓    ↓    ↓
    [buf] [buf] [buf] [buf] [buf]

每个 buf 是一小段连续内存
```

# deque的迭代器

```c++
struct deque_iterator {
    T* cur;     // 当前元素
    T* first;   // 当前 buffer 起点
    T* last;    // 当前 buffer 终点
    T** node;   // 指向 map 中的指针
};
```

当deque的迭代器进行++时，底层发生以下判断：

```c++
cur++; // 尝试移动到下一个位置
if (cur == last) { // 撞到了当前块的“墙壁”
    set_node(node + 1); // 跨越到中控器的下一个槽位
    cur = first;        // 将指针指向新块的起点
}
```

为什么 `deque` 迭代器是随机访问迭代器？ 

因为它通过中控器可以计算出跨越 $N$ 个元素需要跳过多少个 `node`，虽然比 `vector` 慢（涉及除法和模运算），但在复杂度上仍是 $O(1)$。

### 为什么迭代器要存first/last

**为了在跨buffer时仍然O(1)移动**

如果没有这两个指针，很难判断当前buffer的边界在哪里。

# deque的使用

| **方法**                       | **说明** | **时间复杂度**                            |
| ------------------------------ | -------- | ----------------------------------------- |
| `push_front()` / `pop_front()` | 头部增删 | **$O(1)$**                                |
| `push_back()` / `pop_back()`   | 尾部增删 | $O(1)$                                    |
| `operator[]` / `at()`          | 随机访问 | $O(1)$ (由于有计算开销，略慢于 vector)    |
| `insert()` / `erase()`         | 中间操作 | $O(n)$ (会选择距离近的一端进行挪动以优化) |

`vector` 只能向后生长，所以头部插入需要移动全体成员。`deque` 的中控器从中间开始填充，如果头部空间不足，它会申请一个新的数据块，并将地址填入中控器的前一个槽位。

当 `deque` 扩容时，它只需要扩容“中控器（指针数组）”。由于指针很小，搬运中控器的开销远小于 `vector` 搬运所有实际元素的开销。

# deque的弱点

**deque是cache不友好的**

**随机访问开销（operator[]）**：

- `vector`：一次加法计算地址即可。
- `deque`：需要两级跳转。先找中控器确定是哪个块，再进入块内找元素。

**迭代器效率**：`deque` 的迭代器在跨越块边界时需要做逻辑判断（判断是否到达 `last` 并跳转到下一个块），这导致遍历性能明显低于 `vector`。

**内存碎片**：由于是分段申请，内存并不保证完全连续。

# deque的扩容

buffer扩展：

1. 当buffer还有空间，直接插入，没有扩容。
2. 当buffer满了，那么分配一个新的buffer并放入map中，插入元素。
   - 此时不移动旧数据

map扩展：

1. 当map已经没有空间存新的buffer指针，那么会申请更大的map，将旧的buffer的指针拷贝到中间。
   - 为什么是中间呢？为了前面还能push_back、后面还能push_back
2. 之后delete old map
3. 因为`T** node`指向旧的map 失效了

| 类型        | 是否移动已有元素         | 成本 |
| ----------- | ------------------------ | ---- |
| buffer 扩展 | ❌ 不移动                 | 低   |
| map 扩展    | ❌ 不移动数据，但重排结构 | 中   |

# deque迭代器失效

| 操作                   | 是否失效          |
| ---------------------- | ----------------- |
| push_back / push_front | 触发map扩容则失效 |
| pop_back / pop_front   | pop的这个失效
| insert（中间）         | **全部失效**      |
| erase（中间）          | **全部失效**      |
| clear                  | **全部失效**      |
| resize                 | **可能全部失效**  |
| map 扩容               | **全部失效**      |

push_back/push_front：

1. 没有扩容：不会失效
2. 新建Buffer：旧的迭代器依然有效
3. map扩容：全部迭代器失效

pop_back/pop_front：

1. 只删除元素：只影响被删除元素
2. 删除整个buffer：该Buffer上的迭代器失效

中间insert：

- 大量元素变化，失效

中间erase：

- 大量元素变化，失效

deque的插入/删除不只在一个buffer内完成：

```c++
[buf1] [buf2] [buf3]
D E F | G H I | J K L
//扩容后
G H I J K L → 全部右移
D E F | X G H | I J K | L
```

所以会导致全部迭代器失效。虽然理论上左边的迭代器没动，但是仍然全部失效。

clear：

- 所有buffer，map可能重置，全部失效。

resize：

- 扩大触发map扩容：失效
- 缩小删除元素：类似pop

# deque的初始化

**deque初始化时数据不放在开头，也不放在结尾**

**而是从中间开始**

初始化时：

```c++
map:
[ _ _ buf0 _ _ ]
      ↑
   start / finish
```

```c++
buf0:
[ _ _ _ _ _ _ ]
      ↑
   cur（中间）
```

# deque的问答

> 为什么stack和queue在默认情况下使用deque做底层容器？
>
> 为什么 `stack` 默认用 `deque` 而不是 `vector`？

虽然 `vector` 也能实现栈（`push_back`/`pop_back`），但 `deque` 有以下几个杀手锏：

- **内存块的稳定性**： `vector` 扩容是**“申请新空间 -> 搬运旧数据 -> 释放旧空间”**。如果栈内存储的是大型对象，这种搬运代价极大。 `deque` 扩容时，原来的数据块（Node）原地不动，只需要在中控器（Map）里添加一个新指针。**这意味着：`deque` 在扩容时不需要拷贝或移动之前的元素。**
- **内存浪费更少**： `vector` 采用倍增策略（1.5x 或 2x）。如果你刚好在一个很大的 `vector` 基础上只多加了一个元素，它可能会额外申请几十 MB 却闲置。而 `deque` 是按块申请（通常 512B），内存利用率更平滑。
- **收缩友好性**： 当元素弹出时，`deque` 可以释放已经空出来的块，而 `vector` 除非显式调用 `shrink_to_fit`，否则永远霸占着峰值内存。

>  为什么 `queue` 默认用 `deque` 而不是 `list`？
>
> `list` 在头尾操作上也是 $O(1)$，为什么不选它？

- **Cache Locality (缓存局部性)**：

  `list` 的每一个节点在内存中都是**支离破碎**的。每访问一个元素，CPU 都要进行一次寻址。

  `deque` 的每一个数据块内是**连续内存**。在遍历或处理队列时，CPU 预取（Prefetch）机制能发挥作用。在性能敏感的游戏引擎里，连续内存永远优先于链表。

- **内存分配压力 (Allocation Overhead)**：

  `list` 每插入一个元素都要调用一次 `operator new`。

  `deque` 插入一个块（比如能存 64 个 `int`）才调用一次 `operator new`。

  频繁的系统调用（Syscall）会产生严重的内存碎片，并拖慢主线程帧率。

# 为什么一个buffer512字节？

1. CPU的一个cache line一般是64字节 为了cache友好
2. 减少map的访问次数
3. 避免像vector大块搬迁

# 关于sizeof

deque的典型成员

```c++
struct deque {
    T** map;        // 指针数组
    size_t map_size;

    iterator start;
    iterator finish;
};
```

map：8

map_size：8

start：32

finish：32