> [!NOTE]
>
> 关于unordered_map/unordered_set的底层原理请看C++基础的STL章

# unordered_set介绍

1. unordered_set是不按特定顺序存储的关联式容器，它允许通过键值快速的索引到对应的元素。
2. unordered_set中，元素的值同时也是唯一的标识它的Key。
3. 在内部，unordered_set中的元素没有按照任何特定的顺序排序，为了能在常数范围内找到指定的key，unordered_set将相同哈希值的键值放在相同的桶中。
4. unordered_set容器通过key访问单个元素要比set快，但它通常在遍历元素子集的范围迭代方面效率较低。
5. 它的迭代器至少是前向迭代器。

# unordered_set构造

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

# unordered_set的使用

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

# unordered_set迭代器

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

# find和contains的区别

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

# unordered_map的[]

```c++
mapped_type& operator[](const key_type& key);
mapped_type& operator[](key_type&& key);
//返回的是 mapped_type 的引用
```

返回的是 mapped_type 的引用，不是pair或iterator

类似的`[ ]`运算符：

- 如果key存在，返回对应的value的引用
- 如果key不存在，插入一个默认构造的value，然后返回它的引用

- 如果是unordered_multimap则没有实现[]运算符重载函数