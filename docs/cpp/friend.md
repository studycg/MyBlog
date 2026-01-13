# 友元类

假设我们写一个 `Server`（服务器）类，它有很多核心数据是 `private` 的（如端口、连接数）。 然后我们要写一个 `ServerMonitor`（监控器）类，用来诊断服务器状态。 如果 `Server` 不给权限，`Monitor` 就什么都看不见。

~~~c++
class Server {
private:
    int port;
    int status;
    
    // 1. 声明友元类：把自家钥匙给 Monitor
    // 只要是在 Server 肚子里声明就行，public/private 区域不影响友元声明
    friend class ServerMonitor; 

public:
    Server(int p) : port(p), status(0) {}
};

class ServerMonitor {
public:
    void check(const Server& s) {
        // 2. 特权访问：直接访问 s.status (private)
        // 在普通类眼里，这是非法的；在 Monitor 眼里，这是合法的。
        if (s.status == 0) cout << "Server is idle." << endl;
    }
    
    void modifyPort(Server& s, int p) {
        // 甚至可以修改 private 数据
        s.port = p; 
    }
};
~~~

## 友元成员函数

上面的写法太豪放了。`friend class ServerMonitor` 意味着 `Monitor` 的**所有成员函数**都可以随意读写 `Server` 的私有数据。 如果我们只想开放“检查权限”，不想开放“修改权限”，怎么办？

**解决**：只让 `ServerMonitor` 中的**某一个特定函数**成为友元。

~~~c++
// 步骤 1：必须先声明 Server 类存在（前向声明），
// 否则 Monitor 里的 check 函数不知道参数 Server& s 是什么。
class Server; 

// 步骤 2：必须先定义 Monitor 类（至少是定义），
// 否则 Server 里的 friend 声明不知道 Monitor::check 是个啥。
class Monitor {
public:
    void check(const Server& s); // 只能声明，不能写函数体！
    // 为什么不能写函数体？因为此时 Compiler 只知道 Server 这个名字，
    // 不知道 Server 里面有 status 这个成员。
};

// 步骤 3：定义 Server 类
class Server {
    int status = 200;
public:
    // 精确打击：只跟 Monitor 的 check 函数做朋友
    friend void Monitor::check(const Server& s);
};

// 步骤 4：最后补上 check 的函数体
// 此时 Server 已经定义完了，status 可见了。
void Monitor::check(const Server& s) {
    cout << "Checking status: " << s.status << endl; // ✅
}
~~~

## 共同友元

假设你有一个 `TV`（电视）类和一个 `Remote`（遥控器）类。 你想定义一个全局函数 `void sync(TV& t, Remote& r)`，让遥控器和电视配对。这个函数需要**同时访问** `TV` 的私有频道数据和 `Remote` 的私有频率数据。

~~~c++
class TV; // 1. 前向声明：告诉编译器 TV 是个类，别报错

class Remote {
private:
    int frequency;
public:
    // 2. 声明 sync 是我的朋友
    friend void sync(TV& t, Remote& r);
};

class TV {
private:
    int channel;
public:
    // 3. 声明 sync 也是我的朋友
    friend void sync(TV& t, Remote& r);
};

// 4. 定义函数：此时它拥有两边的访问权
void sync(TV& t, Remote& r) {
    t.channel = 10;      // 访问 TV private
    r.frequency = 5000;  // 访问 Remote private
    cout << "Synced!" << endl;
}
~~~

## 互为友元

**前向声明**

~~~c++
class Remote; // 1. 前向声明
// 翻译：编译器你好，请记住 'Remote' 是个类的名字。
// 具体它长啥样，后面会说，现在别报错。

class TV {
    // 2. 友元声明
    friend class Remote; 
    // 翻译：编译器，那个叫 'Remote' 的家伙是我的朋友。
    // 虽然我现在还不知道 Remote 里面有啥，但这不影响我把它设为朋友。
    
private:
    int channel;
};
~~~

**声明与实现分开**

~~~c++
class Remote; // 前向声明

class TV {
    friend class Remote;
    int state;
public:
    // ❌ 错误写法：试图在类内部直接定义函数
    void peek(Remote& r) {
        // 编译器读到这行时崩溃了！
        // 此时编译器只知道 'Remote' 是个名字。
        // 它不知道 'Remote' 里面有没有一个叫 'mode' 的成员变量！
        // 也不知道 'Remote' 在内存里长什么样！
        cout << r.mode; 
    }
};

class Remote {
    friend class TV;
    int mode; // mode 定义在这里
};
~~~

**声明友元**：只需要**名字**（Name）。

**使用成员**：需要**完整定义**（Full Definition/Layout）。

**正确写法**

~~~c++
// ================= Step 1: 登记名字 =================
class Remote; // 前向声明


// ================= Step 2: 定义类的外壳 =================
class TV {
    friend class Remote; // 登记 Remote 是朋友
public:
    int state = 10;
    
