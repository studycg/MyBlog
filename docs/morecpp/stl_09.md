# emplace原理

`emplace`能实现原地构造，靠的是C++11引入的三个特性：

1. **变参模板**：允许接受任意数量和类型的参数
2. **完美转发**：确保参数在传递给构造函数时，左值/右值属性保持不变
3. **定位new(placement new)**：在已经分配好的原始内存上直接调用构造函数

# emplace流程

使用`push_back`时：

1. **构造临时对象**：在栈上或临时内存调用 `Monster("Orc", 100)`。
2. **寻找位置**：检查 `vector` 是否有空位。
3. **拷贝/移动**：
   - 如果有移动构造函数，调用 `Monster(Monster&&)` 将临时对象搬到 `vector` 内存里。
   - 如果没有，调用拷贝构造函数 `Monster(const Monster&)`。
4. **析构临时对象**：销毁步骤 1 创建的那个对象。

使用 `emplace_back`时：

1. **参数传递**：将 `"Orc"` 和 `100` 两个参数**通过完美转发**直接传给底层。
2. **寻找位置**：检查 `vector` 是否有空位。
3. **原地构造**：在 `vector` 的末尾内存上直接执行 `new (&mem) Monster("Orc", 100)`。
   - **结果**：既没有临时对象生成，也没有拷贝/移动的开销。

# emplace内存泄漏

**场景A：当参数本事是对象时**

已经有一个构造好的对象 `m`，调用 `v.emplace_back(m)` 和 `v.push_back(m)` 是**完全等价**的，因为此时 `emplace` 只能调用拷贝构造函数。

**场景B：隐式类型转换的隐患**

```c++
std::vector<std::unique_ptr<int>> v;
// v.push_back(new int(5)); // 编译失败，unique_ptr 构造函数是 explicit
v.emplace_back(new int(5));   // 编译成功
```

但如果 `emplace_back` 在构造过程中因为内存不足抛出异常，而你的原生指针 `new int(5)` 还没来得及交给 `unique_ptr` 管理，就会造成**内存泄漏**。这种情况下 `push_back(std::make_unique<int>(5))` 反而更安全。

# 所有容器都支持emplace

| **容器类别** | **容器名称**        | **尾部 (back)**      | **头部 (front)** | **指定位置/关联键**              |
| ------------ | ------------------- | -------------------- | ---------------- | -------------------------------- |
| **序列容器** | `vector`            | `emplace_back`       | 不支持           | `emplace`                        |
|              | `deque`             | `emplace_back`       | `emplace_front`  | `emplace`                        |
|              | `list`              | `emplace_back`       | `emplace_front`  | `emplace`                        |
|              | `forward_list`      | 不支持               | `emplace_front`  | `emplace_after`                  |
| **关联容器** | `set / map`         | 不支持               | 不支持           | `emplace`, `try_emplace` (C++17) |
| **无序容器** | `unordered_map/set` | 不支持               | 不支持           | `emplace`                        |
| **适配器**   | `stack / queue`     | `emplace` (底层调用) | 不支持           | 不支持                           |

# emplace主要性能差异

| **场景**                                    | **push_back / insert 行为**                              | **emplace 行为**                                  | **性能胜者**              | **备注**                                                     |
| ------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------- | ------------------------- | ------------------------------------------------------------ |
| **传入字面量或构造参数** (如 `"Orc", 100`)  | 1. 构造临时对象 `T` 2. 移动/拷贝到容器 3. 析构临时对象   | 1. 在容器内存中**直接构造**                       | **`emplace` (大胜)**      | 节省了一次移动/拷贝和一次析构。                              |
| **传入已存在的左值对象** (如 `Monster m`)   | 1. 拷贝构造到容器                                        | 1. 拷贝构造到容器                                 | **平手**                  | 此时 `emplace` 无法原地构造，必须拷贝。                      |
| **传入临时对象 (右值)** (如 `std::move(m)`) | 1. 移动构造到容器                                        | 1. 移动构造到容器                                 | **平手**                  | 现代编译器优化后两者几乎一致。                               |
| **关联容器插入 (键已存在)**                 | 1. 构造 `pair<K,V>` 临时对象 2. 发现键存在，丢弃临时对象 | 1. **依然可能**构造参数对应的临时对象(取决于实现) | **`try_emplace` (C++17)** | `try_emplace` 在发现键存在时，完全不构造值对象，是最高效的。 |

# try_emplace

在 `std::map<int, Monster>` 中使用 `m.emplace(1, "Orc")`：

- 即使 `ID 1` 的玩家已经存在，`emplace` 仍然可能先根据 `"Orc"` 构造出一个 `Monster` 临时对象，然后再去红黑树里找位置，最后发现位置被占了，再把刚造好的 `Monster` 析构掉。
- **`try_emplace`**：它会先检查键是否存在。如果不存在，才原地构造。这在处理高频更新的玩家数据时，性能提升非常显著。

