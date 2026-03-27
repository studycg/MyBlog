> [!NOTE]
>
> 线程同步

多线程最头疼的是竞态条件，C++提供了：

1. 互斥锁
2. 信号量
3. 条件变量
4. 原子操作

下面的情况因为多线程的原因，与预期结果不同：

~~~c++
#include <iostream>
#include <thread>
#include <vector>

int balance = 0; // 全局账户余额

void deposit(int amount) {
    for (int i = 0; i < 100000; ++i) {
        balance += amount; 
    }
}

int main() {
    std::thread t1(deposit, 1);
    std::thread t2(deposit, 1);

    t1.join();
    t2.join();

    std::cout << "预计余额: 200000" << std::endl;
    std::cout << "实际余额: " << balance << std::endl;
    return 0;
}
~~~

在CPU层面分为三个指令

**Load**: 将内存中的 `balance` 加载到寄存器。

**Add**: 在寄存器中执行加法。

**Store**: 将寄存器中的新值写回内存。

但是由于数据竞争的原因没加到预期。

# 互斥锁

1. **互斥性**：同一时刻，只有一个线程 / 进程能持有锁，其他请求锁的线程会被阻塞（等待）
2. **唯一性**：锁被某个线程持有后，必须由该线程释放，不能被其他线程释放（避免死锁）
3. **原子性**：加锁 / 解锁操作是 “不可分割” 的，不会被中断，保证操作的完整性

## std::mutex

~~~c++
#include <mutex>

int balance = 0;
std::mutex mtx; // 创建一把锁

void deposit(int amount) {
    for (int i = 0; i < 100000; ++i) {
        mtx.lock();   // 上锁
        balance += amount; 
        mtx.unlock(); // 解锁
    }
}
~~~

被锁保护的代码块被称为**临界区**

1. mutex锁是C++11提供的最基本的互斥量

2. mutex对象之间不能进行拷贝，也不能进行移动

3. mutex中常用的成员函数如下：

   | 成员函数 | 功能                                 |
   | -------- | ------------------------------------ |
   | lock     | 对互斥量进行加锁                     |
   | try_lock | 尝试对互斥量进行加锁                 |
   | unlock   | 对互斥量进行解锁，释放互斥量的所有权 |

线程函数调用lock时(阻塞方法)，可能会发生以下三种情况：

- 如果该互斥量当前没有被其他线程锁住，则调用线程将该互斥量锁住，直到调用unlock之前，该线程一直拥有该锁
- 如果该互斥量已经被其他线程锁住，则当前的调用线程会被阻塞
- 如果该互斥量被当前调用线程锁住，则会产生死锁（deadlock）

线程调用try_lock时(非阻塞方法)，类似也可能会发生以下三种情况：

- 如果该互斥量当前没有被其他线程锁住，则线程获取锁，函数返回true
- 如果该互斥量已经被其他线程锁住，则try_lock调用返回false，当前的调用线程不会被阻塞，此时可以执行其他任务
- 如果该互斥量被当前调用线程锁住，则会产生死锁（deadlock）

```c++
void try_read_task() {
    // 尝试获取锁，成功返回 true，失败返回 false (立即返回，不阻塞)
    if (rw_mutex_.try_lock()) {
        std::cout << "读取数据成功: " << value_ << "\n";
        rw_mutex_.unlock(); // 别忘了释放！
    } else {
        std::cout << "锁正忙，我先去处理其他逻辑...\n";
    }
}
```

当线程被mutex的lock阻塞后，会挂入操作系统的阻塞队列，只有当mutex进行unlock操作之后，操作系统才会从阻塞队列中选取一个线程恢复就绪态(FIFO)

## 阻塞方法和非阻塞方法

| 类型       | 核心特征                                                     |
| ---------- | ------------------------------------------------------------ |
| 非阻塞方法 | 调用后立即返回结果，无论操作是否成功，线程不会放弃 CPU 执行权（不会休眠） |
| 阻塞方法   | 调用后若操作无法立即完成，线程会放弃 CPU 执行权（休眠 / 挂起），直到条件满足或超时 |

所以lock()是阻塞方法而try_lock()为非阻塞方法

# 死锁

虽然 `lock()` 和 `unlock()` 很好理解，但在实际开发中手动调用它们是**极其危险**的。

**风险场景：** 如果临界区代码抛出了异常，或者你写了个 `return` 语句忘了调 `unlock()`，那么这把锁就永远不会被释放。结果就是：**死锁 (Deadlock)**，其他线程永远进不去。

使用互斥锁时如果控制不好就会造成死锁，最常见的就是此处在**锁中间代码返回**，还有一个比较常见的情况就是在**锁的范围内抛异常**，也很容易导致死锁问题。

