# 互斥锁

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

但是由于数据竞争的原因没加到预期

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

## 死锁

虽然 `lock()` 和 `unlock()` 很好理解，但在实际开发中手动调用它们是**极其危险**的。

**风险场景：** 如果临界区代码抛出了异常，或者你写了个 `return` 语句忘了调 `unlock()`，那么这把锁就永远不会被释放。结果就是：**死锁 (Deadlock)**，其他线程永远进不去。

C++11 提供了 **`std::lock_guard`**，它采用了 **RAII (资源获取即初始化)** 机制。

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

不需要手动解锁，无论是函数执行完、遇到 `return` 还是抛出异常，锁都会被自动安全释放。

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

# 死锁管理

`std::lock_guard` 太“死板”了：它在构造时必须加锁，析构时才解锁，中间你没法手动控制。

## `std::unique_lock`

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

## `std::lock`和`std::scoped_lock`

死锁的四个条件：

1. 互斥
2. 占有且等待
3. 不可剥夺
4. 循环等待

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

### 原理

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



