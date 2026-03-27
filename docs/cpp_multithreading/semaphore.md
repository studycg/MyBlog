> [!NOTE]
>
> 信号量

# 信号量

这里的信号量其实就是操作系统中的信号量

信号量是操作系统 / 编程语言提供的**同步原语**，核心作用是：

- 控制**多个线程 / 进程**对**有限临界资源**的访问（限流）
- 实现线程间的同步（比如 “等待某个资源可用”）

信号量是操作系统 / 编程语言提供的**同步原语**，核心作用是：

- 控制**多个线程 / 进程**对**有限临界资源**的访问（限流）
- 实现线程间的同步（比如 “等待某个资源可用”）

## PV操作

**Wait (P 操作 / `acquire`)**：

- 如果信号量的值大于 0，则将其减 1 并继续执行。
- 如果信号量的值为 0，则线程进入阻塞状态，直到值变得大于 0。

**Signal (V 操作 / `release`)**：

- 将信号量的值加 1。
- 如果有线程正在等待，则唤醒其中一个线程。

## 与互斥锁区别

虽然它们看起来相似，但有本质区别：

- **互斥锁**：只能由“加锁”的同一个线程来“解锁”。它强调的是**所有权**。
- **信号量**：一个线程可以执行 `acquire`，而另一个线程执行 `release`。它强调的是**通知机制**或**资源计数**。

## 两种信号量

### `std::counting_semaphore<N>`

通用的计数信号量。参数 `N` 是信号量可能达到的最大值。

- 适用于控制资源池（例如：限制数据库连接数为 10 个）。

###  `std::binary_semaphore`

这是 `std::counting_semaphore<1>` 的别名。

- 它的值只能是 0 或 1。
- 常用于两个线程之间的**信号通知**（一个线程完成后通知另一个线程开始）。
- 用法和互斥锁一样其实。

## 例子

下面的例子中，假设只允许3个线程进入临界区。

```c++
#include <iostream>
#include <thread>
#include <vector>
#include <semaphore>
#include <chrono>

// 初始化信号量，允许最多 3 个并发访问
std::counting_semaphore<3> sem(3);

void worker(int id) {
    std::cout << "线程 " << id << " 正在等待进入...\n";
    
    // P 操作：获取资源 (计数 -1)
    sem.acquire(); 
    
    std::cout << "线程 " << id << " 已进入临界区。\n";
    std::this_thread::sleep_for(std::chrono::seconds(1)); // 模拟工作
    
    std::cout << "线程 " << id << " 正在离开...\n";
    
    // V 操作：释放资源 (计数 +1)
    sem.release(); 
}

int main() {
    std::vector<std::thread> threads;
    for (int i = 0; i < 6; ++i) {
        threads.emplace_back(worker, i);
    }

    for (auto& t : threads) {
        t.join();
    }
    return 0;
}
```

## 使用场景

**场景 A：生产者-消费者模型**

信号量非常适合解决这类问题。可以使用两个信号量：

1. 一个表示“空位”的数量。
2. 一个表示“已有产品”的数量。

**场景 B：线程同步**

使用 `std::binary_semaphore` 来确保执行顺序。例如，确保线程 B 必须在线程 A 完成初始化后才开始运行：

1. 初始化 `binary_semaphore signal(0);`
2. 线程 A 完成工作后调用 `signal.release();`
3. 线程 B 在开始前调用 `signal.acquire();`

| **特性**     | **说明**                                             |
| ------------ | ---------------------------------------------------- |
| **头文件**   | `#include <semaphore>`                               |
| **引入版本** | C++20                                                |
| **性能**     | 通常比条件变量（Condition Variable）更轻量、更易用。 |
| **安全性**   | 需注意死锁问题，特别是 `acquire` 后忘记 `release`。  |

## 生产者消费者模型

