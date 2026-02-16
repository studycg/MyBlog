> [!NOTE]
>
> 关于stack和queue的底层原理请看C++基础的STL章

# stack的定义方式

```c++
stack<int> st1;//使用默认适配器
```

```c++
stack<int, vector<int>> st2;
stack<int, list<int>> st3;
```

**如果没有为stack指定特定的容器，默认情况下用deque。**

# stack的使用

| 成员函数 | 功能                 |
| -------- | :------------------- |
| empty    | 判断栈是否为空       |
| size     | 获取栈中有效元素个数 |
| front    | 获取栈顶元素         |
| push     | 元素入栈             |
| pop      | 元素出栈             |
| swap     | 交换两个队列中的数据 |

# queue的定义方式

```c++
queue<int> q1;//使用默认适配器
```

```c++
queue<int, vector<int>> q2;
queue<int, list<int>> q3;
```

**如果没有为queue指定特定的容器，默认情况下使用deque**

| 成员函数 | 功能                   |
| -------- | :--------------------- |
| empty    | 判断队列是否为空       |
| size     | 获取队列中有效元素个数 |
| front    | 获取队头元素           |
| back     | 获取队尾元素           |
| push     | **队尾**入队列         |
| pop      | **队头**出队列         |
| swap     | 交换两个队列中的数据   |

# stack和queue没有迭代器

stack和queue是容器适配器 不自己存数据

它的底层容器入deque是有迭代器的，但是为protected，不能访问，是故意封装的。

因为stack和queue设计出来就是限制后的deque。

# push和emplace