    // ⚠️ 关键点：只声明函数，不写函数体！
    // 告诉编译器：我有这个功能，但具体代码待会儿再补。
    void buzz(Remote& r); 
};

class Remote {
    friend class TV; // 登记 TV 是朋友
public:
    int mode = 1;

    // 这里可以直接写函数体吗？
    // 可以！因为此时 TV 已经在上面定义完了！Remote 已经看清 TV 的全貌了。
    void setChannel(TV& t, int c) {
        t.state = c; // ✅ 没问题，编译器认识 TV::state
    }
};


// ================= Step 3: 补上 Step 2 欠下的函数体 =================
// 此时，TV 和 Remote 都已经完全定义好了。
// 编译器已经拥有了双方的“内存蓝图”。

void TV::buzz(Remote& r) {
    // 现在可以访问 r.mode 了，因为 Remote 类在上面已经定义结束了。
    cout << "Remote mode is: " << r.mode << endl; // ✅
}
~~~

# 嵌套类

这也是一种“Has-a”的实现，但它比“包含”更进一步：**把类定义藏在另一个类里面**。

~~~c++
class Queue {
private:
    // Node 类只为 Queue 服务，外面的人不需要知道 Node 的存在
    // 所以把它定义在 private 区域
    struct Node { 
        int data;
        Node* next;
        Node(int d) : data(d), next(nullptr) {}
    };

    Node* head; // Queue 内部用 Node

public:
    // ...
};

// 外部 main 函数：
// Queue::Node n; ❌ 错误！Node 是 private 的，外面看不见。
~~~

- `Node` 类的方法，能访问 `Queue` 的 `private` 成员吗？
- **直觉**：`Node` 都在 `Queue` 肚子里了，肯定能访问啊。
- **历史**：
  - **C++98**：**不行！** 它们被视为完全独立的两个类，只是名字嵌套了。如果你想访问，`Queue` 必须把 `Node` 声明为友元。
  - **C++11 及以后**：**可以！** 标准修正了规则。嵌套类被视为外部类的“一员”，天生拥有访问外部类私有成员的权限。

反过来，`Queue` 能访问 `Node` 的私有成员吗？

- **不能。** 除非 `Node` 把 `Queue` 设为友元，或者 `Node` 本身就是 public。

## 模板嵌套

~~~c++
template <typename T>
class Queue {
private:
    // 嵌套类定义在模板内部
    struct Node {
        T item;     // Node 自动知道T是什么
        Node* next;
        Node(const T& i) : item(i), next(nullptr) {}
    };

    Node* head;
    // ...
};
~~~

**实例化即生成**。

当你写 `Queue<int> iq;` 和 `Queue<double> dq;` 时，编译器在后台干了什么？

1. **生成外层类**： 编译器生成了两个完全独立的类：`Queue_int` 和 `Queue_double`。
2. **生成嵌套类**： 编译器同时也生成了两个**完全独立**的内部类结构！
   - 对于 `Queue<int>`，生成了 `Queue_int::Node`（里面的 item 是 `int`）。
   - 对于 `Queue<double>`，生成了 `Queue_double::Node`（里面的 item 是 `double`）。

#### 关键知识点：

1. **类型不兼容**：`Queue<int>::Node` 和 `Queue<double>::Node` 是两个**毫无关系**的类型。你不能让一个指向另一个。
2. **作用域内的 T**：在 `Queue<T>` 内部定义 `Node` 时，不需要再写 `template<typename T> struct Node`。因为 `Node` 本身就在 `T` 的作用域笼罩之下，它天然就看见了 `T`。

# 异常

**以前的烂活**

**烂方法 A：调用 `abort()`**

~~~c++
double harmonic_mean(double a, double b) {
    if (a == -b) {
        std::cout << "无法计算！";
        std::abort(); // ❌ 程序直接暴毙，操作系统杀掉进程
    }
    return 2.0 * a * b / (a + b);
}
~~~

**烂方法 B：返回错误码**

~~~c++
// 返回 true 表示成功，false 表示失败，真正的结果通过指针传出来
bool harmonic_mean(double a, double b, double* result) {
    if (a == -b) return false; // ❌ 上报错误
    *result = ...;
    return true;
}

void calculate() {
    double res;
    // 程序员必须时刻记得检查返回值！
    if (harmonic_mean(1, -1, &res) == false) {
        // 处理错误
    }
}
~~~

**代码丑陋**：正常的业务逻辑被无数的 `if (ret == false)` 淹没。

**容易遗忘**：如果你偷懒没写 `if` 判断，程序会带着错误的数据继续跑，导致后面更大的灾难。

## 异常机制

~~~c++
void baby() {
    // 1. 发现问题，抛出异常
    // throw 就像是一个加强版的 return，但它不走寻常路
    throw 404; 
    
    // ⚠️ 下面这行代码永远不会执行！
    std::cout << "Baby finished"; 
}

