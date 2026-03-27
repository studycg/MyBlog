> [!NOTE]
>
> 条件变量

- condition_variable用于线程间的通信：一个线程等待某个条件成立，另一个线程在条件成立时发出通知

- condition_variable中提供的成员函数，可分为wait系列和notify系列两类

# 举个例子

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

# wait系列成员函数

wait系列成员函数的作用就是让调用线程进行阻塞等待，包括wait、wait_for和wait_until

```c++
//版本一
void wait(unique_lock<mutex>& lck);

//版本二
template<class Predicate>
void wait(unique_lock<mutex>& lck, Predicate pred);
```

函数说明：

- 调用第一个版本的wait函数时只需要传入一个互斥锁，线程调用wait后会立即被阻塞，直到被唤醒
- 调用第二个版本的wait函数时除了需要传入一个互斥锁，还需要传入一个返回值类型为bool的可调用对象，与第一个版本的wait不同的是，当线程被唤醒后还需要调用传入的可调用对象，如果可调用对象的返回值为false，那么该线程还需要继续被阻塞

```c++
std::condition_variable cv;
std::mutex mtx;
bool ready = false;

void worker() {
    std::unique_lock<std::mutex> lock(mtx);
    cv.wait(lock, []{ return ready; }); // 等待 ready 变为 true
    // 执行后续任务...
}
//注意：虚假唤醒 (Spurious Wakeup)：线程可能在没有通知的情况下醒来
//因此 wait 必须放在 while 循环中，或者使用带谓词的重载版本
```

为什么wait系列函数要传入一个互斥锁？

- 因为**wait系列函数一般是在临界区中调用**的，为了让当前线程调用wait阻塞时其他线程能够获取到锁，因此调用wait系列函数时需要传入一个互斥锁，当线程被阻塞时这个互斥锁会被自动解锁，而当这个线程被唤醒时，又会自动获得这个互斥锁
- 当一个wait的线程被notify之后，其会自动进行lock加锁
- 因此wait系列函数实际上有三个功能，一个是让线程在条件不满足时进行阻塞等待，另一个是让线程将对应的互斥锁进行解锁，被notify之后会自动进行加锁操作

为什么wait函数一般是在临界区中调用的呢？

因为wait一般是需要判断临界资源的状态，比如在生产者消费者模型中：

```c++
std::mutex _mtx;
std::condition_variable _cv1;
std::condition_variable _cv2;
std::queue<T> data;
size_t maxCount = 10;    //资源最大数量

void Consume() {
    std::unique_lock<std::mutex> lock(_mtx);
    //只有队列不为空的时候才能进行消费
    _cv1.wait(lock, [&data](){ return not data.empty(); });
    //访问资源
    T cur = data.front();
    data.pop();
    _cv2.notify_one();
    lock.unlock();
    //处理任务
    task(cur);
}

void Producer() {
    std::unique_lock<std::mutex> lock(_mtx);
    _cv2.wait(lock, [&data](){ return data.size() < 10; });
    //插入资源
    data.emplace(create());
    _cv1.notify_one();
}

int main() {
    std::thread t1(consumer);
    std::thread t2(producer);
    t1.join();
    t2.join();
    return 0;
}
```

条件变量底层通常会维护一个等待队列：

- 当不满足wait的条件时，会加入等待队列
- 当调用notify_one时，会从等待队列中选取一个线程唤醒（FIFO通常）

`wait_for`和`wait_until`函数的使用方式与`wait`函数类似：

- wait_for：等待一段时间，如果在该时间内没有被唤醒就会退出等待（从等待队列中退出）
- wait_until：等待到某一时间点
- 线程调用wait_for或wait_until函数在阻塞等待期间，其他线程调用notify系列函数也可以将其唤醒。此外，如果调用的是wait_for或wait_until函数的第二个版本的接口，那么当线程被唤醒后还需要调用传入的可调用对象，如果可调用对象的返回值为false，那么当前线程还需要继续被阻塞

wait和wait_for的区别：wait如果没有被notify_one则会一直等待（阻塞态），但是wait_for如果没有被notify_one也会在时间到了之后唤醒(阻塞态->就绪态)

