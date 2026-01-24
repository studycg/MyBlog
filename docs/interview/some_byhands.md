# 手撕智能指针

## unique_ptr

~~~c++
template<typename T>
class MyuniquePtr {
private:
	T* m_ptr;

public:
    //构造和析构
	explicit MyuniquePtr(T* ptr = nullptr) :m_ptr(ptr) {}
	~MyuniquePtr{ delete m_ptr; }

	//禁用拷贝构造函数和拷贝赋值
	MyuniquePtr(const MyuniquePtr&) = delete;
	MyuniquePtr& operator=(MyuniquePtr&) = delete;
	
    //移动构造函数
	MyuniquePtr(MyuniquePtr&& other) noexcept :my_ptr(other.myptr) {
		other.m_ptr = nullpr;
	}
	
    //移动赋值函数
	MyuniquePtr& operator=(MyuniquePtr&& other) noexcept {
		if (this != other)
		{
			delete m_ptr;
			this->m_ptr = other.myptr;
			other.m_ptr = nullpr;
		}
		return *this;
	}
	
    //解引用
	T& operator*() const { return *m_ptr }
	//取地址
    T* operator&() const { return m_ptr }
	T* get() const { return m_ptr }

};
~~~

## shared_ptr

~~~c++
template <typename T>
class MySharedPtr {
private:
    T* m_ptr;
    int* m_count; // 引用计数器，必须是指针，以便多个实例共享

    void release() {
        if (m_ptr) {
            (*m_count)--;
            if (*m_count == 0) {
                delete m_ptr;
                delete m_count;
            }
        }
    }

public:
    explicit MySharedPtr(T* ptr = nullptr) 
        : m_ptr(ptr), m_count(new int(ptr ? 1 : 0)) {}

    ~MySharedPtr() { release(); }

    // 拷贝构造：增加计数
    MySharedPtr(const MySharedPtr& other) 
        : m_ptr(other.m_ptr), m_count(other.m_count) {
        if (m_ptr) (*m_count)++;
    }

    // 拷贝赋值：先减旧的计数，再增新的计数
    MySharedPtr& operator=(const MySharedPtr& other) {
        if (this != &other) {
            release(); // 释放旧资源
            m_ptr = other.m_ptr;
            m_count = other.m_count;
            if (m_ptr) (*m_count)++;
        }
        return *this;
    }
    
    //移动构造函数
    // 加上 noexcept 是为了让 std::vector 等容器能安全地优化性能
    MySharedPtr(MySharedPtr&& other) noexcept 
        : m_ptr(other.m_ptr), m_count(other.m_count) {
        // 彻底剥夺，不改变 *m_count 的值
        other.m_ptr = nullptr;
        other.m_count = nullptr;
    }
    
    // 2. 移动赋值运算符
    MySharedPtr& operator=(MySharedPtr&& other) noexcept {
        if (this != &other) {
            release(); // 释放自己当前持有的旧资源

            // 直接接管新资源的所有权和计数器指针
            m_ptr = other.m_ptr;
            m_count = other.m_count;

            // 将 other 置空
            other.m_ptr = nullptr;
            other.m_count = nullptr;
        }
        return *this;
    }

    // 移动语义省略（逻辑同 unique_ptr，但需同时移动 m_count）

    int use_count() const { return *m_count; }
    T& operator*() const { return *m_ptr; }
    T* operator->() const { return m_ptr; }
};
~~~

> [!IMPORTANT]
>
> 这个`shared_ptr`不是线程安全的

## 线程安全shared_ptr

~~~c++
#include <iostream>
#include <atomic>

template <typename T>
class SharedPtr {
private:
    T* m_ptr;
    std::atomic<int>* m_count; // 指向原子变量的指针，用于多线程共享计数

    // 内部释放逻辑：原子自减并检查
    void release() {
        if (m_ptr && m_count) {
            // fetch_sub 返回减 1 之前的值
            if (m_count->fetch_sub(1, std::memory_order_acq_rel) == 1) {
                delete m_ptr;
                delete m_count;
                std::cout << "Resource deleted.\n";
            }
        }
    }

public:
    // 构造函数
    explicit SharedPtr(T* ptr = nullptr) 
        : m_ptr(ptr), m_count(ptr ? new std::atomic<int>(1) : nullptr) {}

    // 析构函数
    ~SharedPtr() { release(); }

    // --- 拷贝语义 ---

    SharedPtr(const SharedPtr& other) : m_ptr(other.m_ptr), m_count(other.m_count) {
        if (m_count) {
            m_count->fetch_add(1, std::memory_order_relaxed);
        }
    }

    SharedPtr& operator=(const SharedPtr& other) {
        if (this != &other) {
            release(); // 辞旧
            m_ptr = other.m_ptr;
            m_count = other.m_count;
            if (m_count) {
                m_count->fetch_add(1, std::memory_order_relaxed); // 迎新
            }
        }
        return *this;
    }

    // --- 移动语义 ---

    SharedPtr(SharedPtr&& other) noexcept 
        : m_ptr(other.m_ptr), m_count(other.m_count) {
        other.m_ptr = nullptr;
        other.m_count = nullptr;
    }

    SharedPtr& operator=(SharedPtr&& other) noexcept {
        if (this != &other) {
            release();
            m_ptr = other.m_ptr;
            m_count = other.m_count;
            other.m_ptr = nullptr;
            other.m_count = nullptr;
        }
        return *this;
    }

    // --- 工具函数 ---

    int use_count() const {
        return m_count ? m_count->load(std::memory_order_relaxed) : 0;
    }

