条件变量允许一个线程在某个条件未满足时进入睡眠状态，直到另一个线程通知它条件已经成熟。

如果说 `std::mutex` 是为了**竞争**，那么 `std::condition_variable` 就是为了**协作**

**`wait(lock, predicate)`**：让线程睡一会儿。它需要一个 `unique_lock` 和一个**返回布尔值的条件**（谓词）。

**`notify_one()`**：唤醒等待队列中的**一个**线程。

**`notify_all()`**：唤醒等待队列中的**所有**线程。

~~~c++
#include <condition_variable>
#include <mutex>
#include <thread>

std::mutex mtx;
std::condition_variable cv;
bool ready = false; // 全局状态

void worker_thread() {
    std::unique_lock<std::mutex> lock(mtx);
    // 只有当 ready 为 true 时才继续，否则释放锁并阻塞
    cv.wait(lock, []{ return ready; }); 
    
    // 被唤醒且 ready 为 true 后，重新持有锁，执行任务
    std::cout << "子线程开始工作..." << std::endl;
}

int main() {
    std::thread t(worker_thread);

    {
        std::lock_guard<std::mutex> lock(mtx);
        ready = true; // 修改状态
    }
    cv.notify_one(); // 发出通知

    t.join();
    return 0;
}
~~~

## 为什么wait必须传入unique_lock

调用 `wait` 之前手动上锁，而不把锁传给 `wait`，会发生什么？

1. 你拿着锁进入 `wait`。
2. 你阻塞了，但你**还拿着锁**。
3. 另一个线程（生产者）想改状态，发现拿不到锁，也卡住了。
4. **死锁**。

**`cv.wait(lock)` 的底层步骤：**

1. **释放锁**：将传入的锁释放，此时其他线程可以修改共享变量了。
2. **阻塞**：将当前线程挂起，放入等待队列。
3. **重新拿锁**：当被通知唤醒时，它会**先尝试重新获取锁**。只有拿到了锁，`wait` 才会返回，继续执行后面的代码。

> **底层逻辑**：第一步和第二步必须是**原子的**。如果在释放锁和进入阻塞之间发生了一个通知，而你还没睡着，这个通知就会永远丢失。这就是为什么 `wait` 必须接管 `unique_lock`。

## 虚假唤醒

线程有时候会在没有任何人通知的情况下自己醒来。

~~~c++
// 错误示范
if (!ready) cv.wait(lock); 

// 正确示范
while (!ready) cv.wait(lock);

// 或者使用 C++ 提供的 Lambda 写法，它内部逻辑就是 while
cv.wait(lock, []{ return ready; });
~~~

默认就是会检查是否返回的是true

## 生产者消费者模型

~~~c++
#include <queue>
#include <condition_variable>

class SafeBuffer {
private:
    std::queue<int> buffer;
    size_t maxSize;
    std::mutex mtx;
    std::condition_variable not_full;
    std::condition_variable not_empty;

public:
    SafeBuffer(size_t size) : maxSize(size) {}

    void produce(int val) {
        std::unique_lock<std::mutex> lock(mtx);
        // 如果满了，就等“不满”的信号
        not_full.wait(lock, [this]{ return buffer.size() < maxSize; });
        
        buffer.push(val);
        std::cout << "生产了: " << val << std::endl;

        not_empty.notify_one(); // 通知消费者：有货了
    }

    int consume() {
        std::unique_lock<std::mutex> lock(mtx);
        // 如果空了，就等“不空”的信号
        not_empty.wait(lock, [this]{ return !buffer.empty(); });

        int val = buffer.front();
        buffer.pop();
        std::cout << "消费了: " << val << std::endl;

        not_full.notify_one(); // 通知生产者：有位子了
        return val;
    }
};
~~~

此时lambda生成的闭包类

~~~c++
// 编译器生成的闭包类
class __lambda_unique_name {
private:
    SafeBuffer* const __this_ptr; // 捕获的是指针！

public:
    // 构造函数
    __lambda_unique_name(SafeBuffer* ptr) : __this_ptr(ptr) {}

    // 重载 operator()，也就是 wait 会调用的函数
    bool operator()() const {
        // 在 C++ 中，访问成员变量 buffer 实际上是访问 this->buffer
        return !(__this_ptr->buffer.empty()); 
    }
};
~~~

如果lambda的捕获列表写的是*this的话

| **捕获方式**  | **闭包内存储内容**          | **行为特点**                                                 |
| ------------- | --------------------------- | ------------------------------------------------------------ |
| **`[this]`**  | **指针** (`SafeBuffer*`)    | **引用语义**：操作的是原对象。多线程中最常用，因为我们需要多个线程看同一个 `buffer`。 |
| **`[*this]`** | **整个对象** (`SafeBuffer`) | **值语义**：调用拷贝构造函数生成一个完整的副本。这会导致子线程和主线程操作不同的数据，通常不用于同步。 |

1.物理层面的不可行：`std::mutex` 是不能拷贝的

在 C++ 中，`std::mutex` 和 `std::condition_variable` 的设计初衷就是为了保护**唯一的**共享资源，所以它们在标准库里被显式地定义为 **禁止拷贝**。

如果你尝试写 `[*this]`：

1. 编译器尝试为 Lambda 生成一个闭包类。
2. 因为是 `*this`（按值捕获），闭包类里必须包含一个 `SafeBuffer` 的完整副本。
3. 编译器在尝试生成这个副本时，发现 `SafeBuffer` 里的 `std::mutex` 和 `std::condition_variable` 根本没法拷贝。
4. **报错**：`use of deleted function...`。

所以，在 C++ 里，你甚至没法完成这个“错误的尝试”。

2. 逻辑层面的失效：同步的本质是“共享”

假设（仅仅是假设）你的 `SafeBuffer` 里的资源是可以拷贝的。如果你用了 `[*this]`，会发生极其诡异的情况：

- **原对象 A**：主线程里的 `SafeBuffer`。
- **副本对象 B**：子线程 Lambda 闭包里的 `SafeBuffer`。

**结果：**

1. 子线程在**副本 B** 的条件变量上睡着了，手里拿着的是**副本 B** 的锁。
2. 主线程（生产者）修改了**原对象 A** 的数据，并触发了**原对象 A** 的通知（notify）。
3. 子线程永远也醒不过来。因为它在等“B 的通知”，而主线程发的是“A 的通知”。

这就像你在 A 房间的门口挂了个铃铛，却指望坐在 B 房间里的人听到铃声一样。**同步的基础必须是“共享内存”**，而按值捕获（Copy）创造的是“独立内存”。