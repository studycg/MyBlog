# 包含

**在一个类中，声明另一个类的对象作为成员**。

我们要写一个 `Student` 类，学生有“名字”和“分数”。

- 名字：用 `std::string` 类。
- 分数：用 `std::valarray<double>` 类（这是 C++ 专门处理数值数组的类，比 vector 轻量，适合数学运算）。

~~~c++
#include <string>
#include <valarray>

class Student {
private:
    std::string name;              // 包含一个 string 对象
    std::valarray<double> scores;  // 包含一个 valarray 对象
    // 这里的关系是：Student "Has-a" name, "Has-a" scores.
    
public:
    // 构造函数
    // ⚠️ 重点：这里必须用初始化列表！
    // 因为 string 和 valarray 都是类，必须在"出生"时初始化
    Student(const char* str, const double* pd, int n)
        : name(str), scores(pd, n) {}
        
    // ...
};
~~~

### 接口的屏蔽

这是包含的一个重要特征：**屏蔽细节**。

- `valarray` 有 `sum()`, `max()`, `min()` 等几十个方法。
- 但是在 `Student` 外部，你无法直接调用 `student.sum()`，除非你在 `Student` 类里手写一个 `average()` 函数去内部调用 `scores.sum()`。
- **好处**：你对外暴露的接口非常干净，只保留你想要的。

> 不过话说回来如果scores是个public的话应该还是可以调用的

# 私有继承

~~~c++
// 注意：默认继承就是 private，但为了清晰最好写出来
class Student : private std::string, private std::valarray<double> {
public:
    // Student 本身"就是"一个 string，也"就是"一个 valarray
    // 但这个关系对外界保密（private）
    
    Student(const char* str, const double* pd, int n)
        : std::string(str), std::valarray<double>(pd, n) {}
        
    double Average() const {
        // 直接调用基类的函数，不需要 .scores
        if (size() > 0) 
            return sum() / size(); 
        else 
            return 0;
    }
};
~~~

这里的逻辑扭曲

在私有继承中：

- **对外**：`Student` **不是** `string`。你不能把 `Student*` 赋给 `string*` 指针。外界看不见基类的任何 `public` 方法。
- **对内**：`Student` 可以把 `string` 当作自己的老爸，随意访问其 `protected` 和 `public` 成员。

# 包含对比私有继承

既然都能实现 Has-a，为什么 C++ 要搞出两种方式？

**结论先行：绝大多数情况（99%）请使用“包含”。** “包含”逻辑清晰，耦合度低。

**那“私有继承”存在的意义是什么？（隐藏关卡）** 只有在以下两种极端情况下，你才被迫使用私有继承：

1. **你需要访问被包含类的 `protected` 成员**。
   - 包含方式：`obj.protected_member` ❌ (外部无法访问)。
   - 私有继承：可以直接访问基类的 `protected` 成员 ✅。
2. **你需要重写被包含类的 `virtual` 函数**。
   - 包含方式：没法重写成员对象的虚函数。
   - 私有继承：可以重写基类的虚函数，改变其行为 ✅。

# 多重继承

- 基类 A：`Singer` (歌手)，有一个 `Wait()` 方法等待伴奏。

- 基类 B：`Waiter` (服务员)，有一个 `Wait()` 方法等待顾客。

- 派生类：`SingingWaiter` (会唱歌的服务员)。

~~~c++
class SingingWaiter : public Singer, public Waiter {
    // ...
};
~~~

**关于二义性问题**

如果我调用 `newWorker.Wait()`，编译器会疯掉： “你是指作为歌手去等待伴奏？还是作为服务员去等待顾客？” **解决**：必须显式指定 `newWorker.Singer::Wait()`。

**关于钻石继承(Diamond Inheritance)**

祖父类：`Worker` (也就是 `Singer` 和 `Waiter` 都继承自 `Worker`)

父类 A：`Singer` : public `Worker`

父类 B：`Waiter` : public `Worker`

孙子类：`SingingWaiter` : public `Singer`, public `Waiter`

`SingingWaiter` 里有几份 `Worker` 的数据？

