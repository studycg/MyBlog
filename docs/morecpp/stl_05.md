> [!NOTE]
>
> 关于map/set的底层原理请看C++基础的STL章

> [!NOTE]
>
> 关于multimap/multiset的底层原理请看C++基础的STL章

# 关联式容器

序列式容器：序列式容器里存储的式元素本身，底层为线性序列的数据结构。如：vector、list、deque、forward_list等。

关联式容器：关联式容器里存储的是`<key,value>`等键值对，在数据检索时比序列式容器效率更高。

# 树形结构与哈希结构

| 关联式容器                                                   | 容器结构 | 底层实现 |
| ------------------------------------------------------------ | -------- | -------- |
| set、map、multiset、multimap                                 | 树型结构 | 红黑树   |
| unordered_set、unordered_map、unordered_multiset、unordered_multimap | 哈希结构 | 哈希表   |

# set的属性

1. set是按照一定次序存储元素的容器，使用set的迭代器遍历set中的元素，可以得到有序序列。
2. set当中存储元素的value都是唯一的，不可重复，因此可以使用set进行去重。
3. 与map/multimap不同，map/multimap中存储的是真正的键值对`<key,value>`，set中只放value，但在底层实际存放的是`<value,value>`构成的键值对，因此在set容器中插入元素时，只需要插入value即可，不需要构造键值对。
4. set中的元素不能被修改，因为set在底层用二叉搜索树实现，若对二叉搜索树的某个结点的值进行了修改，那么这棵树不再是二叉搜索树。
5. 在内部，set的元素总是按照其内部比较对象所指示的特定严格弱排序准则进行排序。当不传入内部比较对象时，set中的元素默认按照小于来比较。
6. set容器直接通过key访问单个元素的速度通常比unordered_set容器慢，但set容器允许根据顺序对元素进行直接迭代。
7. set在底层使用红黑树实现，所以查找某个元素的时间复杂度为logN。

# set的规则

**默认**`set<int>`也就是`set<int,less<int>>`：

- `a<b`为true时，a排在b前面，集合升序存储。
- 遍历结果为由小到大。

`set<int,greater<int>>`

- `a>b`为true时，a排在b前面，集合降序存储。
- 遍历结果为由大到小

这又和priority_queue不一样了，复习一下priority_queue。

`priority_queue<int, vector<int>, less<int>>`:

- 判定规则是a<b，那么a放在b后面，小的元素都被赶到后面，**堆顶是最大的**。

`priority_queue<int, vector<int>,  greater<int>>`

- 判定规则是a>b，那么a放在b后面，大的元素都被赶到后面，**堆顶是最小的**。

# set的构造

```c++
set<int> s1;
```

```c++
set<int> s2(s1);
```

```c++
string str("abcdef");
set<char> s3(str.begin(), str.end());
```

```c++
set<int, greater<int>> s4;//比较方式指定为大于
```

# set的使用

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

- 如果find()没有找到目标元素，那么返回的迭代器就是std::end()
- set的count()返回值只有两个可能，**0**或**1**。

# set的迭代器

| 成员函数 | 功能                                         |
| -------- | -------------------------------------------- |
| begin    | 获取容器中第一个元素的正向迭代器             |
| end      | 获取容器中最后一个元素下一个位置的正向迭代器 |
| rbegin   | 获取容器中最后一个元素的反向迭代器           |
| rend     | 获取容器中第一个元素前一个位置的反向迭代器   |

# set的时间开销

关于时间复杂度：

- set的删除不需要重新排列所有元素，红黑树会做局部旋转+变色来维持平衡。
- set的插入如果破坏了平衡规则，也需要局部旋转+变色。
- set的插入、删除、查找时间复杂度都是logn

# multiset

multiset和set唯一的区别就是multiset允许键值冗余，multiset容器中存储的元素是可以重复的。

find和count的区别

| find     | 功能                                            |
| -------- | ----------------------------------------------- |
| set      | 返回 值为val的元素的迭代器                      |
| multiset | 返回底层搜索树中序的第一个值为val的元素的迭代器 |

| count    | 功能                              |
| -------- | --------------------------------- |
| set      | 返回 值为val的元素 有则是1无则是0 |
| multiset | 返回 值为val的元素的个数          |

可以看出set中find可以替代count但是multiset中不可以

# map的属性