void mother() {
    baby(); // 2. baby 抛出了异常
    // ⚠️ 因为 baby 没正常返回，而是抛出异常
    // 所以 mother 函数里 baby() 后面的代码也被跳过了！
    std::cout << "Mother finished"; 
}

int main() {
    try { // 3. 监控区：我在盯着这里面的代码
        mother();
    }
    catch (int e) { // 4. 捕获区：抓到了！
        // 执行流直接从 baby() 里的 throw 跳到了这里！
        std::cout << "Caught error: " << e << std::endl;
    }
    // 5. 程序继续正常执行
    std::cout << "Main continues...";
}
~~~

#### `throw` 到底把东西扔哪去了？

当你写 `throw 404;` 时，这个 `404` 并不在 `baby` 的栈帧里（因为 `baby` 马上要销毁），也不在 `main` 的栈帧里（还没传过去）。

**编译器背后的动作**：

1. **创建副本**：编译器会在内存中一个**特殊的、编译器管理的区域**（既不是普通的栈，也不是普通的堆）开辟一小块空间。
2. **拷贝**：把 `404`（或者你抛出的对象）**拷贝**到这块特殊区域。
3. **传递**：`catch (int e)` 里的 `e`，其实是从这块特殊区域里拿数据的。

> **这就是为什么我们说 `throw` 即使抛出的是局部变量也是安全的，因为它被“备份”到了安全区。**

## 内存细节LSDA

## 将对象作为异常类型

`throw 404;` 这种做法虽然合法，但在工程中是**极度不推荐**的。因为 `int` 无法携带足够的调试信息。

**1. 为什么要抛出对象？**

对象 = 数据 + 逻辑。 一个合格的对象应该包含：

- **What**: 发生了什么（错误消息）。
- **Where**: 哪里发生的（文件名、行号）。
- **Context**: 当时的环境数据（比如网络请求失败时的 IP 地址、重试次数）。

**2. 标准体系：`std::exception`**

C++ 提供了一个标准基类 `std::exception`。所有的标准库异常（如 `std::bad_alloc`, `std::out_of_range`）都继承自它。

**高手的习惯**：你自己定义的异常类，也应该继承自它。 **原因**：这样上层代码只需要写一个 `catch (std::exception& e)` 就能兜底捕获所有错误。

~~~c++
#include <exception>
#include <string>

class DatabaseError : public std::exception {
private:
    std::string msg;
    int errCode;
public:
    DatabaseError(int code, const char* m) : errCode(code), msg(m) {}

    // 重写 virtual what() 函数
    // const char* 返回 C 风格字符串，noexcept 承诺不抛出异常
    const char* what() const noexcept override {
        return msg.c_str();
    }
    
    int getCode() const { return errCode; }
};
~~~

**为什么what函数要用noexcept？**

~~~c++
try {
    throw DatabaseError(100, "连接失败");
} catch (const std::exception& e) {
    // 这里打印 e.what() 时，如果 what() 抛出异常...
    std::cout << e.what() << std::endl;  // 危险：可能抛出嵌套异常
}
~~~

这会造成**嵌套异常**，程序通常会直接 `std::terminate()`，因为异常系统无法处理这种情况。

**标准库约定**

~~~c++
namespace std {
    class exception {
    public:
        virtual const char* what() const noexcept;  // C++11 后标记为 noexcept
        // ...
    };
}
~~~

std::exception的 what()是 noexcept的，所以继承自它的类也应该遵守这个约定。

**逻辑一致性**

获取错误信息的函数应该尽可能可靠。如果一个"获取错误信息"的函数自己还会出错，那就会陷入逻辑悖论：

- 你抛出了一个异常
- 然后想获取异常的详细信息
- 获取详情的函数又抛出了异常...
- 现在你要处理这个新异常，但无法知道最初异常的信息

**那么基类的虚函数使用了noexcept，派生类重载时可以不用noexcept吗？**

C++17之后不行

~~~c++
#include <iostream>
#include <exception>

class Base {
public:
    virtual void foo() noexcept {  // 基类函数是 noexcept
        std::cout << "Base::foo\n";
    }
};

class Derived1 : public Base {
public:
    void foo() noexcept override {  // ✅ 正确：与基类一致
        std::cout << "Derived1::foo\n";
    }
};

class Derived2 : public Base {
public:
    // ❌ 错误：从C++17开始编译失败
    // 错误信息：looser exception specification
    void foo() override {  // 缺少 noexcept
        std::cout << "Derived2::foo\n";
    }
};

# C++14 标准编译
g++ -std=c++14 test.cpp
# 警告：warning: 'virtual void Derived2::foo()'
#        can throw but the overrider is 'noexcept'