- `Singer` 带来了一份 `Worker` (名字、ID)。
- `Waiter` 又带来了一份 `Worker` (名字、ID)。
- **结果**：`SingingWaiter` 有两个名字，两个 ID！这在逻辑上是错误的。

# 虚基类

为了让 `Worker` 在孙子类中只存在一份，我们需要在**父类继承祖父类**的时候，加上 `virtual` 关键字。

```c++
// 关键点：在中间层使用 virtual
class Singer : virtual public Worker { ... };
class Waiter : virtual public Worker { ... };

class SingingWaiter : public Singer, public Waiter { ... };
```

**原理**： `virtual` 告诉编译器：“如果后续有别的类也继承 `Worker` 并和汇合，请大家**共享**同一个 `Worker` 副本，不要搞出多份来。”

## 虚基类指针

一句话概括：**普通继承是“拷贝”，而虚继承是“引用”。**

普通继承

~~~c++
class Worker { public: int id; };
class Singer : public Worker { ... }; // 继承了一个 Worker
class Waiter : public Worker { ... }; // 继承了一个 Worker
class SingingWaiter : public Singer, public Waiter { ... };
~~~

内存：

~~~c++
[ SingingWaiter 对象内存 ]
+-------------------------+
| [ Singer 部分 ]         |
|   +-----------------+   |
|   | Worker (id: 100)|   | <--- 第一份数据
|   +-----------------+   |
|   ... Singer 独有数据    |
+-------------------------+
| [ Waiter 部分 ]         |
|   +-----------------+   |
|   | Worker (id: 200)|   | <--- 第二份数据 (冗余！)
|   +-----------------+   |
|   ... Waiter 独有数据    |
+-------------------------+
~~~

虚继承

~~~c++
[ SingingWaiter 对象内存 ]
+----------------------------+
| [ Singer 部分 ]            |
|   | vbptr (虚基类指针) | -----> 指向底部的 Shared Worker
|   ... Singer 独有数据       |
+----------------------------+
| [ Waiter 部分 ]            |
|   | vbptr (虚基类指针) | -----> 指向底部的 Shared Worker
|   ... Waiter 独有数据       |
+----------------------------+
|                            |
| [ Shared Worker (共享区) ]  | <--- 只有唯的一份！
|   | id: 100              | |
|                            |
+----------------------------+
~~~

**独立存放**：`Worker` 的数据不再属于 `Singer` 或 `Waiter` 的私有领地，而是被提取出来，放在了对象内存的最底端（公共区域）。

**vbptr (Virtual Base Pointer)**：`Singer` 和 `Waiter` 内部不再存储 `Worker` 的数据，而是各存储了一个指针（或偏移量表），指向那个公共的 `Worker`。

**合并**：当 `SingingWaiter` 构造时，编译器发现 `Singer` 和 `Waiter` 都要求虚继承 `Worker`，于是它只在最后分配**一块** `Worker` 的空间，并让两个指针都指向它。

### 代价

#### 代价 A：访问速度变慢

- **普通继承**：访问 `id` 只需要简单的地址加法（基地址 + 偏移量），非常快。
- **虚继承**：访问 `id` 需要“间接寻址”。先读 `vbptr`，查表找到 `Worker` 在哪，再跳过去读取。多了一次跳转，CPU 流水线可能会被打断。

#### 代价 B：构造函数的噩梦

这就引出了一个面试必考题：**谁负责初始化那个共享的 `Worker`？**

- 如果是普通继承，`Singer` 负责构造它的 `Worker`，`Waiter` 负责构造它的 `Worker`，井水不犯河水。
- 现在 `Worker` 只有一份了，是 `Singer` 初始化它？还是 `Waiter` 初始化它？如果两个给的参数不一样怎么办？

## 最派生类

当创建 `SingingWaiter` 时，编译器会**忽略** `Singer` 和 `Waiter` 构造函数中对 `Worker` 的初始化请求。你必须在 **`SingingWaiter` 的初始化列表** 中显式调用 `Worker` 的构造函数！
~~~c++
// SingingWaiter 的构造函数
SingingWaiter(...) 
    : Worker(id),  // 必须由孙子直接越级初始化爷爷！
      Singer(...), 
      Waiter(...) 
{ ... }
~~~