# emplace问答

> 如果我给 `emplace_back` 传递参数时，没有使用 `std::forward` 会发生什么？

一个右值一旦被命名，就变成了左值。

```c++
void process(int&& x) {
    // 这里的 x 已经有了名字，它在 process 函数内部是一个【左值】！
    // 如果你直接把 x 传给下一个函数，它会调用左值版本的重载。
}
```

`emplace_back` 是一个模板函数。如果你不使用完美转发，你在函数外部传入的右值（比如临时对象），在 `emplace_back` 的函数体内会变成左值。此时，它再去调用 `T` 的构造函数时，就只能调用**拷贝构造**，原本高效的“移动”就失效了。

> 为什么完美转发必须配合**万能引用**才能工作？

为什么 `emplace_back` 的参数长这样：`Args&&... args`？

在模板中，`T&&` 并不一定代表右值引用。如果发生了**类型推导**，它就变成了“万能引用”。

**规则**：

1. 如果你传入的是左值，`Args` 会被推导为 `T&`。
2. 如果你传入的是右值，`Args` 会被推导为 `T`。

搭配**引用折叠规则**（C++11 规定）：

- `T& + &&` $\rightarrow$ `T&` （左值引用）
- `T&& + &&` $\rightarrow$ `T&&` （右值引用）

这套机制保证了 `emplace_back` 可以同时接收左值和右值，而不需要写两份代码。

> 假设emplace_back中没有使用完美转发

`std::forward<Args>(args)` 的本质是一个**条件强制转换**。

- 如果 `Args` 是左值引用，它把 `args` 转换成左值引用（维持现状）。
- 如果 `Args` 是右值类型，它把 `args` 转换回右值（恢复其“移动”的身份）。

假设emplace_back没有使用完美转发std::forward

```c++
template<typename... Args>
void emplace_back(Args&&... args) {
    // 此时 args 是有名字的变量，它是左值！
    new (ptr) T(args...); // 这里永远只会触发 T 的拷贝构造函数
}
```

在加上完美转发之后，emplace_back应该是这样的

```c++
template<typename... Args>
void emplace_back(Args&&... args) {
    new (ptr) T(std::forward<Args>(args)...);
}
```

> 如果在`std::vector<int>`中执行v.emplace_back()，不传任何参数，会发生什么？

`push_back` **没有**默认参数。它的原型是 `push_back(const T&)` 或 `push_back(T&&)`，你必须传个东西进去。

但 `emplace_back` 是变参模板，你可以**什么都不传**。

底层行为：

当你调用 `v.emplace_back()` 时，底层执行的是： `::new (ptr) T();`

这会触发**值初始化**：

- 如果 `T` 是内置类型（如 `int`, `float`, `指针`），它会被初始化为 **0**（或空指针）。
- 如果 `T` 是类类型，它会调用 **默认构造函数**。

结论：是的，对于 `vector<int>`，它会在尾部插入一个 `0`。但这并不是因为默认参数，而是因为空参数列表触发了类型的默认构造逻辑。

> 容器调用了new吗？

STL 容器为了灵活性，将内存管理（Allocate/Deallocate）和对象生命周期管理（Construct/Destroy）解耦了。

- `allocator::allocate(n)`：只负责分配 $n * sizeof(T)$ 的原始字节，不调用构造函数。
- `allocator::construct(ptr, args...)`：内部封装了 `placement new`，负责在 `ptr` 上调用构造函数。

# emplace调用链

1. **外部输入**：`v.emplace_back(std::move(heavy_object))`。
2. **万能引用捕获**：`Args&&` 识别出这是一个右值引用。
3. **函数内部**：`args` 变成了一个有名字的左值（在 `emplace_back` 的作用域内）。
4. **转发时刻**：`std::forward<Args>(args)` 看到 `Args` 是右值属性，于是将 `args` 强转回右值。
5. **原地构造**：`Placement New` 接收到的是一个右值，成功**触发 `T` 的移动构造函数**。

> 以vector::emplace_back为例查看执行流程

`std::vector<Monster>` 为例：

**第一步：获取插入地址**

`vector` 内部维护着 `_M_finish` 指针，它指向当前最后一个元素的下一个位置。

- 如果 `_M_finish != _M_end_of_storage`（空间足够），插入地址就是 `_M_finish`。
- 如果空间不足，它会先进行扩容（申请新内存，把老对象**移动**过去），然后更新插入地址。

**第二步：参数转发与原地构造**

```c++
// 简化版的 vector::emplace_back 内部实现
template<typename... _Args>
void emplace_back(_Args&&... __args) {
    if (_M_finish != _M_end_of_storage) {
        // [核心点]：使用 placement new 在 _M_finish 处构造对象
        // std::forward 保证了如果传入的是右值，则能匹配到 Monster 的移动构造函数
        ::new (static_cast<void*>(_M_finish)) Monster(std::forward<_Args>(__args)...);
        ++_M_finish;
    } else {
        // 扩容逻辑...
    }
}
```