    T& operator*() const { return *m_ptr; }
    T* operator->() const { return m_ptr; }
    explicit operator bool() const { return m_ptr != nullptr; }
};
~~~

### 为什么 `m_count` 使用 `atomic` 而不是 `mutex`？

- **性能**：`atomic` 是无锁编程的基础，通过 CPU 的 `LOCK XADD` 指令实现，比互斥锁（涉及内核上下文切换）快得多。
- **死锁风险**：引用计数逻辑简单，不涉及复杂的临界区，用 `mutex` 是大材小用且增加死锁可能。

### `memory_order` 是什么？

在上面的代码中我使用了 `std::memory_order_acq_rel`。

- **简单回答**：这是为了保证多核 CPU 下内存的可见性。当一个线程减到 0 准备 `delete` 时，必须确保其他线程之前对该内存的所有写操作都已同步完成，防止出现“对象还没删完，另一个核已经把它覆盖了”的情况。

### `release()` 中的自减判断为什么是 `== 1`？

- `fetch_sub(1)` 返回的是**减法前**的值。
- 如果返回 `1`，说明减完之后变成了 `0`。这是最后一个持有者，应当执行删除。

## mutex实现线程安全

~~~c++
#include <iostream>
#include <mutex>

template <typename T>
class SharedPtr {
private:
    T* m_ptr;
    int* m_count;
    std::mutex* m_mutex; // 必须是指针，以便多个对象共享同一把锁

    void release() {
        bool deleteData = false;
        if (m_mutex) {
            // 1. 作用域锁定
            {
                std::unique_lock<std::mutex> lock(*m_mutex);
                if (m_ptr && m_count) {
                    if (--(*m_count) == 0) {
                        deleteData = true;
                    }
                }
            }

            // 2. 如果需要删除，锁必须先释放（或者确保在锁外删除）
            // 否则在析构函数里删除 mutex 时会出问题
            if (deleteData) {
                delete m_ptr;
                delete m_count;
                // 注意：由于没有其他人在用了，可以安全删除锁本身
                delete m_mutex; 
                std::cout << "Resource and Mutex deleted.\n";
            }
        }
    }

public:
    explicit SharedPtr(T* ptr = nullptr) 
        : m_ptr(ptr), 
          m_count(ptr ? new int(1) : nullptr),
          m_mutex(ptr ? new std::mutex() : nullptr) {}

    ~SharedPtr() { release(); }

    // 拷贝构造
    SharedPtr(const SharedPtr& other) {
        std::unique_lock<std::mutex> lock(*other.m_mutex);
        m_ptr = other.m_ptr;
        m_count = other.m_count;
        m_mutex = other.m_mutex;
        if (m_count) (*m_count)++;
    }

    // 拷贝赋值（简化版，未考虑自赋值，实际需加 if(this!=&other)）
    SharedPtr& operator=(const SharedPtr& other) {
        if (this != &other) {
            release(); // 先释放旧的
            
            // 锁定对方的资源进行拷贝
            std::unique_lock<std::mutex> lock(*other.m_mutex);
            m_ptr = other.m_ptr;
            m_count = other.m_count;
            m_mutex = other.m_mutex;
            if (m_count) (*m_count)++;
        }
        return *this;
    }

    // 移动语义依然不需要锁，因为它是“所有权剥夺”，不涉及多个线程竞争同一个 count 的增减
    SharedPtr(SharedPtr&& other) noexcept 
        : m_ptr(other.m_ptr), m_count(other.m_count), m_mutex(other.m_mutex) {
        other.m_ptr = nullptr;
        other.m_count = nullptr;
        other.m_mutex = nullptr;
    }

    int use_count() const {
        if (!m_mutex) return 0;
        std::unique_lock<std::mutex> lock(*m_mutex);
        return *m_count;
    }

    T* operator->() const { return m_ptr; }
    T& operator*() const { return *m_ptr; }
};
~~~

如果你在面试中提出用 `unique_lock`：

1. **一定要提到锁必须是共享的（指针形式）**，这证明你理解 `shared_ptr` 的内存模型。
2. **主动指出这在性能上是不优的**，并说明 `std::atomic` 是更工业级的选择。
3. **补充一点**：即便使用了锁保护 `m_count`，`shared_ptr` 依然无法保护它指向的业务对象（即 `m_ptr` 指向的内存）。

# 手撕线程池

~~~c++
class ThreadPool {
public:
    explicit ThreadPool(size_t threadCount) : stop(false) {
        for (size_t i = 0; i < threadCount; ++i) {
            workers.emplace_back([this] {
                while (true) {
                    std::function<void()> task;

                    {
                        std::unique_lock<std::mutex> lock(mtx);
                        cv.wait(lock, [this] {
                            return stop || !tasks.empty();
                        });

                        if (stop && tasks.empty())
                            return;

                        task = std::move(tasks.front());
                        tasks.pop();
                    }

                    task();
                }
            });
        }
    }

    ~ThreadPool() {
        {
            std::lock_guard<std::mutex> lock(mtx);
            stop = true;
        }
        cv.notify_all();

        for (auto& t : workers)
            t.join();
    }

    void enqueue(std::function<void()> task) {
        {
            std::lock_guard<std::mutex> lock(mtx);
            tasks.push(std::move(task));
        }
        cv.notify_one();
    }

private:
    std::vector<std::thread> workers;
    std::queue<std::function<void()>> tasks;

    std::mutex mtx;
    std::condition_variable cv;
    bool stop;
};
~~~







# 手撕单例