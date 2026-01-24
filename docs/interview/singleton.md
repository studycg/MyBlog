# 饿汉模式

它就像一个饿极了的人，等不到下指令（调用 `getInstance`），在程序刚启动、还没进入 `main` 函数之前，它就已经把实例创建好了。

~~~c++
#include <iostream>

class Singleton {
public:
    // 3. 提供全局访问点
    static Singleton& getInstance() {
        return instance;
    }

    void doSomething() {
        std::cout << "饿汉实例正在工作..." << std::endl;
    }

    // 禁用拷贝构造和赋值操作（防止通过拷贝产生第二个实例）
    Singleton(const Singleton&) = delete;
    Singleton& operator=(const Singleton&) = delete;

private:
    // 1. 私有化构造函数
    Singleton() {
        std::cout << "饿汉实例被创建了！" << std::endl;
    }

    // 2. 静态私有实例（在程序启动时就初始化）
    static Singleton instance;
};

// 在类外初始化静态成员变量（关键点：这发生在 main 函数执行之前）
Singleton Singleton::instance;

int main() {
    std::cout << "程序进入 main 函数..." << std::endl;
    
    // 直接获取已经存在的实例
    Singleton& s1 = Singleton::getInstance();
    s1.doSomething();

    return 0;
}
~~~

## 线程安全

**饿汉模式天生就是线程安全的。**

因为在 C++ 规范中，**全局变量和静态变量的初始化是在程序启动阶段完成的**。也就是说，当你的 `main` 函数开始运行，甚至你的多线程代码还没跑起来时，这个唯一实例就已经躺在内存里了。后续所有的线程访问 `getInstance()`，都只是在读取这个已经存在的变量，不涉及创建过程，因此不存在竞态条件。

## 优缺点

优点

1. **实现简单：** 逻辑清晰，不需要加锁（Mutex）。
2. **执行效率高：** 因为实例已经提前建好，获取实例时没有判断逻辑，性能极佳。
3. **线程安全：** 无需担心多线程环境下的初始化冲突。

缺点

1. **资源浪费（主要缺点）：** 如果这个类非常“重”（占用大量内存或初始化很慢），而你的程序在本次运行中**根本没用到它**，它依然会占用资源。这不符合 C++ “不为不使用的东西付费”的哲学。
2. **初始化顺序问题（Static Initialization Order Fiasco）：** 如果你有两个不同的饿汉单例 A 和 B，且 B 的初始化依赖于 A，C++ 标准并不能严格保证不同编译单元（.cpp 文件）之间全局变量的初始化顺序。这可能导致“在 A 还没创建时 B 就尝试去访问它”的崩溃风险。

## 定义与声明

类内：声明

当你写下 `static Singleton instance;` 时，你只是在告诉编译器：“在 `Singleton` 这个类里，有一个叫 `instance` 的静态变量，它的类型是 `Singleton`。” **此时，编译器并没有为它分配任何内存空间。** 它就像是一张名片，上面写着名字，但人还没到场。

类外：定义与初始化

当你写下 `Singleton Singleton::instance;` 时，你是在告诉编译器：“现在，请在程序的**全局/静态存储区**里，为 `Singleton::instance` 真正分配一块内存空间。” **只有这一行代码写了，这个变量才真正存在。**

**如果不屑`Singleton Singleton::instance`**会遇到连接错误

> error LNK2001: unresolved external symbol "private: static class Singleton Singleton::instance"

**编译阶段：** 没问题。编译器看到类内有声明，觉得“以后肯定会有这个变量”。

**链接阶段：** 报错。链接器去寻找这块内存地址时，发现根本没有人定义（分配）它，于是它就“失联”了。

## 不能再main中初始化

静态变量必须在**全局作用域**（或者命名空间作用域）进行定义。如果你尝试在 `main` 函数内部写 `Singleton Singleton::instance;`，编译器会报错，因为它不符合 C++ 的语法规范——静态成员变量不属于任何一个函数，它属于类本身。

## inline static

~~~c++
class Singleton {
private:
    // C++17 支持内联静态变量，这样就不需要在类外单独定义了
    inline static Singleton instance; 

    Singleton() {} 
public:
    static Singleton& getInstance() { return instance; }
};
~~~

本来：

编译器在处理每一个 `.cpp` 文件时都是孤立的。 如果在一个头文件里写了定义，编译器在编译 `A.cpp` 时会生成一份 `instance` 的内存，编译 `B.cpp` 时又会生成一份。最后链接时，链接器会发现有两个同名的变量，于是报错 `redefinition`（重复定义）。

但是用了inline的话：
如果在多个 `.cpp` 里看到了这个 `inline static Singleton instance`，在链接时会把它们合并成一个地址。

## 其它

`inline static Singleton instance;` 是否调用了无参构造？

**是的。** 在 C++ 中，`Type var;` 这种写法如果没有提供显式的初始化参数，编译器会自动调用该类型的**默认构造函数**。

- 如果你的 `Singleton` 类中没有定义任何构造函数，编译器会生成一个默认的。
- 如果你显式定义了 `Singleton() { ... }`，它就会被调用。
- **注意：** 如果你定义了带参数的构造函数 `Singleton(int x)`，且**没有**定义无参构造函数，那么 `inline static Singleton instance;` 会直接报错，因为编译器找不到匹配的构造函数来“实例化”它。

如果这个构造函数是个带参数的，那么：