**注意：调用wait系列函数时，传入的互斥锁类型必须为unique_lock**

# notify系列成员函数

notify系列成员函数的作用就是唤醒等待的线程，包括notify_one和notify_all

- notify_one：唤醒等待队列中的首个线程，如果等待队列为空则什么也不做
- notify_all：唤醒等待队列中的所有线程，如果等待队列为空则什么也不做

注意： 条件变量下可能会有多个线程在进行阻塞等待，这些线程会被放到一个等待队列中进行排队

# 虚假唤醒

- 虚假唤醒：线程调用 wait()/wait_for() 后，没有被 notify() 唤醒，也没有超时，却从等待状态中醒来了
- 虚假唤醒本质是编译器/操作系统为了性能而产生的bug

线程有时候会在没有任何人通知的情况下自己醒来。

举一个例子：

```c++
std::mutex _mtx;
std::queue<T> _data;
std::condition_variable _cv;
void Consume() {
    std::unique_lock<std::mutex> lock(_mtx;)
    if(_data.empty()) {
        _cv.wait(lock);
    }
    T cur = _data.front();
    _data.pop();
    //do else....
}
```

如果当前`_data`为空，那么消费者线程就会进行等待，此时如果一个消费者线程发生了虚假唤醒，那么就会继续执行后面的代码，但是此时`_data`为空，因此程序崩溃。

解决方法：

1. 使用带判断的wait操作，每次唤醒时候，还需要判断可调用对象是否为true

```c++
std::mutex _mtx;
std::queue<T> _data;
std::condition_variable _cv;
void Consume() {
    std::unique_lock<std::mutex> lock(_mtx;)
    if(_data.empty()) {
        //使用带判断的wait
        _cv.wait(lock, [](){return not _data.empty(); });
    }
    T cur = _data.front();
    _data.pop();
    //do else....
}
```

2. 循环等待

```c++
std::mutex _mtx;
std::queue<T> _data;
std::condition_variable _cv;
void Consume() {
    std::unique_lock<std::mutex> lock(_mtx);
    while (_data.empty()) {    //改成while循环
        _cv.wait(lock);
    }
    T cur = _data.front();
    _data.pop();
    //do else....
}
```

~~~c++
// 错误示范
if (!ready) cv.wait(lock); 

// 正确示范
while (!ready) cv.wait(lock);

// 或者使用 C++ 提供的 Lambda 写法，它内部逻辑就是 while
cv.wait(lock, []{ return ready; });
~~~

默认就是会检查是否返回的是true

# condition_variable_any

在并发编程中，`std::condition_varibalel_any`是`std::condition_variable`的加强版

| 特性         | condition_variable            | condition_variable_any     |
| ------------ | ----------------------------- | -------------------------- |
| 支持的锁类型 | 仅限`unique_lock<std::mutex>` | 任何锁                     |
| 性能         | 极高                          | 略低（需要额外抽象开销）   |
| 应用场景     | 绝大多数互斥场景              | 读写锁协作、自定义同步原语 |

**一个应用场景：配合读写锁`shared_mutex`**

```c++
#include <iostream>
#include <shared_mutex>
#include <condition_variable>
#include <thread>

std::shared_mutex rw_mtx;
std::condition_variable_any cv; // 使用 any 版本
bool ready = false;
int data = 0;

void reader() {
    // 1. 使用 shared_lock 锁定
    std::shared_lock lock(rw_mtx);
    
    // 2. 等待条件。注意这里传的是 shared_lock！
    // 标准的 condition_variable 在这里会编译报错
    cv.wait(lock, [] { return ready; });
    
    std::cout << "Reader reads data: " << data << std::endl;
}

void writer() {
    {
        std::unique_lock lock(rw_mtx);
        data = 42;
        ready = true;
    }
    cv.notify_all(); // 通知所有等待者（包括读者）
}

int main() {
    std::thread t1(reader);
    std::thread t2(writer);
    t1.join();
    t2.join();
    return 0;
}
```

# 为什么wait必须传入unique_lock

**首先讨论为什么wait操作要上锁？**