## `std::lock_guard`(RAII预防死锁)

C++11 提供了 **`std::lock_guard`**，它采用了 **RAII (资源获取即初始化)** 机制。

它是一个模板类，定义大概如下：

```c++
template<class Mutex>
    class lock_guard {
        public:
        lock_guard(Mutex& mtx) :_mtx(mtx) {
            mtx.lock(); //加锁
        }

        ~lock_guard() {
            mtx.unlock(); //解锁
        }

        lock_guard(const lock_guard&) = delete;
        lock_guard& operator=(const lock_guard&) = delete;
        private:
        Mutex& _mtx;
    };
```

~~~c++
void deposit(int amount) {
    for (int i = 0; i < 100000; ++i) {
        // 在作用域开始时自动上锁
        std::lock_guard<std::mutex> lock(mtx); 
        balance += amount; 
        // 出了这个循环括号，lock 对象析构，自动释放锁
    } 
}
~~~

- 在需要加锁的地方，用互斥锁实例化一个lock_guard对象，在lock_guard的构造函数中会调用lock进行加锁
- 当lock_guard对象出作用域前会调用析构函数，在lock_guard的析构函数中会调用unlock自动解锁
- 从lock_guard对象定义到该对象析构，这段区域的代码都属于互斥锁的保护范围

不需要手动解锁，无论是函数执行完、遇到 `return` 还是抛出异常，锁都会被自动安全释放。

这样lock_guard同构析构函数自动解锁的方式有效的避免了死锁的问题。

```c++
mutex mtx;
void func() {
    lock_guard<mutex> lock(mtx); //调用构造函数加锁
    //...
    FILE* fout = fopen("data.txt", "r");
    if (fout == nullptr) {
        //...
        return; //调用析构函数解锁
    }
    //...
} //调用析构函数解锁

int main() {
    func();
    return 0;
}
```

如果想只用lock_guard保护某一段代码，可以通过定义匿名的局部域来控制lock_guard对象的生命周期。

```c++
mutex mtx;
void func() {
    //...
    //匿名局部域
    {
        lock_guard<mutex> lg(mtx); //调用构造函数加锁
        FILE* fout = fopen("data.txt", "r");
        if (fout == nullptr) {
            //...
            return; //调用析构函数解锁
        }
    } //调用析构函数解锁
    //...
}

int main() {
    func();
    return 0;
}
```

`std::lock_guard` 太“死板”了：它在构造时必须加锁，析构时才解锁，中间你没法手动控制。所以C++11又提供了`std::unique_lock`

## `std::unique_lock`

unique_lock类模板也是采用RAII的方式对锁进行了封装，在创建unique_lock对象调用构造函数时也会调用lock进行加锁，在unique_lock对象销毁调用析构函数时也会调用unlock进行解锁。

但lock_guard不同的是，unique_lock更加的灵活，提供了更多的成员函数：

- 加锁/解锁操作：lock、try_lock、try_lock_for、try_lock_until和unlock
- 修改操作：移动赋值、swap、release（返回它所管理的互斥量对象的指针，并释放所有权）
- 获取属性：owns_lock（返回当前对象是否上了锁）、operator bool（与owns_lock的功能相同）、mutex（返回当前unique_lock所管理的互斥量的指针）

同时也可以：

**延迟加锁**：你可以先创建锁对象，但在需要的时候再加锁。

**手动控制**：它提供了 `lock()` 和 `unlock()` 接口，让你在对象生命周期内自由控制。

**所有权转移**：它可以被 `std::move`，让锁在函数间传递。

**配合条件变量**：这是它最重要的用途（看之后）。

~~~c++
#include <iostream>
#include <thread>
#include <mutex>

std::mutex mtx;

void flexibleTask(int id) {
    // 1. 准备工作（不需要锁）
    std::cout << "线程 " << id << " 正在准备数据..." << std::endl;

    // 2. 创建 unique_lock，但使用 std::defer_lock 告诉它先不要上锁
    std::unique_lock<std::mutex> lock(mtx, std::defer_lock);

    // 3. 在需要的时候才上锁
    lock.lock(); 
    std::cout << "线程 " << id << " 进入了临界区！" << std::endl;
    // ... 执行敏感操作 ...
    
    // 4. 甚至可以手动提前解锁
    lock.unlock();
    std::cout << "线程 " << id << " 提前离开了临界区。" << std::endl;
}

int main() {
    std::thread t1(flexibleTask, 1);
    std::thread t2(flexibleTask, 2);
    t1.join();
    t2.join();
    return 0;
}
~~~

## `std::shared_lock`



## `std::lock`和`std::scoped_lock`

死锁的四个条件：