```c++
#include <iostream>
#include <thread>
#include <vector>
#include <queue>
#include <semaphore>
#include <mutex>
#include <chrono>

// 缓冲区配置
const int BUFFER_SIZE = 5;
std::queue<int> buffer;
std::mutex mtx; // 保护对 queue 的访问

// 信号量定义
std::counting_semaphore<BUFFER_SIZE> empty_slots(BUFFER_SIZE); // 初始有5个空位
std::counting_semaphore<BUFFER_SIZE> full_slots(0);           // 初始有0个产品

// 生产者函数
void producer(int id) {
    for (int i = 0; i < 10; ++i) {
        int item = id * 100 + i; // 生产一个数据
        
        // 1. 等待空位 (P操作)
        empty_slots.acquire();
        
        // 2. 进入临界区，修改缓冲区
        {
            std::lock_guard<std::mutex> lock(mtx);
            buffer.push(item);
            std::cout << "[生产者 " << id << "] 放入: " << item << " (缓冲区大小: " << buffer.size() << ")\n";
        }
        
        // 3. 通知消费者有新产品 (V操作)
        full_slots.release();
        
        std::this_thread::sleep_for(std::chrono::milliseconds(200));
    }
}

// 消费者函数
void consumer(int id) {
    for (int i = 0; i < 10; ++i) {
        // 1. 等待产品 (P操作)
        full_slots.acquire();
        
        int item;
        // 2. 进入临界区，取出数据
        {
            std::lock_guard<std::mutex> lock(mtx);
            item = buffer.front();
            buffer.pop();
            std::cout << "[消费者 " << id << "] 取出: " << item << " (还剩: " << buffer.size() << ")\n";
        }
        
        // 3. 通知生产者有新空位 (V操作)
        empty_slots.release();
        
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
    }
}

int main() {
    std::thread p1(producer, 1);
    std::thread c1(consumer, 1);

    p1.join();
    c1.join();

    return 0;
}
```

**信号量的协同工作**：

- `empty_slots.acquire()` 和 `empty_slots.release()` 是成对出现的，但跨越了不同的线程。生产者消耗空位，消费者释放空位。
- 这就是信号量与互斥锁最大的不同：**信号量用于解耦线程间的资源依赖**。

**为什么还需要 `std::mutex`？**

- 信号量只负责“数量”的统计和阻塞。
- `std::queue` 本身不是线程安全的。如果有两个生产者同时通过了信号量，它们可能同时尝试执行 `buffer.push()`，这会导致崩溃。因此，对容器的具体操作必须由互斥锁保护。

**死锁预防**：

- **原则**：先获取信号量，再获取互斥锁。
- 如果先 `mtx.lock()` 再 `empty_slots.acquire()`，万一缓冲区满了，生产者会带着锁进入休眠，导致消费者无法进入临界区取走数据，从而引发永久死锁。

条件变量带数值这个有点类似信号量的

```c++
// 这行代码确实“内置”了检查逻辑
cv.wait(lock, []{ return !buffer.empty(); });
```

用信号量模拟`qcquire`

```c++
// 模拟信号量的 acquire()
void acquire() {
    std::unique_lock<std::mutex> lock(mtx);
    // 这里的 count > 0 就是你说的“内置操作”
    cv.wait(lock, []{ return count > 0; }); 
    count--; 
}
```

| **特性**     | **信号量 (Semaphore)**                              | **条件变量 (Condition Variable)**                            |
| ------------ | --------------------------------------------------- | ------------------------------------------------------------ |
| **状态持有** | 自带计数器（有记忆）。                              | 无状态（没记忆），依赖外部变量。                             |
| **信号丢失** | 不会丢失。先 `release` 后 `acquire`，线程仍能通过。 | **会丢失**。如果没有线程在 `wait` 时发送 `notify`，这个信号就消失了。 |
| **检查逻辑** | 内置了“减一/加一”逻辑。                             | 需要程序员手动写 `buffer.size() > 0` 等逻辑。                |
| **灵活性**   | 仅限于数值计数。                                    | 极其灵活（可以等待任何复杂条件，如 `is_manager && queue_not_full`）。 |