# C++17 标准编译
g++ -std=c++17 test.cpp
# 错误：error: looser throw specifier for 
#       'virtual void Derived2::foo()'
~~~

~~~c++
class Base {
public:
    virtual void bar() {  // 可能抛出异常
        std::cout << "Base::bar\n";
    }
};

class Derived : public Base {
public:
    void bar() noexcept override {  // ✅ 允许：比基类更严格
        std::cout << "Derived::bar\n";
    }
};
~~~

## 异常规范

~~~c++
// 意思：这个函数只能抛出 int 或 char 类型的异常
void func() throw(int, char); 

// 意思：这个函数不抛出任何异常
void safe() throw();
~~~

**为什么它失败了？（被 C++11 废弃）** 因为这种检查是 **运行时 (Runtime)** 的，而不是编译时的。 编译器虽然会检查，但真正的拦截发生在程序运行时。编译器会偷偷在这个函数周围包一层代码，如果函数抛出了 `int` 以外的东西，系统会调用 `std::unexpected()` 然后崩溃。

C11废除了throw(...)引入了noexcept

~~~c++
void func();          // 可能抛出任何异常 (默认)
void func() noexcept; // 承诺绝对不抛出异常
~~~

如果一个标记为 `noexcept` 的函数真的抛出了异常，C++ 运行时**不进行栈解退**，不尝试寻找 catch 块，而是直接调用 `std::terminate()` 杀死程序。

**为什么这是一种优化？** 因为编译器知道这个函数“不抛异常”，它就可以：

1. **省略 LSDA 表**：不需要为这个函数生成异常查找表。
2. **激进优化**：代码路径更简单，不用预备“回滚”操作。

## noexcept

关于 `noexcept` —— “是承诺，而不是检查？”

**您的理解**：

> “只是用户层面的承诺不出错，并不是已经检查了确定不出错？只是出错不会被捕获吗？”

**回答**： **完全正确。** `noexcept` 本质上就是程序员给编译器签下的一张 **“生死状”**。

**编译器不负责查水表**

C++ 编译器一般**不会**去深入检查 `noexcept` 函数内部是不是真的没有任何 `throw` 语句（除了极简单的场景）。即使你在 `noexcept` 函数里写了 `throw`，或者调用了会抛异常的函数，**编译器通常也能编译通过**（可能会给个 Warning，但不会报错）。

**后果：违约即“死刑”**

并不是说“出错不会被捕获”，而是说**连捕获的机会都不给你**。

如果一个函数标记了 `noexcept`，但在运行时它真的抛出了异常：

~~~c++
template <typename T>using Duo = std::pair<T, T>; // 定义一个无论如何两个类型都一样的
pair Duo<int> coordinates; // 相当于 std::pair<int, int>c++
~~~

1.  C++ 运行时系统检查发现：“哎？这个函数签了生死状说不抛异常的啊？”
2.  **直接处决**：系统直接调用 `std::terminate()`。
3.  **程序崩溃**：程序立即结束。**注意**：此时通常**不会**进行栈解退（Stack Unwinding），也就是说，栈上的对象可能连析构函数都来不及调用，程序就没了。

**什么要这么狠？**

为了**速度**。 如果编译器知道你签了“生死状”，它生成的汇编代码就可以省掉很多“防止异常发生后需要回滚”的保护指令。这在底层优化（特别是针对 `vector` 等容器操作）中价值连城。

## noexcept与移动语义

**问题**：为什么 `std::vector` 在扩容（resize）时，有时候效率高，有时候效率低？

**与vector扩容**

**什么是“强异常保证”？（事务性）**

`std::vector` 的 `push_back` 或 `resize` 操作承诺遵循 **“事务性”** 原则：

> **要么全部成功，要么完全不发生（保持原样）。**

绝不允许出现：**“扩容了一半，数据搬了一半，有的在旧家，有的在新家，整个容器乱套了”** 这种中间状态。

------

**场景模拟：搬家（扩容）**

假设 `vector` 里有 100 个对象，现在满了，要扩容到 200。 需要把这 100 个对象搬到新内存里。

#### 方案 A：使用“复制构造” (Copy) —— 慢，但绝对安全

如果使用复制（Copy）：

1. **动作**：保留旧内存里的 100 个对象不动。在新内存里，一个个 **克隆** 过去。
2. **如果出错**：假设克隆到第 50 个对象时，抛出了异常（比如内存不足，或者拷贝逻辑出错）。
3. **回滚（Rollback）**：`vector` 把新内存里那 49 个刚克隆好的对象销毁，释放新内存。
4. **结果**：旧内存里的 100 个对象**毫发无损**。用户看到的是 `push_back` 失败了，但原来的数据还在。
5. **结论**：**这是安全的。**

#### 方案 B：使用“移动构造” (Move) —— 快，但有回滚风险/C++11

如果使用移动（Move）：

