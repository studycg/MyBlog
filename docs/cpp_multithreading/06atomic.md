# 原子操作

在写count++时底层发生了：

**Load（取值）**：把变量从**内存**读到 CPU **寄存器**。

**Modify（修改）**：在寄存器中执行 `+1` 操作。

**Store（写回）**：把寄存器里的新值写回**内存**。

| **特性**       | **普通变量 int** | **原子变量 std::atomic**         |
| -------------- | ---------------- | -------------------------------- |
| **自增 `i++`** | 非原子（三步走） | **原子操作**（硬件保证一步到位） |
| **线程安全**   | 不安全，需加锁   | **原生线程安全**                 |
| **性能开销**   | 极小             | 略高于普通变量，但远低于 `mutex` |

**原子操作**意味着这个操作一旦开始，就一定执行完，中间**不会被任何其他线程中断**。

| 原子类型名称    | 对应的内置类型名称 |
| --------------- | ------------------ |
| atomic_bool     | bool               |
| atomic_char     | char               |
| atomic_schar    | signed char        |
| atomic_uchar    | unsigned char      |
| atomic_int      | int                |
| atomic_uint     | unsigned int       |
| atomic_short    | short              |
| atomic_ushort   | unsigned short     |
| atomic_long     | long               |
| atomic_ulong    | unsigned long      |
| atomic_llong    | long long          |
| atomic_ullong   | unsigned long long |
| atomic_char16_t | char16_t           |
| atomic_char32_t | char32_t           |
| atomic_wchar_t  | wchar_tX`          |

**注意：** 需要用大括号对原子类型的变量进行初始化。

程序员不需要对原子类型进行加锁解锁操作，线程能够对原子类型变量互斥访问。

**也可以使用原子操作模板类定义出任意原子类型，如下例**

~~~c++
#include <iostream>
#include <thread>
#include <atomic>
#include <vector>

// 使用原子类型的全局变量
std::atomic<int> count(0); 

void increase() {
    for (int i = 0; i < 100000; ++i) {
        // 这里的 ++ 已经是原子操作了，不需要加锁！
        count++; 
    }
}

int main() {
    std::thread t1(increase);
    std::thread t2(increase);
    t1.join();
    t2.join();

    // 结果永远是精准的 200000
    std::cout << "最终计数: " << count << std::endl;
    return 0;
}
~~~

- 原子类型通常属于“资源类型”数据，多个线程只能访问单个原子类型的拷贝，因此在C++11中，原子类型只能从其模板参数中进行构造，不允许原子类型进行拷贝构造、移动构造以及operator=等
- 为了防止意外，标准库已经将atomic模板类中的拷贝构造、移动构造、operator=默认删除掉了
- 原子类型不仅仅支持原子的++操作，还支持原子的--、加一个值、减一个值、与、或、异或操作



## CAS指令

原子操作的底层依赖于硬件支持的 **CAS 指令（比较并交换）**

~~~c++
bool CAS(内存地址, 旧的预期值, 新值) {
    if (内存地址里的值 == 旧的预期值) {
        内存地址里的值 = 新值;
        return true; // 成功
    }
    return false; // 失败（说明被别人改过了）
}
~~~

当 `std::atomic<int>` 执行 `++` 时，它内部其实是在跑一个**极其快速的循环**：

1. 读取当前的 `count` 值为 10。
2. 计算新值应该是 11。
3. 调用 CPU 的 **CAS 指令**：如果 `count` 还是 10，就把它改成 11。
4. 如果 CAS 返回失败（说明在这一瞬间被别人改成了 11），那就重新读取新值，再试一次。

## 互斥锁和原子操作

既然原子操作这么快，还要锁干什么？

- **原子操作**：只能保护**单个变量**（int, bool, 指针等）。如果你要保护一段复杂的逻辑（比如从队列取数据 -> 处理数据 -> 发送邮件），原子变量就无能为力了。
- **互斥锁**：可以保护**任意大小的代码块**。

**总结**：原子操作是多线程编程中的“手术刀”，精准高效；锁是“防盗门”，厚重安全。

```c++
if (done->exchange(true) == false)
```

1. `done` 是一个 `std::atomic<bool>`。
2. `exchange(true)` 是原子的：它会把 `true` 存进去，并**返回旧的值**。

# 内存序

## 内存序背景

**指令重排**：为了提高效率，编译器和 CPU 会在不改变**单线程**运行结果的前提下，偷偷调整代码的执行顺序。但在多线程环境下，这种“自作聪明”会导致灾难。

~~~c++
// 线程 A
std::atomic<bool> ready(false);
int data = 0;

void producer() {
    data = 42;               // 操作 1
    ready.store(true);       // 操作 2
}

// 线程 B
void consumer() {
    while (!ready.load());   // 操作 3
    std::cout << data;       // 操作 4
}
~~~

在理论上：操作 1 应该在操作 2 之前。

在现实中：CPU 可能会觉得操作 1 和操作 2 没关系，先跑操作 2。如果线程 B 在这时候正好跑了操作 3，它会看到 ready 是 true，结果打印出的 data 却是 $0$。

这就是为什么我们需要**内存序**：它不仅要求操作是原子的，还要求操作发生的**顺序**是有保障的。

**再举一个内存序的例子**

```c++
Singleton* Singleton::getInstance() {
    if (m_instance == nullptr) {           // 第一次检查
        std::lock_guard<std::mutex> lock(m_mutex);
        if (m_instance == nullptr) {       // 第二次检查
            m_instance = new Singleton();  // 关键：致命的 Bug 发生在这里！
        }
    }
    return m_instance;
}
```

这是单例模式中，**双重检查锁定的失效**。

但是上面的代码实际上存在一些问题：对于m_instance = new Singleton()这一行。在编译器眼中，这行代码其实由三个步骤组成：

1. **分配内存**：分配足够存放 Singleton 对象的内存
2. **调用构造函数**：在那块内存上初始化对象
3. **赋值指针**：将 m_instance 指向那块内存

假设有两个线程 A 和 B：

1. **线程 A** 执行到了重排后的步骤 3（指针赋值完成），但步骤 2（构造函数）还没跑完。
2. 此时 **线程 B** 调用 getInstance()，它执行到第一次检查 if (m_instance == nullptr)
3. 由于线程 A 已经完成了步骤 3，m_instance 不为 nullptr
4. **线程 B 直接返回了 m_instance 并开始使用它**
5. **结果**：线程 B 正在使用一个**根本没初始化完成**的“半成品”对象，程序随即崩溃。

**此时就需要使用内存屏障**

为了修复这个 Bug，我们需要确保“赋值指针”的操作绝对不能被重排到“构造函数完成”之前。

```c++
std::atomic<Singleton*> Singleton::m_instance;