1. **当你传递构造参数时**（如 `v.emplace_back("Orc", 100)`）： `Placement New` 会根据参数类型，直接调用 `Monster(std::string, int)` 这个构造函数。

2. **当你传递一个已有的对象时**（如 `v.emplace_back(existing_monster)`）：

   1. `args` 会被推导为 `Monster&`。

   2. `std::forward` 将其转发为 `Monster&`。

   3. `new (ptr) Monster(existing_monster)` 匹配到了 `Monster(const Monster&)`（**拷贝构造**）。
   
3. **当你传递一个 `std::move` 后的对象时**：
   1. `args` 会被推导为 `Monster&&`。

   2. `std::forward` 将其转发为 `Monster&&`。

   3. `new (ptr) Monster(std::move(existing_monster))` 匹配到了 `Monster(Monster&&)`（**移动构造**）。


**结论：** `emplace` 本身不实现构造逻辑，它只是一个中介，负责把已经分配好的**内存地址**和**经过完美转发的参数**塞给构造函数。

# 所有容器调用链

1. **`STL 容器`**（如 `vector`）

2. 调用 **`std::allocator<T>::allocate`**

3. 调用 **`::operator new(size_t)`**（这是一个全局函数）

4. 调用 **`malloc`** (在大多数 C++ 实现中，如 Glibc)

关于调用：

- **`allocator` 封装了 `::operator new`**：标准库的 `std::allocator` 默认实现确实是调用全局的 `::operator new` 来拿内存，而不是直接调 `malloc`。
- **`new` 运算符 vs `::operator new`**：
  - **`new T()` (new 表达式)**：做两件事——申请内存 + 调用构造函数。
  - **`::operator new(size)` (函数)**：只管申请原始内存。**`allocator` 调用的是这个。**

**总结：** `allocator` 的 `allocate` 相当于“只管批地”，它内部通过 `::operator new` 最终找到 `malloc` 要地。

# allocator

| **容器类型**           | **是否使用 Allocator** | **内存分配特征**                                       |
| ---------------------- | ---------------------- | ------------------------------------------------------ |
| `vector` / `deque`     | **是**                 | 单次申请大块连续或分段内存                             |
| `list` / `map` / `set` | **是**                 | **每次插入**一个节点都要调用一次 `allocate` (开销极大) |
| `unordered_map`        | **是**                 | 桶（Bucket）数组 + 节点链表分配                        |

# new的分类

 **A. new 表达式 (new operator)**

这是我们平时写代码最常用的：`Monster* p = new Monster("Orc");` 它是一个**高级抽象**，内部自动完成了三件事：

1. 调用 operator new：向系统“批地”（申请原始内存）。
2. 调用构造函数：在地上“建房”（初始化对象）。
3. 返回指针：交给你“房产证”。

**B. operator new (函数)**

它的原型通常是 `void* operator new(std::size_t size);` 它本质上是一个**内存分配函数**。

- 它**只负责分配合适大小的原始内存**，完全不知道也不在乎这块内存将来要存什么对象。
- 它的底层通常就是调用 `malloc`。
- **面试考点**：你可以**重载**全局或类内的 `operator new` 来实现自定义的内存分配逻辑（比如从对象池拿内存）。

**C. 定位 new (placement new)**

它的语法是 `new (ptr) T();` 它是 `new 表达式` 的一种**特殊形式**。

- 它不调用 `operator new` 去申请新内存，而是直接利用你传给它的 `ptr` 地址。
- 在**已有的、原始的**内存上触发构造函数。

# delete的分类

**A. delete 表达式 (delete operator)**

当你写 `delete p;` 时，它是最上层的指令。它会自动执行以下两步：

1. **调用析构函数**：通过 `p->~T()` 把对象里的资源（比如它持有的其他内存、文件句柄）释放掉。
2. **调用 operator delete**：将这块原始内存还给系统（开发商）。

**B. operator delete (函数)**

它的原型通常是 `void operator delete(void* ptr) noexcept;`

- **本质**：它是一个**内存释放函数**。
- **职责**：它只负责回收内存，不管内存里存的是什么。它底层通常调用的是 C 语言的 `free`。
- **对应**：它对应的是 `operator new`。

**C. 显式析构调用 (Explicit Destructor Call)**

如果你是用 `placement new` 在特定地址构造的对象，你**绝对不能**直接 `delete p;`。

- `delete p` 会尝试把这块内存还给堆，但如果这块内存是你在栈上模拟的，或者是 `vector` 内部的预留空间，直接还给堆会导致程序崩溃。
- **正确做法**：显式调用析构函数 `p->~T();`。这只“拆除房子”，不“归还土地”。
- **对应**：它对应的是 `placement new`。