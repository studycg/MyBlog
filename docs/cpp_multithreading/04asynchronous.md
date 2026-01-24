# 异步编程

**同步编程（Synchronization）的特点是“等”**： 无论是等锁释放，还是等条件变量通知，线程往往是**阻塞**在那里的。这就像你在餐厅点餐，必须站在收银台前等菜做好才能走。

**异步编程（Asynchronous）的特点是“承诺”**： 你点完餐，服务员给你一个**号牌（Future）**，你就去玩手机了。等菜好了，号牌会震动，你再去取。在这个过程中，你（主线程）没有被阻塞，可以干别的事。

**`std::thread` (基于线程)**：你关注的是**执行流**。你手动创建一个线程，告诉它去干活，然后你得盯着它（join）或者不管它（detach）。拿回结果很难。

**`std::async` (基于任务)**：你关注的是**结果**。你把函数封装成一个“任务”扔出去，系统给你一个“承诺”（Future）。你不需要关心这个任务是开新线程做的，还是在当前线程等会儿做的，你只管在需要的时候去拿结果。

# std::async

`std::future<T>` 是异步编程的灵魂。它是一个模板类，代表一个**现在还不存在，但未来会有的值**

~~~c++
#include <iostream>
#include <future> // 异步编程的头文件

int calculateSum(int a, int b) {
    // 模拟一个耗时操作
    std::this_thread::sleep_for(std::chrono::seconds(2));
    return a + b;
}

int main() {
    // 1. 使用 std::async 启动异步任务
    // 它会返回一个 std::future 对象，就像是那个“取餐号牌”
    std::future<int> result_future = std::async(calculateSum, 10, 20);

    std::cout << "主线程正在干别的事..." << std::endl;

    // 2. 当我们需要结果时，调用 get()
    // 如果子线程还没算完，get() 会阻塞等待，直到结果出来
    int final_result = result_future.get(); 

    std::cout << "最终结果是: " << final_result << std::endl;
    return 0;
}
~~~

在此代码中：

没有创建 `std::thread`。

没有创建 `std::mutex`。

没有创建 `std::condition_variable`。

**但是**，你安全地在两个线程间传递了数据。

## `get()` 的特性（面试重点）

- **阻塞性**：如果后台任务没完，`get()` 会一直等。
- **一次性**：一旦调用了 `get()`，这个 `future` 就失效了（内部移动语义）。**绝对不能对同一个 `future` 调用两次 `get()`**，否则会抛出异常。
- **异常传递**：如果后台函数跑飞了（抛出异常），这个异常会被暂存，当主线程调用 `get()` 时，异常会在主线程重新抛出。这比 `std::thread` 捕获异常方便得多。

## 是否开了新线程

默认情况下，系统自行决定。你可以通过参数强制指定策略：

**`std::launch::async`**：强制**开启新线程**运行任务。

**`std::launch::deferred`**：**延迟执行**。任务根本不会在后台跑，直到你调用 `get()` 或 `wait()` 时，它才在当前线程同步执行。

~~~c++
// 强制开启新线程
auto f1 = std::async(std::launch::async, task);

// 延迟执行（类似于惰性计算）
auto f2 = std::async(std::launch::deferred, task);
~~~

## std::future拿数据原理

`std::future` 内部是怎么拿到另一个线程的数据的？”

这里的关键在于 **共享状态 (Shared State)**。它是内存堆（Heap）上的一个中间对象。

1. **连接纽带**：当你调用 `std::async` 时，系统在堆上创建一个 `Shared State`。
2. **生产者端**：后台线程执行完后，把结果（或异常）存入这个 `Shared State`，并修改内部状态为 `ready`。
3. **消费者端**：主线程持有 `std::future`，它内部有一个指针指向同一个 `Shared State`。调用 `get()` 时，它会检查 `ready` 标志。
4. **引用计数**：`Shared State` 内部有计数器，只有当生产者和消费者（future）都销毁后，这块堆内存才会释放。

## 非异步并行情况

`int res = std::async(compute, 10).get() + std::async(compute, 20).get();` 这还是异步并行吗？为什么？

# std::promise

~~~c++
void manualTask(std::promise<int> prom) {
    std::this_thread::sleep_for(std::chrono::seconds(1));
    prom.set_value(100); // 手动填入结果
}

int main() {
    std::promise<int> prom;
    std::future<int> fut = prom.get_future(); // 从 promise 拿回出口

    std::thread t(manualTask, std::move(prom)); // 必须用 move

    std::cout << "等待 promise..." << std::endl;
    std::cout << "结果: " << fut.get() << std::endl;
    t.join();
}
~~~

## `future` 能单独存在吗？

**不能。** `std::future` 本质上是一个**只读终端**。它就像你手里的取餐小票。小票本身不会变出汉堡，汉堡必须由厨房（另一个线程）做出来。

- **`std::async`** 是“全自动模式”：它帮你找好了厨师（线程），并自动把小票（future）交到了你手里。
- **`std::promise`** 是“手动模式”：它让你自己控制什么时候、在哪、由谁来把汉堡（数据）塞进那个取餐窗口。

##  为什么要用 `std::promise` 搭配 `std::thread`？

既然有了全自动的 `std::async`，为什么还要手动用 `promise`？

**场景一：底层控制力** `std::async` 什么时候开线程、开几个，你很难精确控制。但在高性能场景（比如图形学项目），你可能已经有一个现成的**线程池**或者一个长期运行的 **`std::thread`**。这时候你没法用 `std::async`，你只能把 `std::promise` 传给那个现有的线程，让它算完后把结果填进去。

**场景二：一个线程产生多个结果，或者在任务中间产生结果** `std::async` 绑定的函数执行完才能拿结果。但用 `std::promise`，线程可以先给 `promise` 设个值，然后**继续干别的事**，不用等函数结束。