1. **动作**：把旧内存里的对象，一个个 **剪切**（偷空资源）到新内存。注意，**旧对象被“掏空”了**。
2. **如果出错**：假设移动到第 50 个对象时，抛出了异常。
3. **回滚？不可能了！**
   - 前 49 个对象已经在新家了。
   - 旧家里的前 49 个对象已经被变成了“空壳”（moved-from state）。
   - 第 50 个对象炸了。
   - **现在的状态**：一半数据在新家，一半空壳在旧家。想要恢复原样？你得把新家的 49 个再“移回去”。**可是万一“移回去”的过程中又抛出异常怎么办？**
4. **结果**：`vector` 的数据结构彻底损坏（Corrupted）。
5. **结论**：**除非你保证移动绝对不出错，否则这是赌博。**

`std::vector`扩容的伪代码：

~~~c++
// std::vector 的扩容逻辑
if (T_Move_Constructor is noexcept) {
    // 路径 1：你有“生死状”
    // 你承诺移动绝不出错。那我相信你，我用 Move。
    // 既然绝不出错，我就不需要考虑“回滚”的问题，因为理论上不会走到那一步。
    move_elements(); 
} else {
    // 路径 2：你没承诺
    // 你可能出错。为了保证“强异常保证”（万一出错能回滚），
    // 我不敢冒险破坏旧数据。我只能忍痛用 Copy。
    copy_elements();
}
~~~

> 即使标记了 `noexcept`，如果真的发生了异常，程序崩溃了，旧位置数据不也没了吗？

**回答**： 是的，如果标记了 `noexcept` 却真的抛了异常，程序直接 `terminate`（暴毙）。 在这种情况下，**确实所有数据都丢了（因为进程死了）**。

但 `vector` 的逻辑是：

- 如果程序直接崩溃，这是**程序员的责任**（你签了虚假的生死状）。这属于 **Bug**。
- 如果程序没崩溃，但 `vector` 处于数据损坏的中间状态继续运行，这属于 **数据污染 (Data Corruption)**。

对于 C++ 标准库来说：**“与其让你带着错误的数据继续跑（导致后面更隐晦的逻辑错误），不如直接让你死掉（暴露 Bug）。”**

而且，绝大多数规范的移动构造函数（比如 `std::string`, `std::vector` 的移动）仅仅是**指针交换**，不涉及内存分配，客观上是**真的不会抛出异常的**。只要你诚实地标记了 `noexcept`，`vector` 就能放心地享受性能提升。

~~~c++
class Hero {
public:
    // ✅ 高手写法：显式加上 noexcept
    Hero(Hero&&) noexcept { ... }
};
~~~

## 异常对象的按值与按引用（避免对象切片）

**错误写法：按值捕获**

~~~c++
try {
    throw DatabaseError(500, "Connection Failed"); // 抛出派生类对象
} 
catch (std::exception e) { // ❌ 错误！按值捕获
    // 发生了什么？
    // 1. 系统调用 std::exception 的拷贝构造函数。
    // 2. 它只拷贝了 DatabaseError 中的基类部分。
    // 3. DatabaseError 特有的 errCode 和 msg 丢失了！
    // 4. e.what() 调用的可能是基类的版本（如果基类没纯虚），而不是派生类的。
    std::cout << e.what(); 
}
~~~

**正确写法：按引用捕获**

~~~c++
catch (const std::exception& e) { // ✅ 正确！引用指向原对象
    // e 指向那个被存在“特殊异常内存区”里的完整 DatabaseError 对象。
    // 多态生效，调用的是 DatabaseError::what()。
    std::cout << e.what();
}
~~~

### 为什么传入引用？

**1.为了防止对象切片**

把 `catch` 块想象成一个**特殊的函数**，抛出的类会传入catch的括号。

函数调用视角

~~~c++
// 定义函数：参数是 Base，按值传递
void func(Base b) { 
    // 这里发生了一次拷贝构造：Base b = passed_object;
    // 只有基类部分被拷进来了，派生类部分被丢弃。
}

Derived d;
func(d); // 调用时发生切片
~~~

catch视角

~~~c++
// catch 块
catch (Base e) { 
    // 这里完全等同于 func(Base b)
    // 系统在栈上创建了一个新的局部对象 e (类型是 Base)
    // 它调用了 Base 的拷贝构造函数，把抛出的 Derived 对象拷了一部分进来。
    // 结果：e 只是一个残缺的 Base 对象。
}
~~~

函数调用视角

~~~c++
// 定义函数：参数是 Base&，引用传递
void func(Base& b) {
    // 没有创建新对象，b 只是 d 的一个别名。
    // b 指向的内存里，依然完整的躺着 Derived 的所有数据。
    // 如果调用虚函数，会查 vptr，调用 Derived 的版本。
}

Derived d;
func(d); // 多态生效
~~~

catch视角