虚基类解决 Diamond 问题的核心在于：**改变了内存模型**。 它把 **“包含”** 变成了 **“指向”**，从而实现了数据的**共享**。

# 类模板

**痛点：重复造轮子**

假设你要写一个 **栈 (Stack)** 数据结构。

- 今天你需要存 `int`，你写了一个 `IntStack`。
- 明天你需要存 `double`，你又复制粘贴代码，改成了 `DoubleStack`。
- 后天你需要存 `Hero` 对象，你又得写一个 `HeroStack`。

这太蠢了。既然逻辑都是“先进后出”，为什么不能写一份**蓝图**，把“存什么类型”留给以后决定呢？

所以此处使用了关键**`template`**

**定义**

~~~c++
// Stack.h
// template <class T> // 老式写法
template <typename T> // 现代写法，语义更清晰：T 是一个类型名称
class Stack {
private:
    T items[10]; // 用 T 代表具体的类型
    int top;
public:
    Stack() : top(0) {}
    
    bool push(const T& item) {
        if (top < 10) {
            items[top++] = item;
            return true;
        }
        return false;
    }

    bool pop(T& item) { // 这里的 item 是引用，用于返回弹出的值
        if (top > 0) {
            item = items[--top];
            return true;
        }
        return false;
    }
};
~~~

**实例化**

~~~c++
int main() {
    Stack<int> intStack;       // 编译器把 T 替换为 int，生成代码
    Stack<std::string> strStack; // 编译器把 T 替换为 string，生成代码
    
    intStack.push(10);
    strStack.push("Hello");
}
~~~

**原理**

编译器其实是在**编译期间**，悄悄帮你写了两份完全不同的类代码：`Stack_int` 和 `Stack_string`。

- 如果你只定义了模板但没用它，编译器**一行代码都不会生成**。
- 如果你用了 10 种不同的类型，编译器就会生成 10 份代码。

## 非“类”型参数

这是模板的一个神奇特性。模板参数不仅可以是**类型 (`typename T`)**，还可以是**整数 (`int n`)**。

~~~c++
// n 是一个编译期常量
template <typename T, int n> 
class Array {
private:
    T items[n]; // ✅ 可以在编译期确定数组大小，分配在栈上！
public:
    // ...
};

int main() {
    Array<double, 100> arr1; // 这是一个类
    Array<double, 20> arr2;  // 这是另一个完全不同的类！
    
    // arr1 = arr2; ❌ 编译报错，类型不同
}
~~~

相比于使用 `new` 动态分配（堆内存），这种利用非类型参数的数组分配在**栈内存**上，速度极快（这正是 `std::array` 的原理）。

## 模板具体化

~~~c++
template <typename T>
class Comparator {
public:
    bool isEqual(T a, T b) { return a == b; }
};
~~~

如果是 `char*` (C 风格字符串)，`a == b` 比较的是**指针地址**，而不是字符串内容！这就不对了。

解决方案：**具体化**我们需要告诉编译器：“如果是 `char*` 类型，请不要用通用模板，用我手写的这个特殊版本。”

~~~c++
// 语法：template<> 开头，类名后面跟 <char*>
template <> 
class Comparator<char*> {
public:
    bool isEqual(char* a, char* b) {
        return std::strcmp(a, b) == 0; // 针对 char* 的特殊逻辑
    }
};
~~~

**类模板的声明和定义必须写在同一个头文件(.h)里**，不要把声明写在 `.h`，定义写在 `.cpp`。

模板不是代码，它是蓝图。

当你在 `main.cpp` 里写 `Stack<int>` 时，编译器需要立即看到所有函数的源代码，以便把 `T` 替换成 `int` 并生成真正的函数。

如果定义写在 `Stack.cpp` 里，编译器在编译 `main.cpp` 时看不到 `Stack.cpp` 里的内容（单独编译），导致无法生成代码。链接器最后会报 `undefined reference` 错误。

## 模板别名

~~~c++
template <typename T>
using Duo = std::pair<T, T>; // 定义一个无论如何两个类型都一样的 pair

Duo<int> coordinates; // 相当于 std::pair<int, int>
~~~