~~~c++
class Singleton {
public:
    static Singleton& getInstance() { return instance; }
private:
    Singleton(int x) { /* 初始化逻辑 */ }
    
    // 在这里直接提供参数，完成“声明+定义+初始化”
    inline static Singleton instance{5}; 
};
~~~

| **写法**                               | **是否合法**     | **备注**                                            |
| -------------------------------------- | ---------------- | --------------------------------------------------- |
| `static int x = 5;`                    | **报错**         | 非 const 静态变量不能在类内初始化。                 |
| `static const int x = 5;`              | **合法**         | 仅限基本整型常量（编译器优化为字面量）。            |
| `static Singleton instance(5);`        | **报错**         | 理由同第一条，且这是复杂对象。                      |
| `inline static Singleton instance(5);` | **合法 (C++17)** | `inline` 告诉链接器：这些重复的初始化最终合并为一。 |

# 懒汉模式

## 非线程安全

~~~c++
class LazySingleton {
public:
    static LazySingleton* getInstance(int x) {
        if (instance == nullptr) { // 检查点
            // 如果线程 A 执行到这里，还没来得及 new，线程 B 也进来了
            instance = new LazySingleton(x);
        }
        return instance;
    }

private:
    static LazySingleton* instance;
    int data;

    LazySingleton(int x) : data(x) {}
    
    // 必须要禁用的：
    LazySingleton(const LazySingleton&) = delete;
    LazySingleton& operator=(const LazySingleton&) = delete;
};

// 类外初始化指针
LazySingleton* LazySingleton::instance = nullptr;
~~~

**Thread A** 到达 `if (instance == nullptr)`，判断为真，准备进入执行 `new`。

就在这时，**操作系统进行了上下文切换**，Thread A 暂停，Thread B 开始运行。

**Thread B** 也到达 `if (instance == nullptr)`，因为 Thread A 还没 `new` 完，指针还是 `nullptr`，所以 Thread B 也判断为真，进入执行 `new`。

**结果：** 内存中创建了两个对象，`instance` 指针最后指向了 Thread B 创建的那个，Thread A 创建的那个成了**内存泄漏**，且“单例”原则被彻底破坏。

加个锁不就行了？

~~~c++
static LazySingleton* getInstance(int x) {
    std::lock_guard<std::mutex> lock(my_mutex); // 每次进来都加锁
    if (instance == nullptr) {
        instance = new LazySingleton(x);
    }
    return instance;
}
~~~

NO！

一旦单例被创建好了，`instance` 就永远不再是 `nullptr` 了。这意味着，后续成千上万次的调用，其实只需要“读”一下指针就行了。而我们现在的写法，**每次读取都要进行昂贵的加锁/解锁操作**。

那么如何解决呢？

**双重检查锁DCLP**

# DCLP

每次调用 `getInstance()` 都要加锁，性能太差了。 **优化思路：** 如果指针不为空（说明已经创建好了），直接返回，不加锁；只有当指针为空时，才加锁去创建。

~~~c++
static LazySingleton* getInstance(int x) {
    if (instance == nullptr) {               // 第一次检查
        std::lock_guard<std::mutex> lock(m_mutex); 
        if (instance == nullptr) {           // 第二次检查
            instance = new LazySingleton(x);
        }
    }
    return instance;
}
~~~

**第一次检查：** 为了避开已经初始化后的加锁操作，提高效率。

**第二次检查：** 关键所在！假设 A 和 B 同时通过了第一次检查，A 抢到了锁开始创建，B 在锁外等待。等 A 创建完释放锁后，B 进入锁内。如果没有第二次检查，B 就会再次 `new` 一个对象。

## 指令重排会使DCLP不安全

`instance = new LazySingleton(x);` 时，底层其实发生了三件事：

1. **分配内存**：分配一块足以容纳 `LazySingleton` 的内存空间。
2. **调用构造函数**：在那块内存上构造对象。
3. **赋值指针**：将 `instance` 指针指向那块内存。

**问题来了：** 编译器为了优化性能，可能会把顺序改成 **1 -> 3 -> 2**。

- 如果线程 A 执行完了 1 和 3，此时指针 `instance` 已经不是 `nullptr` 了，但 **2（构造函数）还没执行完**。
- 就在这时，线程 B 进来了，它执行第一次检查 `if (instance == nullptr)`，发现不为空，于是直接返回了 `instance`。
- 线程 B 拿着这个“半成品”对象去使用，程序直接崩溃。

那么怎么解决呢？用梅耶单例

# Mayer单例

~~~c++
static Singleton& getInstance(int x) {
    // C++11 保证：如果多个线程同时尝试初始化同一个局部静态变量，
    // 只有一个线程会执行初始化，其他线程会阻塞等待。
    static Singleton instance(x); 
    return instance;
}
~~~

~~~c++
class Singleton {
public:
    static Singleton& instance() {
        static Singleton instance;  // 梅耶单例核心
        return instance;
    }

    // 删除拷贝和赋值，防止产生多个实例
    Singleton(const Singleton&) = delete;
    Singleton& operator=(const Singleton&) = delete;

private:
    Singleton() {
        // 构造函数私有
    }

    ~Singleton() = default;
};

~~~

## 批评

**隐藏依赖：** 你在代码任何地方都能调单例，导致函数之间的关系变得模糊，不方便做单元测试。

**违背单一职责原则：** 单例类既要负责自己的业务逻辑，还要负责“管理自己的生命周期”。

**全局状态：** 全局变量是万恶之源，单例本质上就是一个披着羊皮的全局变量。