~~~c++
catch (Base& e) {
    // 这里完全等同于 func(Base& b)
    // e 只是那个“异常安全区”里完整 Derived 对象的一个引用/别名。
    // e.what() 调用的就是 Derived::what()。
}
~~~

**2.避免拷贝**

~~~c++
class LargeException {
    std::vector<int> data;  // 可能包含大量数据
public:
    LargeException(const LargeException&) {  // 拷贝构造函数
        std::cout << "昂贵的拷贝！\n";
    }
};

// 按值捕获会发生拷贝
catch (LargeException e) {  // ❌ 调用拷贝构造函数
    // ...
}

// 按引用捕获无拷贝
catch (const LargeException& e) {  // ✅ 无拷贝
    // ...
}
~~~

**3.引用可以保持虚函数表 确保正确的多态行为**

~~~c++
catch (std::exception e) {  // ❌ 按值，虚表丢失
    std::cout << e.what();  // 总是调用 std::exception::what()
}

catch (const std::exception& e) {  // ✅ 按引用，虚表保留
    std::cout << e.what();  // 正确调用派生类的 what()
}
~~~

**4.大多数情况下应该使用const引用**

为了读取不能修改

## 异常匹配机制

catch的匹配是顺序进行的，就像函数重载解析：
~~~c++
try {
    throw DerivedException();
} catch (const BaseException& e) {  // 会匹配这个
    std::cout << "匹配到 BaseException&" << std::endl;
} catch (const DerivedException& e) {  // 永远不会到达这里
    std::cout << "匹配到 DerivedException&" << std::endl;
}
~~~

## 栈解退

当异常被抛出，但还没被捕获（在 `throw` 和 `catch` 之间）的那段时间，程序处于一个**危机状态**。 C++ 运行时系统接管了控制权，它必须把调用栈一层一层地**拆掉**，直到找到那个愿意接盘的 `catch`。

这个拆除的过程，就叫 **栈解退**。

**“凡是在栈上已经‘完全构造’的对象，我都会负责调用它的析构函数。”**

~~~c++
void level3() {
    std::string s = "Level 3 String"; // 栈对象
    throw std::runtime_error("Boom!");
    // s 的析构函数会被调用
}

void level2() {
    std::vector<int> v(100); // 栈对象（虽然它管理堆内存）
    level3(); 
    // v 的析构函数会被调用 -> 进而释放它管理的堆内存
}

void level1() {
    int* p = new int(10); // ⚠️ 裸指针（栈上只有指针，数据在堆上）
    level2();
    delete p; // 永远执行不到！-> 内存泄漏！
}

int main() {
    try {
        level1();
    } catch (...) {
        // 捕获异常
    }
}
~~~

1. `level3` 抛出异常。Runtime 检查发现 `level3` 没 catch。
2. **析构 `s`**（释放字符串内存）。弹出 `level3` 栈帧。
3. 回到 `level2`。Runtime 检查发现 `level2` 没 catch。
4. **析构 `v`**（释放 vector 内存）。弹出 `level2` 栈帧。
5. 回到 `level1`。Runtime 检查发现 `level1` 没 catch。
6. **什么都不做**（`p` 只是个 `int*`，内置类型没有析构函数）。弹出 `level1` 栈帧。
    - **惨案发生**：`p` 指向的那块堆内存没人管了，泄漏了
7. 回到 `main`。找到 catch。处理异常。

这就是为什么 C++ 极力推崇 **RAII (资源获取即初始化)** 和 **智能指针**。 如果你在 `level1` 里用的是 `std::unique_ptr<int> p(new int(10));`，那么在步骤 6 中，栈解退会调用 `unique_ptr` 的析构函数，顺便把堆内存释放掉。

### 构造函数中发生异常

**问题**：如果在**构造函数执行的过程中**抛出了异常，这个对象的**析构函数**会被调用吗？

**答案**：**绝对不会！**

C++ 的逻辑是：**只有“完全构造”的对象（即构造函数成功执行到了 `}`），才配拥有析构函数。** 如果构造函数跑了一半就挂了，系统认为这个对象“从未诞生过”，自然不需要“死掉”。

~~~c++
class Dangerous {
    int* a;
    int* b;
public:
    Dangerous() {
        a = new int(10); // 1. 成功申请资源 A
        
        // ... 中间发生了一些事 ...
        
        if (内存不足) throw 1; // 2. 抛出异常！构造失败！
        
        b = new int(20); 
    }

    ~Dangerous() {
        delete a; // 3. 永远不会被调用！
        delete b;
    }
};
~~~

这种情况如何解决？

**若资源都是在构造函数的{}中申请**

