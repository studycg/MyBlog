> [!NOTE]
>
> 关于unordered_map/unordered_set的底层原理请看C++基础的STL章

# 哈希表的使用

## unordered_set介绍

1. unordered_set是不按特定顺序存储的关联式容器，它允许通过键值快速的索引到对应的元素。
2. unordered_set中，元素的值同时也是唯一的标识它的Key。
3. 在内部，unordered_set中的元素没有按照任何特定的顺序排序，为了能在常数范围内找到指定的key，unordered_set将相同哈希值的键值放在相同的桶中。
4. unordered_set容器通过key访问单个元素要比set快，但它通常在遍历元素子集的范围迭代方面效率较低。
5. 它的迭代器至少是前向迭代器。

## unordered_set构造

```c++
unordered_set<int> us1;
```

```c++
unordered_set<int> us2(us1);
```

```c++
string str("abcdef");
unordered_set<char> us3(str.begin(),str.end());
```

## unordered_set的使用

| 成员函数 | 功能                           |
| -------- | ------------------------------ |
| insert   | 插入指定元素                   |
| erase    | 删除指定元素                   |
| find     | 查找指定元素                   |
| size     | 获取容器中元素的个数           |
| empty    | 判断容器是否为空               |
| clear    | 清空容器                       |
| swap     | 交换两个容器中的数据           |
| count    | 获取容器中指定元素值的元素个数 |

- 若find没有找到返回std::end()
- find()同样只会返回0或1

- 因为unordered_set的底层是哈希表，所以find与count的时间复杂度是O(1)
- unordered_set的insert函数也会返回`std::pair<iterator, bool>`
- unordered_set不能reverse，因为没有意义
- set和unordered_set没有重载[]运算符函数

## unordered_set迭代器

| 迭代器 | 功能                                         |
| ------ | -------------------------------------------- |
| begin  | 获取容器中第一个元素的正向迭代器             |
| end    | 获取容器中最后一个元素下一个位置的正向迭代器 |

- unordered_set没有反向迭代器

如果使用

```c++
std::unordered_set<int> us = {3,1,4,2};
for (auto it = us.begin(); it != us.end(); ++it)
{
    std::cout << *it << " ";
}
```

1. 不保证有序
2. 不保证按插入顺序
3. 不保证每次运行都一样

## find和contains的区别

find：

找到 → 指向元素的迭代器
没找到 → end()

```c++
//find
iterator find(const Key& key);
const_iterator find(const Key& key) const;
```

contains：

返回：true / false

```c++
bool contains(const Key& key) const;
```

contains只关心是否存在 不会返回迭代器

## unordered_map的[]

```c++
mapped_type& operator[](const key_type& key);
mapped_type& operator[](key_type&& key);
//返回的是 mapped_type 的引用
```

返回的是 mapped_type 的引用，不是pair或iterator

类似的`[ ]`运算符：

- 如果key存在，返回对应的value的引用
- 如果key不存在，插入一个默认构造的value，然后返回它的引用

- **如果是unordered_multimap则没有实现[]运算符重载函数**

# 哈希表的结构

unordered_map / unordered_set 的核心就是：用一个函数，把“任意 key”映射到一个数组下标

**数组+链表**

```c++
buckets (数组)
[
  bucket0 -> node -> node -> ...
  bucket1 -> node -> ...
  bucket2 -> nullptr
  ...
]
```

插入：

1. 计算哈希值
2. 定位桶
3. 处理冲突：空则直接插入，非空则遍历链表

为什么不用开发地址法呢？

- 插入删除更简单
- 不需要复杂的探测策略

| 操作 | 平均复杂度 | 最坏复杂度 |
| ---- | ---------- | ---------- |
| 插入 | O(1)       | O(n)       |
| 查找 | O(1)       | O(n)       |
| 删除 | O(1)       | O(n)       |

所有元素 hash 到同一个 bucket，此时退化为链表。

- bucket一般是素数

- 相同key一定要相同hash

- 尽量均匀分布

# 哈希表的迭代器

```c++
node* cur;        // 当前节点
hashtable* ht;    // 指向整个哈希表（有些实现才有）
```

**迭代器++的逻辑**

如果当前节点有 next：cur = cur->next

否则：跳到下一个非空 bucket

**为什么迭代器要存hashtable？**

因为需要知道：

1. bucket数组在哪里
2. bucket_count
3. 当前属于哪个bucket

**为什么有的实现只存node？**

因为node里通常会存

```c++
struct node {
    node* next;
    size_t hash;  // 保存 hash 值（关键！）
};
```

可以通过hash值反推出当前bucket，从而找到下一个bucket。

那这样不就找不到桶数组了吗？

迭代器的代码一般是嵌套在unordered_map内部实现的，也就是说，iterator的实现代码可以访问hashtable的内部成员。

# 迭代器失效

rehash会使迭代器失效

# 哈希表的扩容

$$
load\_factor=\frac{size}{bucket\_count}
$$

为什么要扩容？

元素越来越多→链表越来越长→查找变慢

当`load_factor>max_load_factor`则发生扩容，默认因子为1。

扩容步骤：

1. 重新分配更大的bucket数组
1. 所有元素重新计算hash值（rehash），这里的时间复杂度是O(n)
1. 将元素挂到新的桶下面

# sizeof的大小

```c++
class unordered_map {
    bucket* buckets;      // 指向桶数组
    size_t bucket_count;  
    size_t size;          
    float max_load_factor;//4字节可能对齐到8
};
```

一般等于32个字节或更大。

（但是我在VS里试了下为什么是80字节）

那么sizeof(node)有多大呢？

```c++
struct node {
    pair<const int, int> data;  // 8字节
    node* next;                 // 8字节
    size_t hash;                // 8字节
};
```

24字节吧