1. map是关联式容器，它按照特定的次序（按照key来比较）存储键值key和值value组成的元素，使用map的迭代器遍历map中的元素，可以得到有序序列。
2. 在map中，键值key通常用于排序和唯一地标识元素，而值value中存储与此键值key关联的内容。键值key和值value的类型可能不同，并且在map的内部，key与value通过成员类型value_type绑定在一起，并取别名为pair。
3. map容器中元素的键值key不能被修改，但是元素的值value可以被修改，因为map底层的二叉搜索树是根据每个元素的键值key进行构建的，而不是值value。
4. 在内部，map中的元素总是按照键值key进行比较排序的。当不传入内部比较对象时，map中元素的键值key默认按照小于来比较。
5. map容器通过键值key访问单个元素的速度通常比unordered_map容器慢，但map容器允许根据顺序对元素进行直接迭代。
6. map容器支持下标访问符，即在[]中放入key，就可以找到与key对应的value。
7. map在底层是用平衡搜索树（红黑树）实现的，所以在map当中查找某个元素的时间复杂度为logN。

# map的构造

```c++
map<int, double> m1;
```

```c++
map<int, double> m2(m1);
```

```c++
map<int, double> m3(m2.begin(), m2.end());
```

```c++
map<int, double, greater<int>> m4;
```

# map的插入

map的insert的函数原型如下

```c++
pair<iterator,bool> insert (const value_type& val);
```

参数是value_type其实是pair类型的别名

```c++
typedef pair<const Key, T> value_type;
```

因此如果要向map插入元素，就要用key和value构造一个pair对象，将pair对象作为参数传入insert。

**方式一：匿名对象插入**

```c++
map<int, string> m;
//方式一：调用pair的构造函数，构造一个匿名对象插入
m.insert(pair<int, string>(2, "two"));
m.insert(pair<int, string>(1, "one"));
m.insert(pair<int, string>(3, "three"));
for (auto e : m)
{
    cout << "<" << e.first << "," << e.second << ">" << " ";
}
cout << endl; //<1,one> <2,two> <3,three>
```

**方式二：使用make_pair**

```c++
template <class T1, class T2>
pair<T1, T2> make_pair(T1 x, T2 y)
{
	return (pair<T1, T2>(x, y));
}
```

```c++
map<int, string> m;
//方式二：调用函数模板make_pair，构造对象插入
m.insert(make_pair(2, "two"));
m.insert(make_pair(1, "one"));
m.insert(make_pair(3, "three"));
for (auto e : m)
{
    cout << "<" << e.first << "," << e.second << ">" << " ";
}
cout << endl; //<1,one> <2,two> <3,three>
```

insert函数的返回值也是一个pair对象，该pair对象中第一个成员的类型是map的迭代器类型，第二个成员的类型的一个bool类型，具体含义如下：

- 若待插入元素的键值key在map当中不存在，则insert函数插入成功，并返回插入后元素的迭代器和true。
- 若待插入元素的键值key在map当中已经存在，则insert函数插入失败，并返回map当中键值为key的元素的迭代器和false。

```c++
//对<int, string>的map insert的返回结果如下
pair<map<int, string>::iterator, bool>
//所以要调用就要写
ans.first->first   // 等价于 (*ans.first).first
ans.first->second  // 等价于 (*ans.first).second
```

# map的查找

map的find函数原型为

```c++
iterator find (const key_type& k);
```

map的查找函数是根据所给key值在map当中进行查找，若找到了，则返回对应元素的迭代器，若未找到，则返回容器中最后一个元素下一个位置的正向迭代器。

# map的删除

map的erase函数原型为

```c++
//删除函数1
size_type erase (const key_type& k);
//删除函数2
void erase(iterator position);
```

也就是说：

- 既可以根据key值删除指定元素
- 也可以根据迭代器删除指定元素
- 若是根据key值进行删除，则返回实际删除的元素个数。

# map的[]运算符重载

map的[]重载函数原型为

```c++
mapped_type& operator[] (const key_type& k);
```

[ ]运算符重载函数的参数就是一个key值，而这个函数的返回值如下：

```c++
(*((this->insert(make_pair(k, mapped_type()))).first)).second
```

翻译成人话：

1. 调用insert函数插入键值对。
2. 拿出从insert函数获取到的迭代器。
3. 返回该迭代器位置元素的值value。