~~~c++
class Dangerous {
    int* a;
    int* b;
public:
    Dangerous() : a(nullptr), b(nullptr) { // 先初始化为空，防止野指针
        // 1. 申请资源 A
        a = new int(10); 
        
        try {
            // 2. 尝试申请资源 B（可能会抛出异常）
            b = new int(20); 
            
            // 如果这里还有其他可能抛异常的代码...
        }
        catch (...) {
            // 3. 捕获到了！此时 b 失败了，但 a 活着。
            // 因为析构函数不会跑，所以我们必须【手动】释放 a
            delete a; 
            
            // 4. 关键：再次抛出异常！
            // 构造函数失败意味着对象创建失败，必须通知上层。
            // 你不能把异常吞掉，否则上层会以为对象创建成功了，拿着一个半残的对象去用。
            throw; 
        }
    }
};
~~~

**若使用初始化列表进行申请**

~~~c++
// 这种写法，普通的 try-catch 抓不住初始化列表里的异常！
Dangerous() : a(new int(10)), b(new int(20)) { ... }
~~~

~~~c++
class Dangerous {
    int* a;
    int* b;
public:
    // 注意这个 weird 的语法：try 在冒号前
    Dangerous() try : a(new int(10)), b(new int(20)) {
        // 构造函数体
    }
    catch (...) {
        // 1. 这里能捕获初始化列表里抛出的异常！
        
        // 2. 这是一个极其特殊的 catch 块：
        // 如果 a 是普通指针，你依然需要手动 delete a。
        // 如果 a 是类对象，编译器会自动先析构 a，再进这里。
        
        // 3. 即使你不写 throw，编译器也会在这里强制自动 throw。
        // (构造函数里的 catch 块不允许吞掉异常)
        
        // 这里主要用于记录日志，或者清理裸指针资源
        delete a; 
    }
};
~~~

**直接使用智能指针**

~~~c++
#include <memory>

class Safe {
    // 使用智能指针（RAII 封装类）
    std::unique_ptr<int> a;
    std::unique_ptr<int> b;
    
public:
    Safe() 
        : a(new int(10)), // 1. a 构造成功。a 是一个完整的 unique_ptr 对象。
          b(new int(20))  // 2. 假设这里抛出异常！
    {
    }
    // 根本不需要写析构函数，也不需要 try-catch
};
~~~

**为什么这样就没问题？（底层逻辑）**

1. **a 构造成功**：`a` 不再是一个裸指针，它是一个 `unique_ptr` 类的**栈对象**（成员变量）。
2. **b 抛出异常**：`Safe` 类的构造函数中断。
3. **栈解退开始**：
   - 系统判断 `Safe` 对象构造失败，不调用 `~Safe()`。
   - **但是！** 系统会检查 `Safe` 肚子里有哪些成员是**已经构造完整**的。
   - 系统发现 `a` 是完整的。
   - 系统自动调用 `a` 的析构函数：`unique_ptr` 的析构函数被执行，内部的 `delete` 被调用。
   - 系统发现 `b` 还没生出来，不管它。
4. **结果**：完美清理，无内存泄漏，代码极其简洁。

- **问题根源**：构造函数抛异常 $\rightarrow$ 对象没生出来 $\rightarrow$ 析构函数不调 $\rightarrow$ **裸指针**无人认领。
- **手动解法 (try-catch)**：在异常飞出去之前，手动 `delete` 裸指针。
- **自动解法 (RAII)**：把裸指针换成**类对象**（智能指针）。只要这个类对象生出来了，系统就会负责它的析构，哪怕外层的大对象死在半路上。

### 析构函数中不能抛出异常

1. `func()` 抛出了 **异常 A**。
2. 系统开始栈解退，准备清理现场。
3. 系统调用了 `obj.~Object()`。
4. 结果 `~Object()` 里面写得不好，又抛出了一个 **异常 B**。

此时，**异常 A** 还在空中飞（还没被 catch 捕获），**异常 B** 又飞出来了。 C++ 运行时只能同时处理一个异常。面对两个同时存在的异常，系统会直接崩溃。

**底层行为**： 系统会调用 `std::terminate()`，程序立即终止。连 core dump 都不一定有机会生成。

如果在析构函数里必须要执行可能出错的操作（比如关闭文件、断开数据库连接），必须**在析构函数内部把异常吞掉**。

~~~c++
~DatabaseConnection() {
    try {
        db.disconnect(); // 可能抛异常
    } 
    catch (...) {
        // 1. 记录日志：断开连接失败
        std::cerr << "Error disconnecting DB"; 
        // 2. 绝对不再次 throw！也就是“吞掉”异常。
    }
}
~~~

### 如何知道哪些需要析构？

系统怎么知道哪些对象需要析构？ 这就回到了我们之前提到的 **LSDA (Language Specific Data Area)** 表。

编译器在编译每个函数时，会把函数代码切割成若干个**“区域”**。

- **Region 1**: 还没有局部对象。
- **Region 2**: 对象 A 构建完成。（记录：如果出事，调用 `A.~A()`）
- **Region 3**: 对象 B 构建完成。（记录：如果出事，先调 `B.~B()`，再调 `A.~A()`）