调用 `wait` 之前手动上锁，而不把锁传给 `wait`，会发生什么？

1. 你拿着锁进入 `wait`。
2. 你阻塞了，但你**还拿着锁**。
3. 另一个线程（生产者）想改状态，发现拿不到锁，也卡住了。
4. **死锁**。

**`cv.wait(lock)` 的底层步骤：**

1. **释放锁**：将传入的锁释放，此时其他线程可以修改共享变量了。
2. **阻塞**：将当前线程挂起，放入等待队列。
3. **重新拿锁**：当被通知唤醒时，它会**先尝试重新获取锁**。只有拿到了锁，`wait` 才会返回，继续执行后面的代码。

**那么 既然wait可以上锁 为什么不上lock_guard锁 而是要上unique_lock锁呢？**

**原因一：unique_lock可以手动解锁**

`wait` 操作的核心逻辑是**原子地解锁 + 阻塞等待**，被唤醒后又会**重新加锁**，而 `unique_lock` 的特性恰好完美匹配这个需求。

`lock_guard`：是 “RAII 专属锁”，构造时加锁，析构时解锁，**生命周期内无法手动解锁 / 加锁**，灵活性极低；

`unique_lock`：支持手动调用 `unlock()` 和 `lock()`，且可以移动（`move`），能灵活控制锁的状态。

而 `wait` 操作的第一步就是**主动解锁**（让其他线程能获取锁修改条件），如果传入 `lock_guard`，因为无法手动解锁，根本无法完成这一步；只有 `unique_lock` 能满足 “临时解锁、后续重新加锁” 的需求。

**原因二：wait的原子性要求**

**底层逻辑**：第一步（释放锁）和第二步（阻塞）必须是**原子的**。如果在释放锁和进入阻塞之间发生了一个通知，而你还没睡着，这个通知就会永远丢失。这就是为什么 `wait` 必须接管 `unique_lock`。

`unique_lock` 配合条件变量的实现，能让 “解锁 + 阻塞” 变成不可分割的原子步骤，彻底避免这种问题。

**原因三：被唤醒后自动加锁，保证数据安全**

当条件变量被 `notify_one()`/`notify_all()` 唤醒时，`wait` 会自动重新获取锁（调用 `unique_lock::lock()`），直到加锁成功才会返回。这保证了：

线程被唤醒后，访问共享数据时一定持有锁，不会出现数据竞争；

如果多个线程被唤醒，会通过锁的互斥性依次执行，避免并发修改。

这里举一个简单的例子说明wait的解锁操作：

```c++
#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>

std::mutex mtx;
std::condition_variable cv;
bool ready = false; // 共享条件

// 等待线程
void wait_thread() {
    // 必须用 unique_lock，不能用 lock_guard
    std::unique_lock<std::mutex> lock(mtx);
    
    // wait 会先解锁，然后阻塞；被唤醒后重新加锁，再检查条件
    cv.wait(lock, [](){ return ready; });
    
    std::cout << "条件满足，执行后续逻辑" << std::endl;
}

// 通知线程
void notify_thread() {
    std::this_thread::sleep_for(std::chrono::seconds(1));
    {
        std::lock_guard<std::mutex> lock(mtx);
        ready = true; // 修改共享条件，必须加锁
    }
    cv.notify_one(); // 唤醒等待线程
}

int main() {
    std::thread t1(wait_thread);
    std::thread t2(notify_thread);
    
    t1.join();
    t2.join();
    return 0;
}
```

在这个例子中，正是因为wait_thread中cv.wait在等待ready为true时，解锁了mtx锁，进入阻塞状态。后续notify_thread中才会让ready为true，不然的话，wait_thread在等ready，而notify_thread在等mtx，就会导致死锁。

在这个例子中，将notify_thread的lock_guard换成unique_lock完全OK。

再举一个条件变量的例子：

# 生产者消费者模型

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

**wait对互斥锁的操作**

在这个例子中，produce的not_full的wait会解锁lock 而lock封装了mtx，这样当consume操作buffer时，就会因为mtx解锁进入对buffer的修改，进入后对mtx上锁。

**关于此例中lambda闭包的一些分析**

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