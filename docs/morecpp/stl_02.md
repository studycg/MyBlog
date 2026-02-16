> [!NOTE]
>
> 关于list的底层原理请看C++基础的STL章

# list介绍

1. list是一种可以在常数范围内在任意位置进行插入和删除的序列式容器，并且该容器可以前后双向迭代。

2. list的底层是双向链表结构，双向链表中每个元素存储在互不相关的独立结点当中，在结点中通过指针指向其前一个元素和后一个元素。

3. list与forward_list非常相似，最主要的不同在于forward_list是单链表，只能进行单方向迭代。

4. 与其他容器相比，list通常在任意位置进行插入、删除元素的执行效率更高。

5. list和forward_list最大的缺陷是不支持在任意位置的随机访问，其次，list还需要一些额外的空间，以保存每个结点之间的关联信息（对于存储的类型较小元素来说这可能是一个重要的因素）。

# list构造

```c++
list<int> lt1; //构造int类型的空容器
```
```c++
list<int> lt2(10, 2); //构造含有10个2的int类型容器
```

```c++
list<int> lt3(lt2); //拷贝构造int类型的lt2容器的复制品
```
```c++
string s("hello world");
list<char> lt4(s.begin(),s.end()); //构造string对象某段区间的复制品
```
```c++
int arr[] = { 1, 2, 3, 4, 5 };
int sz = sizeof(arr) / sizeof(int);
```
```c++
list<int> lt5(arr, arr + sz); //构造数组某段区间的复制品
```

# list插入删除

> push_front和pop_front

push_front用于头插一个数据、pop_front用于头删一个数据。

> push_back和pop_back

push_back用于尾插一个数据、pop_back用于尾删一个数据。

> insert

1. 在指定迭代器的位置插入一个数
2. 在指定迭代器的位置插入n个值为val的数
3. 在指定迭代器的位置插入一段迭代器区间

```c++
list<int> lt;
lt.push_back(1);
lt.push_back(2);
lt.push_back(3);
//1 2 3
list<int>::iterator pos = find(lt.begin(), lt.end(), 2);
lt.insert(pos, 9); //在2的位置插入9
//1 9 2 3
pos = find(lt.begin(), lt.end(), 3);
lt.insert(pos, 2, 8); //在3的位置插入2个8
//1 9 2 8 8 3
vector<int> v(2, 7);
pos = find(lt.begin(), lt.end(), 1);
lt.insert(pos, v.begin(), v.end()); //在1的位置插入2个7
//7 7 1 9 2 8 8 3
```

**注：**find函数是alogrithm当中的一个函数，该函数在指定迭代器区间寻找指定值的位置，并返回该位置的迭代器。

> erase

list当中的earse函数支持两种删除方式

1. 删除指定迭代器位置的元素
2. 删除指定迭代器区间（左闭右开）的所有元素

```c++
list<int> lt;
lt.push_back(1);
lt.push_back(2);
lt.push_back(3);
lt.push_back(4);
lt.push_back(5);
//1 2 3 4 5
list<int>::iterator pos = find(lt.begin(), lt.end(), 2);
lt.erase(pos); //删除2
// 1 3 4 5
pos = find(lt.begin(), lt.end(), 4);
lt.erase(pos, lt.end()); //删除4及其之后的元素
//1 3
```

# list迭代器的使用

> begin和end

通过begin函数可以得到容器中第一个元素的正向迭代器，通过end函数可以得到容器中最后一个元素的**后一个位置**的正向迭代器。

```c++
list<int> lt(10, 2);
//正向迭代器遍历容器
list<int>::iterator it = lt.begin();
while (it != lt.end())
{
    cout << *it << " ";
    it++;
}
```

> rbegin和rend

通过rbegin函数可以得到容器中最后一个元素的反向迭代器，通过rend函数可以得到容器中第一个元素的**前一个位置**的反向迭代器。

```c++
list<int> lt(10, 2);
//反向迭代器遍历容器
list<int>::reverse_iterator rit = lt.rbegin();
while (rit != lt.rend())
{
    cout << *rit << " ";
    rit++;
}
```

# list的元素获取

> front和back

front函数用于获取list容器中的第一个元素，back函数用于获取list容器当中的最后一个元素。

```c++
v.front();
//等价于
*(v.begin());

v.back();
//等价于
*(v.end()-1);
```

# list大小控制

> size

size函数获取容器当前元素个数

> resize

1. 当所给值大于当前的size时，将size扩大到该值，扩大的数据为第二个所给值，若未给出，则默认为容器所存储类型的默认构造函数所构造出来的值。
2. 当所给值小于当前的size时，将size缩小到该值。

```c++
list<int> lt(5, 3);
//3 3 3 3 3
lt.resize(7, 6); //将size扩大为7，扩大的值为6
//3 3 3 3 3 6 6
lt.resize(2); //将size缩小为2
//3 3
```

> empty

empty判断当前容器是否为空

> clear

clear用于清空容器，清空后size为0。

# list的操作函数

> sort

sort函数可以将容器中的默认数据排为升序

> splice

splice的三种拼接方式：