**隐形的计数器**： 虽然没有显式的指针，但**程序计数器 (PC)** 本身就充当了索引。 当异常发生时，"Personality Routine"（收尸人）会拿着崩溃时的 PC 地址，去查表，看当前处于哪个 Region，从而决定按照什么顺序调用哪些析构函数。

# RTTI

运行阶段类型识别(Runtime Type Identification) 

RTTI 提供了三个工具来搞定这件事：

## dynamic_cast

1. **`dynamic_cast` 运算符**：最安全的“向下转型”工具。
2. **`typeid` 运算符**：返回类型信息的对象。
3. **`type_info` 结构**：存储类型名字等信息的结构体。

~~~c++
Hero* ph = new Warrior(); // 基类指针指向派生类

// 尝试把 ph 转换成 Warrior*
Warrior* pw = dynamic_cast<Warrior*>(ph);

if (pw) {
    // 转换成功！说明 ph 指向的真身确实是 Warrior (或者是 Warrior 的子类)
    pw->slash(); 
} else {
    // 转换失败！返回 nullptr。说明 ph 指向的可能是一个 Mage
    cout << "这不是个战士";
}
~~~

`dynamic_cast` **只能用于包含虚函数的类！**

- **原因**：RTTI 的数据存储在 **虚函数表 (vtable)** 里。如果类没有虚函数，就没有 vtable，也就没有 RTTI 信息，`dynamic_cast` 会直接编译报错。

每个有虚函数的对象里都有一个 `vptr` 指向虚表。 而在这张**虚表 (vtable)** 的**头部**（通常是索引为 -1 的位置，或者表头之前），藏着一个指向 **`type_info` 对象的指针**。

**执行流程**： 当你调用 `dynamic_cast<Warrior*>(ph)` 时：

1. 程序通过 `ph` 找到对象的 `vptr`。
2. 通过 `vptr` 找到虚表。
3. 从虚表中拿出隐藏的 `type_info` 指针。
4. 拿着这个 `type_info` 跟 `Warrior` 的 `type_info` 进行比对（可能是比对名字字符串，也可能是比对继承树）。
   - 如果匹配（或者目标是源类型的基类），返回地址。
   - 如果不匹配，返回 `nullptr`。

**性能代价**： `dynamic_cast` 是非常昂贵的！在深度继承链中，它可能需要遍历继承树，进行多次比较。**不要在高性能循环里频繁使用它。**

## typeid和typeinfo

如果你不需要转换，只是想看一眼类型，可以用 `typeid`。

~~~c++
#include <typeinfo>

if (typeid(*ph) == typeid(Warrior)) {
    // 只有当 ph 指向的【严格】是 Warrior 类型时才成立
    // 如果 ph 指向的是 Warrior 的子类 SuperWarrior，这里会返回 false
    // 这与 dynamic_cast 的“兼容性检查”不同
}

cout << typeid(*ph).name(); // 输出类型名字（如 "class Warrior"）
~~~

## 类型强转

### `dynamic_cast` (动态转换)

- **用途**：主要用于类层次间的**安全向下转型**（基类 -> 派生类）。
- **检查时机**：**运行时 (Runtime)**。
- **安全性**：高。失败返回 `nullptr`。

### `static_cast` (静态转换) —— 最常用的

- **用途**：
  1. **基本类型转换**：`int` 转 `double`，`enum` 转 `int`。
  2. **不安全的向下转型**：把基类指针转为派生类指针。
     - 只要你有继承关系，编译器就让你转。
     - **即使转错了（指鹿为马），它也不报错，直接给你一个错误的指针**。
- **检查时机**：**编译时**。
- **安全性**：低（如果是向下转型），但**效率极高**（仅仅是编译器层面的指针类型重解释，没有运行时开销）。

###  `const_cast` (常量转换)

- **用途**：唯一一个能**去掉 `const` 属性**的转换符。
- **场景**：通常用于适配旧的 C 语言 API（它们没有声明 `const` 参数，但实际上不会修改数据）。
- **禁忌**：如果你去掉了 `const` 并且真的修改了原本是 `const` 的数据，结果是**未定义行为 (UB)**。

```c++
const int a = 10;
int* p = const_cast<int*>(&a);
*p = 20; // ⚠️ 危险！虽然编译过了，但程序可能会崩，或者 a 还是 10。
```

### `reinterpret_cast` (重解释转换) 

- **用途**：处理完全不相关的类型转换。比如把 `int*` 转成 `char*`，或者把指针转成整数 `long`。
- **底层**：它仅仅是**重新解释了内存位的含义**。
- **场景**：底层驱动开发、哈希计算、序列化。

```c++
long address = reinterpret_cast<long>(ph); // 把指针地址变成整数打印出来
```