1. 互斥
2. 占有且等待
3. 不可剥夺
4. 循环等待

`std::scoped_lock`主要为了解决**多重死锁的问题**。

如：

线程A：锁住mutex1尝试锁mutex2

线程B：锁住mutex2尝试锁mutex1

`std::lock(m1, m2, ...)`，它能**一次性锁定多个互斥量**，并且内部算法保证了**不会产生死锁**

~~~c++
std::mutex mtx1, mtx2;

void threadA() {
    // 像这样一次性锁住两个，内部自动处理死锁逻辑
    std::scoped_lock lock(mtx1, mtx2); 
    std::cout << "线程 A 同时拿到了两把锁" << std::endl;
}

void threadB() {
    // 即使顺序写反了，scoped_lock 也会帮你处理
    std::scoped_lock lock(mtx2, mtx1); 
    std::cout << "线程 B 同时拿到了两把锁" << std::endl;
}
~~~

**锁的颗粒度**

**粗粒度锁**：一整块代码全锁住。安全但效率低（因为并发性变差了）。

**细粒度锁**：只锁住那几行必须保护的代码。效率高但容易写出 Bug 或死锁。

### scoped_lock原理

1. **全序枷锁**：底层库会对传入的每一个 `mutex` 对象进行地址排序（比如按照内存地址从小到大）。无论你在代码里写的顺序是 `(a, b)` 还是 `(b, a)`，底层始终坚持**先锁地址小的，再锁地址大的**。
2. **回退算法：**如果无法进行简单排序，底层会尝试如下逻辑：
   - 尝试锁定 `mutex_a`。
   - 尝试 `try_lock` 锁定 `mutex_b`。
   - 如果 `mutex_b` 锁定失败，它会立刻**释放已经持有的 `mutex_a`**，然后等待一小会儿重新开始。

1破坏了循环等待2破坏了占有且等待

`std::mutex::lock()` 调用时，操作系统发生了什么？”

这里涉及到一个高性能的关键点：**Futex (Fast Userspace Mutex)**。

1. **用户态尝试： 当一个线程尝试加锁时，它首先在**用户态**利用原子操作（Atomic Operation）检查锁的状态。如果锁是空的，直接修改状态并成功返回。**整个过程不经过内核**，性能极高。
2. **内核态挂起： 如果发现锁已经被占用了，线程就不能再在用户态“硬顶”了（否则会白白消耗 CPU）。此时它会执行一个系统调用（System Call），进入内核态。操作系统会将该线程的状态改为“阻塞”，并放入该锁的**等待队列**中，交出 CPU 给其他线程用。
3. **唤醒**： 当持有锁的线程释放锁时，操作系统会从等待队列中唤醒一个线程，将其状态改为“就绪”。















## 互斥锁又性能代价

**上下文切换开销**：线程在等待锁时会被挂起，切换线程需要保存寄存器状态等。

**串行化**：多线程原本是为了并行，加了锁之后，临界区代码实际上变成了“单线程”执行。

**黄金原则：尽量减小临界区的范围**。只锁住必须保护的那几行代码，处理完立即释放。

## 记录状态

一个 `std::mutex` 确实需要记录状态，但它的实现比简单的指针要稍微复杂一点，且根据锁的类型有所不同：

- **所有权记录**：普通的 `std::mutex` 在底层（如 Linux 的 `pthread_mutex_t`）确实会记录当前持有该锁的 **线程 ID (TID)**。

- **状态标志**：它内部通常有一个原子变量（Atomic Variable）作为标志位（0 为空闲，1 为锁定）。

- **等待队列**：如果锁被占用，其他尝试上锁的线程会被放入一个**等待队列**中，进入阻塞（Sleep）状态，由内核负责在锁释放时唤醒它们。

**延伸知识：递归锁 (`std::recursive_mutex`)** 普通的 `std::mutex` 是**不可重入**的。如果同一个线程对同一个 `std::mutex` 连续调用两次 `lock()`，它会把自己锁死（死锁）。 而 `std::recursive_mutex` 内部除了记录所有者线程 ID，还带有一个 **计数器**。同一个线程每 lock 一次，计数器加 1；每 unlock 一次，计数器减 1。只有计数器归零时，锁才真正释放。

| **408 操作系统概念**  | **C++ 对应的实现工具**                           |
| --------------------- | ------------------------------------------------ |
| **P/V 操作 (信号量)** | `std::counting_semaphore` (C++20)                |
| **临界区互斥**        | `std::mutex`, `std::lock_guard`                  |
| **管程 (Monitor)**    | C++ 类配合 `std::condition_variable`             |
| **死锁预防/避免**     | `std::lock` (一次锁定多个锁), `std::scoped_lock` |

# 原子操作库







# 信号量