**为什么你要从 `promise` 拿回出口（future）？** 因为当你创建一个 `std::promise` 时，你其实是创建了那一整根管道。为了能拿到结果，你必须把管道的另一头（future）取出来留在自己手里，然后把带入口的那一头（promise）交给干活的线程。

##  为什么要用 `std::move`？

这是一个关于**“契约唯一性”**的问题。

- **唯一性**：一个 `std::promise` 代表一个承诺。如果一个承诺可以被复制成两份，那如果两个线程都尝试往同一个 `promise` 里填数据（`set_value`），该听谁的？管道会炸掉。
- **所有权转移**：`std::promise` 内部持有着对“共享状态”的控制权。当你把它传给子线程时，你其实是在说：“这个承诺现在归你管了，由你负责填数”。在 C++ 中，表达这种**所有权转移**的唯一安全方式就是 `std::move`。

> **底层视角 (408)**：`std::promise` 内部包含一个不可拷贝的指针。执行 `move` 只是把指针地址传给了新对象，确保同一时间只有一个对象能操作这块内存。

## async与promise对比

~~~c++
// 内部自动创建了 promise 和 future，并自动完成了 move
auto fut = std::async(func);
~~~

~~~c++
std::promise<int> prom;           // 1. 创建管道
std::future<int> fut = prom.get_future(); // 2. 拿走出口

// 3. 把入口 move 给子线程
std::thread t([](std::promise<int> p){
    p.set_value(42);              // 4. 子线程往入口塞东西
}, std::move(prom));

int res = fut.get();              // 5. 主线程从出口拿东西
~~~

# std::packaged_task

`std::packaged_task` 包装了一个**可调用对象**（函数、Lambda 等），并允许异步获取该任务的结果。

- **像 `promise` 的地方**：它不会立刻启动线程，它只是个包装盒，你需要手动调用它，或者把它丢给 `std::thread` 去运行。
- **像 `async` 的地方**：你不需要手动调用 `set_value()`。只要被包装的函数执行完，它的**返回值**会自动被存入 `shared_state`。

~~~c++
#include <iostream>
#include <future>
#include <thread>

int complexCompute(int x) {
    return x * 10;
}

int main() {
    // 1. 把函数包装起来。注意模板参数是函数的签名 <int(int)>
    std::packaged_task<int(int)> task(complexCompute);

    // 2. 从包装盒里拿走“取餐凭证” future
    std::future<int> fut = task.get_future();

    // 3. 因为task不可拷贝所以移动
    std::thread t(std::move(task), 5); 

    // 4. 获取结果
    std::cout << "任务结果: " << fut.get() << std::endl;

    t.join();
    return 0;
}
~~~

| **工具**                 | **启动方式**                   | **结果存入方式**                 | **适用场景**                                                 |
| ------------------------ | ------------------------------ | -------------------------------- | ------------------------------------------------------------ |
| **`std::async`**         | **自动**（通常立即启动新线程） | **自动**（函数 return 时）       | 快速执行简单的后台任务。                                     |
| **`std::promise`**       | **手动**                       | **手动**（显式调用 `set_value`） | 极其灵活。比如在一个复杂的逻辑中间、甚至在多个位置给结果赋值。 |
| **`std::packaged_task`** | **手动触发**（调用 `task()`）  | **自动**（包装的函数 return 时） | **任务队列、线程池**。你想把“任务”和“执行”解耦的时候。       |

# 例子

如果我有10 个耗时的计算任务，我想让它们并行运行，但最后我只需要第一个算出来的结果（谁快要谁），剩下的我不管。你会尝试用这三种工具里的哪一种组合来实现？

如果使用async

~~~c++
auto f1 = std::async(task, 1);
auto f2 = std::async(task, 2);
...
auto f10 = std::async(task, 10);
~~~

你现在要在主线程拿结果，你先调用谁的 `.get()`？

- 如果你调用 `f1.get()`，但偏偏 `f1` 是最慢的，而 `f5` 早就算好了。
- 你的主线程会卡在 `f1.get()` 上，根本拿不到 `f5` 的结果。

这就是为什么在 C++11/14 标准库中，单靠 `std::async` 很难实现“只取最快结果”的原因——因为 **`future` 是 1 对 1 的阻塞式监听**。

**换promise**

~~~c++
#include <iostream>
#include <future>
#include <thread>
#include <vector>
#include <atomic>

void solver(int id, std::shared_ptr<std::promise<int>> prom, std::shared_ptr<std::atomic<bool>> done) {
    // 模拟不同耗时的计算
    int waitTime = rand() % 5 + 1;
    std::this_thread::sleep_for(std::chrono::seconds(waitTime));

    // 检查是否已经有人填过数了（原子操作）
    // exchange 会把 true 换进去，并返回旧值
    if (done->exchange(true) == false) { 
        prom->set_value(id); // 只有第一个到的线程能填进去
        std::cout << "线程 " << id << " 获胜！" << std::endl;
    }
}

int main() {
    auto prom = std::make_shared<std::promise<int>>();
    auto fut = prom->get_future();
    auto done = std::make_shared<std::atomic<bool>>(false);

    for (int i = 1; i <= 10; ++i) {
        std::thread(solver, i, prom, done).detach();
    }

    // 主线程只管等唯一的出口s
    std::cout << "第一个算完的任务 ID 是: " << fut.get() << std::endl;
    return 0;
}
~~~

这段代码的智能指针shared_ptr是为了避免垂直访问。使各线程的生命周期正确。

如果不使用智能指针，那么当`fut.get()`拿到结果后main()直接结束，其它线程可能还在运行，还会访问prom和done。这就会造成悬垂引用。