如果 `key` 不存在：`insert` 成功，返回指向 `(key, 默认值)` 的迭代器，`[]` 返回这个默认值的引用；

如果 `key` 已存在：`insert` 失败，返回指向已有 `key` 的迭代器，`[]` 返回已有 value 的引用。

`[]` 本质是对 `insert` 的 “便捷封装 + 特殊处理”（默认构造 + 返回引用）。

```c++
map<int, string> m;
m.insert(make_pair(2, "two"));
m.insert(make_pair(1, "one"));
m.insert(make_pair(3, "three"));
m[2] = "dragon"; //修改key值为2的元素的value为dragon
m[6] = "six"; //插入键值对<6, "six">
for (auto e : m)
{
    cout << "<" << e.first << "," << e.second << ">" << " ";
}
cout << endl; //<1,one> <2,dragon> <3,three> <6,six>
```

# map的迭代器

| 成员函数 | 功能                                         |
| -------- | -------------------------------------------- |
| begin    | 获取容器中第一个元素的正向迭代器             |
| end      | 获取容器中最后一个元素下一个位置的正向迭代器 |
| rbegin   | 获取容器中最后一个元素的反向迭代器           |
| rend     | 获取容器中第一个元素前一个位置的反向迭代器   |

使用迭代器进行正向遍历：

```c++
map<int, string> m;
m.insert(make_pair(2, "two"));
m.insert(make_pair(1, "one"));
m.insert(make_pair(3, "three"));
//用正向迭代器进行遍历
map<int, string>::iterator it = m.begin();
while (it != m.end())
{
    cout << "<" << it->first << "," << it->second << ">" << " ";
    it++;
}
cout << endl; //<1,one> <2,two> <3,three>
```

使用迭代器进行反向迭代：

```c++
map<int, string> m;
m.insert(make_pair(2, "two"));
m.insert(make_pair(1, "one"));
m.insert(make_pair(3, "three"));
//用反向迭代器进行遍历
map<int, string>::reverse_iterator rit = m.rbegin();
while (rit != m.rend())
{
    cout << "<" << rit->first << "," << rit->second << ">" << " ";
    rit++;
}
cout << endl; //<3,three> <2,two> <1,one>
```

使用for进行遍历：

```c++
map<int, string> m;
m.insert(make_pair(2, "two"));
m.insert(make_pair(1, "one"));
m.insert(make_pair(3, "three"));
//用范围for进行遍历
for (auto e : m)
{
    cout << "<" << e.first << "," << e.second << ">" << " ";
}
cout << endl; //<1,one> <2,two> <3,three>
```

# map的其它成员函数

| 成员函数 | 功能                          |
| -------- | ----------------------------- |
| size     | 获取容器中元素个数            |
| empty    | 判断容器是否为空              |
| clear    | 清空容器                      |
| swap     | 交换两个容器数据              |
| count    | 获取容器中指定key值元素的个数 |

# multimap

multimap容器与map容器的底层实现一样，也都是平衡搜索树（红黑树）。

multimap容器和map容器所提供的成员函数的接口都是基本一致的。

multimap容器和map容器的区别与multiset容器和set容器的区别一样，multimap允许键值冗余，即multimap容器当中存储的元素是可以重复的。

| find     | 功能                                              |
| -------- | ------------------------------------------------- |
| map      | 返回值为键值为key的元素的迭代器                   |
| multimap | 返回底层搜索树中序的第一个键值为key的元素的迭代器 |

| count    | 功能                                                         |
| -------- | ------------------------------------------------------------ |
| map      | 键值为key的元素存在则返回1，不存在则返回0（find成员函数可代替） |
| multimap | 返回键值为key的元素个数（find成员函数不可代替）              |

**由于multimap允许键值冗余，因此没有实现[]运算符重载函数**

# 红黑树

底层都是**红黑树**

set自动排序，map按key排序。

| 操作 | 时间复杂度    |
| ---- | ------------- |
| 查找 | $(O(\log n))$ |
| 插入 | $(O(\log n))$ |
| 删除 | $(O(\log n))$ |

为什么map底层要用红黑树而不是AVL树呢？

因为：AVL 树比红黑树更严格平衡，查找稍快，但插入和删除时需要更多旋转，维护成本更高。
红黑树通过放宽平衡条件，减少了结构调整次数，使插入删除更高效。
STL 的 `map/set` 更强调动态操作性能，因此选择红黑树作为底层实现。