1. 将整个容器拼接到 另一个容器的指定迭代器位置
2. 将容器当中的某一个数据拼接到 另一个容器的指定迭代器位置
3. 将容器指定迭代器区间的数据拼接到 另一个容器指定迭代器的位置

```c++
list<int> lt1(4, 2);
list<int> lt2(4, 6);
lt1.splice(lt1.begin(), lt2); //将容器lt2拼接到容器lt1的开头
for (auto e : lt1)
{
    cout << e << " ";
}
cout << endl; //6 6 6 6 2 2 2 2 

list<int> lt3(4, 2);
list<int> lt4(4, 6);
lt3.splice(lt3.begin(), lt4, lt4.begin()); //将容器lt4的第一个数据拼接到容器lt3的开头
for (auto e : lt3)
{
    cout << e << " ";
}
cout << endl; //6 2 2 2 2 

list<int> lt5(4, 2);
list<int> lt6(4, 6);
lt5.splice(lt5.begin(), lt6, lt6.begin(), lt6.end()); //将容器lt6的指定迭代器区间内的数据拼接到容器lt5的开头
for (auto e : lt5)
{
    cout << e << " ";
}
cout << endl; //6 6 6 6 2 2 2 2
```

splice会改变另一个容器的内容。

```c++
std::list<int> A = {1,2,3};
std::list<int> B = {4,5,6};

A.splice(A.end(), B);
//结果
A: 1 2 3 4 5 6
B: 空
```

为什么B变空了？因为B的头指针被断开，所以结点都连接到了A上。

> remove

remove函数用于删除容器当中特定值的元素

```c++
list<int> lt;
lt.push_back(1);
lt.push_back(4);
lt.push_back(3);
lt.push_back(3);
lt.push_back(2);
lt.push_back(2);
lt.push_back(3);
for (auto e : lt)
{
    cout << e << " ";
}
cout << endl; //1 4 3 3 2 2 3
lt.remove(3); //删除容器当中值为3的元素
for (auto e : lt)
{
    cout << e << " ";
}
cout << endl; //1 4 2 2
```

> remove_if

remove_if函数用于删除容器当中满足条件的元素

```c++
bool single_digit(const int& val)
{
	return val < 10;
}

list<int> lt;
lt.push_back(10);
lt.push_back(4);
lt.push_back(7);
lt.push_back(18);
lt.push_back(2);
lt.push_back(5);
lt.push_back(9);
for (auto e : lt)
{
    cout << e << " ";
}
cout << endl; //10 4 7 18 2 5 9
lt.remove_if(single_digit); //删除容器当中值小于10的元素
for (auto e : lt)
{
    cout << e << " ";
}
cout << endl; //10 18
```

> unique

unique函数用于删除容器当中连续的重复元素

```c++
list<int> lt;
lt.push_back(1);
lt.push_back(4);
lt.push_back(3);
lt.push_back(3);
lt.push_back(2);
lt.push_back(2);
lt.push_back(3);
for (auto e : lt)
{
    cout << e << " ";
}
cout << endl; //1 4 3 3 2 2 3
lt.sort(); //将容器当中的元素排为升序
lt.unique(); //删除容器当中连续的重复元素
for (auto e : lt)
{
    cout << e << " ";
}
cout << endl; //1 2 3 4
```

> merge

merge函数用于将一个有序list容器合并到另一个有序list容器当中，使得合并后的list容器任然有序。（类似于归并排序）

```c++
list<int> lt1;
lt1.push_back(3);
lt1.push_back(8);
lt1.push_back(1);
list<int> lt2;
lt2.push_back(6);
lt2.push_back(2);
lt2.push_back(9);
lt2.push_back(5);
lt1.sort(); //将容器lt1排为升序
lt2.sort(); //将容器lt2排为升序
lt1.merge(lt2); //将lt2合并到lt1当中
for (auto e : lt1)
{
    cout << e << " ";
}
cout << endl; //1 2 3 5 6 8 9 
```

`std::list::merge`和push_back/push_front不是一个层面的东西

`list::merge` 既不拷贝，也不移动元素。它直接“转移节点指针”。

也就是说：merge 是节点级别的重链接，不是对象级别的移动

`A.merge(B);`是将B的结点摘下来插入到A的合适位置（再排序）这个过程merge**本质上调用splice**。

```c++
A: 1 <-> 3 <-> 5
B: 2 <-> 4 <-> 6
//merge后
A: 1 <-> 2 <-> 3 <-> 4 <-> 5 <-> 6
B: empty
```

merge的时间复杂度为O(m+n)

> reverse

reverse函数用于将容器中的元素位置进行逆置

> assign

assign函数用于将新的内容分配给容器，替换其当前的内容，新内容有两种赋予方式：

1. 将n个值为val的数据分配给容器
2. 将所给迭代器区间中的内容分配给容器

```c++
list<char> lt(3, 'a');
lt.assign(3, 'b'); //将新内容分配给容器，替换其当前内容
//b b b
string s("hello world");
lt.assign(s.begin(), s.end()); //将新内容分配给容器，替换其当前内容
//h e l l o   w o r l d
```

assign不会改变s的值，assign只是将[first,last)里的元素复制到当前容器

可以理解为调用了push_back

> swap

swap函数用于交换两个容器的内容
