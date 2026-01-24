## 头文件

`#inlcude<thread>`

~~~c++
#include <iostream>
#include <thread> // 必须包含这个头文件

void task() {
    std::cout << "子线程正在运行..." << std::endl;
}

int main() {
    // 1. 创建线程对象，并传入要执行的函数
    std::thread t1(task);

    // 2. 阻塞主线程，直到 t1 执行完毕
    t1.join(); 

    std::cout << "子线程已结束，主线程继续执行。" << std::endl;
    return 0;
}
~~~

`std::thread t(func)`: 创建一个线程并立即开始执行 `func`。

`t.join()`: “加入”。主线程会停在这里等待 `t` 线程执行完。如果不写 `join()`，主线程跑完了直接退出，程序会崩溃。

`t.detach()`: “分离”。线程在后台独立运行，主线程不再管它的死活。通常不推荐初学者使用，因为容易导致资源管理混乱。

## 多线程的数据竞争

想象一下：有两个线程同时对一个全局变量 `count` 进行 `count++` 操作。

1. 线程 A 读取 `count` (值为 10)。
2. 线程 B 读取 `count` (值也是 10)。
3. 线程 A 把 10 加 1 得到 11，写回内存。
4. 线程 B 也把 10 加 1 得到 11，写回内存。

**结果**：我们加了两次，但 `count` 只增加了 1。这就是典型的 **数据竞争**。

## 向线程传递参数

### 使用std::ref

`std::thread` 的构造函数采用了**可变参数模板**。你可以像调用普通函数一样传参，但这里有一个底层细节需要注意：**参数默认会被拷贝到线程的独立内存空间中**。

~~~c++
#include <iostream>
#include <thread>
#include <string>

void changeValue(int& n) {
    n += 100;
}

int main() {
    int num = 10;
    
    // 错误写法：std::thread t(changeValue, num); // 编译报错，因为线程内部尝试拷贝 num
    
    // 正确写法：使用 std::ref 包装引用
    std::thread t(changeValue, std::ref(num)); 
    
    t.join();
    std::cout << "num 的值现在是: " << num << std::endl; // 输出 110
    return 0;
}
~~~

`std::thread` 的构造函数会把所有参数先**拷贝**一份。如果你传入的是 `int&`，它尝试**拷贝一个引用**，这在 C++ 中是**不允许**的。`std::ref` 会生成一个 `reference_wrapper` 对象，它是可以被拷贝的，从而绕过这个限制。

### 使用lambda表达式

当你写 `[&num]` 时，编译器会生成一个类，里面包含一个引用成员指向 `num`。当你把整个 Lambda 传给 `std::thread` 时，拷贝的是这个“捕获了引用的闭包对象”。

~~~c++
int main() {
    int num = 10;

    // 方式 A：通过 Lambda 引用捕获
    std::thread t1([&num]() {
        num += 100; // 直接操作外部的 num
    });

    // 方式 B：通过 Lambda 值捕获（内部修改不影响外部）
    std::thread t2([num]() mutable {
        // num += 100; // 这里的 num 是副本
    });

    t1.join();
    // t2.join();
}
~~~

### 使用指针传递

~~~c++
void work(int* p) {
    *p += 50;
}
std::thread t(work, &num); // 拷贝的是地址，线程通过地址找到原变量
~~~

### 使用移动语义

如果你要传递的是一个**大对象**（比如巨大的 `std::vector`）或者**唯一资源**（比如 `std::unique_ptr`），你既不想拷贝，也不想用引用（因为原对象不再需要了），那就用移动。

~~~c++
std::unique_ptr<int> p = std::make_unique<int>(100);
std::thread t(func, std::move(p)); // p 的所有权转移到了线程内部
~~~

## 在成员函数中使用多线程

如何在一个类的方法里启动一个线程运行另一个方法呢？

`std::thread t(&类名::函数名, &对象实例, 参数1, 参数2...)`

~~~c++
class GraphicsEngine {
public:
    void render(int frames) {
        std::cout << "正在后台渲染 " << frames << " 帧..." << std::endl;
    }

    void startBackgroundRender() {
        // 第一个参数：成员函数指针
        // 第二个参数：当前对象的地址 (this)
        // 后续参数：传给 render 的参数
        std::thread t(&GraphicsEngine::render, this, 60);
        t.join();
    }
};
~~~

### 那能传入处理右值引用的函数吗

编译器可以通过，但无法修改外部数据

`std::thread` 会在内部存储区创建一个 `num` 的副本（我们叫它 `copy_num`）。

当线程真正开始执行时，它调用 `changeValue` 的方式类似于： `changeValue(std::move(copy_num))`

因为 `copy_num` 是存储在线程对象内部的私有成员，`std::thread` 知道这个变量的生命周期仅限于此，所以它会以 **右值**的形式将其传递给任务函数。由于 `int&&` 能够绑定到右值，所以编译器完全支持这种写法。

1. **主线程**：变量 `num` 在栈上，值为 $10$。
2. **创建线程**：`std::thread` 把 `num` 拷贝了一份到它自己的内部存储区，此时 `copy_num = 10`。
3. **子线程运行**：调用 `changeValue(int&& n)`，这里的 `n` 绑定的是 `copy_num`。
4. **修改数据**：`n += 100` 实际上是让 `copy_num` 变成了 $110$。
5. **结束**：子线程函数运行完毕，`std::thread` 的内部存储区随之销毁，`copy_num` 消失了。
6. **结果**：主线程里的 `num` 依然是 $10$。

> **结论**：使用 `int&&` 配合 `std::thread` 传参，实际上是把参数**移动**给了子线程。如果你传入的是一个复杂的类（比如 `std::vector`），子线程会“偷走”这个副本的资源进行处理。但无论如何，它处理的都是**副本**，而不是主线程里的原始变量。

| **写法**     | **函数签名**  | **传参方式**                    | **结果**                                                     |
| ------------ | ------------- | ------------------------------- | ------------------------------------------------------------ |
| **错误引用** | `void(int&)`  | `std::thread(f, num)`           | **编译报错**。因为 `std::thread` 尝试把拷贝出的副本（右值）传给左值引用。 |
| **标准引用** | `void(int&)`  | `std::thread(f, std::ref(num))` | **成功**。修改的是主线程里的 `num` 原身。                    |
| **右值引用** | `void(int&&)` | `std::thread(f, num)`           | **编译通过**。但修改的是线程内部的**副本**，主线程无感知。   |

## 线程的生命周期与安全性

如果一个 `std::thread` 对象被销毁时，你既没有 `join()` 也没有 `detach()`，程序会直接调用 `std::terminate()` 崩溃。

**检查可结合性**

~~~c++
if (t.joinable()) {
    t.join();
}
~~~