Singleton* Singleton::getInstance() {
    Singleton* tmp = m_instance.load(std::memory_order_acquire); // 获取屏障
    if (tmp == nullptr) {
        std::lock_guard<std::mutex> lock(m_mutex);
        tmp = m_instance.load(std::memory_order_relaxed);
        if (tmp == nullptr) {
            tmp = new Singleton();
            // 释放屏障：确保上面的 new（构造函数）完成后，才执行 store
            m_instance.store(tmp, std::memory_order_release);
        }
    }
    return tmp;
}
```

- **release 屏障**：保证了构造函数的“写”操作，一定在 m_instance 写入之前完成
- **acquire 屏障**：保证了后续对单例对象成员的“读”操作，一定在 load 成功之后开始（如果不是这样子，可能程序会先执行tmp == nullptr，导致异常错误）

**为什么要内存屏障？** 因为没有它，你的代码顺序在多核 CPU 面前只是“建议”，不是“命令”

## 几种内存屏障

**`memory_order_relaxed` (最松散)**

- **含义**：只保证原子性，不保证任何顺序。
- **场景**：计数器（比如网页访问量），我不关心是谁先加谁后加，只要最后加对了就行。

**`memory_order_seq_cst` (最严格 - 默认值)**

- **含义**：**顺序一致性**。所有线程看到的执行顺序都是一模一样的。
- **代价**：性能最差，因为它会强迫 CPU 频繁同步缓存（Cache Invalidation）。

**`memory_order_acquire` & `memory_order_release` (最经典：获取-释放语义)**

这是你最需要掌握的，它就像是两个线程之间的**“接力棒”**。

## 获取-释放语义

**`release` (用于 store)**：保证在此之前的所有写操作，都不能被重排到它后面。

**`acquire` (用于 load)**：保证在此之后的所有读操作，都不能被重排到它前面

~~~c++
// 线程 A
void producer() {
    data = 42;
    // 释放：确保 data = 42 已经写入内存，且不会被重排到后面
    ready.store(true, std::memory_order_release); 
}

// 线程 B
void consumer() {
    // 获取：确保看到 ready 为 true 后，后面的读操作能看到 A 在 release 之前做的所有修改
    while (!ready.load(std::memory_order_acquire)); 
    std::cout << data; // 此时 data 保证是 42
}
~~~

**通俗理解**：`release` 像是在发出一封带印章的信，`acquire` 像是拆开信封。一旦你拆开了信封（获取成功），你就一定能看到写信人寄信前写下的所有内容。

# 例子

场景：你有两个变量 x 和 y，初始值都是 $0$。

- 线程 1 执行：`x.store(1); y.store(1);`
- 线程 2 执行：`if (y.load() == 1) { assert(x.load() == 1); }`

情况A：但 CPU 观察到 `x` 和 `y` 是两个独立的内存地址，互不影响。为了压榨流水线性能，CPU 可能会先送出 `y` 的写指令，再送出 `x` 的写指令。 **结果**：线程 2 看到 `y` 变 1 了，但 `x` 还是 0。

情况B：即使 CPU 没有乱序（按顺序发出了指令），在多核架构下，每个核心都有自己的 **L1/L2 Cache**。

- 线程 1 在核心 A 上跑，它把 `x=1` 写到了核心 A 的缓存里，还没来得及刷到主内存。
- 接着它把 `y=1` 刷到了主内存。
- 线程 2 在核心 B 上跑，它从主内存读到了 `y=1`，但去读 `x` 时，它读到的是主内存里的旧值 0，因为核心 A 还没把 `x=1` 共享出来。

如果这样写

~~~c++
// 线程 1 (Producer)
x.store(1, std::memory_order_relaxed); // x 可以放松
y.store(1, std::memory_order_release); // 关键：y 的写入带了“释放”屏障

// 线程 2 (Consumer)
if (y.load(std::memory_order_acquire) == 1) { // 关键：y 的读取带了“获取”屏障
    assert(x.load(std::memory_order_relaxed) == 1); // 此时 x 必定为 1
}
~~~

**`release` 屏障** 保证了：它之前的所有写操作（`x=1`），必须在 `y=1` 变得可见之前，全部刷入内存。

**`acquire` 屏障** 保证了：只要我看到了 `y=1`，那么在 `y=1` 之前发生的所有写操作（`x=1`），对我来说必须是立即可见的。