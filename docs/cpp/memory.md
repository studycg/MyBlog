此篇对应《C++ Primer Plus的动态内存和类》

# 析构、拷贝构造和赋值重载

## 浅拷贝的问题

~~~c++
class MyString {
private:
    char* str; // 指针！它指向堆内存
public:
    // 构造函数：去堆上申请内存
    MyString(const char* s) {
        str = new char[std::strlen(s) + 1];//因为最后是\0所以+1
        std::strcpy(str, s);
    }

    // 析构函数：记得还钱（释放内存）
    ~MyString() {
        delete[] str; 
    }
};

int main() {
    {
        MyString a("Hello");
        MyString b = a; // 💣 灾难发生在这里！
    } // 💥 程序结束时崩溃
}
~~~

当执行 `MyString b = a;` 时，编译器看到你没写复制构造函数，于是它生成了一个默认的。 默认行为是 **按位拷贝 (Bitwise Copy)**，也叫 **浅拷贝**。

1. **拷贝前**：`a.str` 指向堆地址 `0x100`（存放着 "Hello"）。
2. **拷贝后**：`b.str` 的值也被赋值为 `0x100`。
   - **关键点**：并没有在堆上为 `b` 申请新内存！`a` 和 `b` 现在**共享**同一块内存。

**析构时的连环车祸：**

1. `main` 结束，`b` 先销毁。`b.~MyString()` 被调用，执行 `delete[] 0x100`。**内存被释放。**
2. 紧接着 `a` 销毁。`a.~MyString()` 被调用，试图执行 `delete[] 0x100`。
3. **Double Free (重复释放)**！操作系统检测到你试图释放一块已经释放的内存，直接杀掉进程。

## 深拷贝

我们需要告诉编译器：“当拷贝对象时，不要只拷贝指针的值，要去申请一块新的内存，把内容也拷贝过去。”

这就是**拷贝构造函数**。

~~~c++
// 格式：ClassName(const ClassName & other)
MyString(const MyString& other) {
    // 1. 申请新内存 (Deep Allocation)
    str = new char[std::strlen(other.str) + 1];
    
    // 2. 拷贝数据 (Deep Copy)
    std::strcpy(str, other.str);
    
    // 现在 this->str 和 other.str 指向不同的地址，但内容一样。
}
~~~

## But 赋值运算符也会出问题

~~~c++
MyString a("Hello");
MyString b("World");

b = a; // 这里调用的不是构造函数，而是 operator=
~~~

如果不重载 `=`，编译器默认生成的也是浅拷贝，会导致两个问题：

1. **内存泄漏**：`b` 原本指向的那块 "World" 内存，没人管了（指针直接被覆盖成了 `a` 的地址），变成了孤儿。
2. **Double Free**：`a` 和 `b` 又指向同一个 "Hello" 了，析构时又要炸。

~~~c++
// 返回引用是为了支持连写 a = b = c;
MyString& operator=(const MyString& other) {
    
    // 🛑 步骤 1：检查自我赋值 (Self-Assignment Check)
    if (this == &other) {
        return *this;
    }

    // 🧹 步骤 2：释放旧内存
    delete[] str; 

    // 🏗️ 步骤 3：申请新内存并拷贝 (深拷贝)
    str = new char[std::strlen(other.str) + 1];
    std::strcpy(str, other.str);

    // ↩️ 步骤 4：返回 *this
    return *this;
}
~~~

**为什么要检查“自我赋值”？**

你可能会想：“谁会傻到写 `a = a;` 这种代码？”

1. **隐式发生**：通过指针或引用操作时，你不知道 `*ptr1` 和 `*ptr2` 是不是同一个对象。

   ```c++
   void swap(MyString& s1, MyString& s2) { s1 = s2; ... } 
   // 如果外部调用 swap(a, a)，就会发生自我赋值。
   ```

2. **如果不检查会怎样？ (灾难推演)** 假设没有步骤 1，直接进入步骤 2：

   - `delete[] str;` —— 此时 `this->str` 被删除了。
   - 因为是自我赋值，`other` 就是 `this`。所以 `other.str` **也被删除了！**
   - 进入步骤 3：`std::strcpy(str, other.str);` —— 你试图从一块**已经被释放的内存**里读取数据！
   - **结果**：读取垃圾值，或者程序直接崩溃。

这就是为什么**自我赋值检查**是 `operator=` 的第一道生死防线。

## 静态类成员

既然我们在写 `MyString`，通常我们会想知道：“我现在一共创建了多少个字符串对象？”

- **普通成员**：属于**对象**。每个对象都有一份。
- **静态成员**：属于**类**。所有对象**共享**这一份。

~~~c++
class MyString {
private:
    static int num_strings; // 声明：只是说有这么个东西
public:
    MyString(...) { num_strings++; } // 构造时 +1
    ~MyString() { num_strings--; }   // 析构时 -1
};

// ⚠️ 重点：静态成员变量必须在类外定义（分配内存）！
int MyString::num_strings = 0; // 定义并初始化
~~~

**内存视角**： `num_strings` 不在对象的堆内存里，也不在栈里，它存储在**全局/静态数据区**。

# 关于返回对象

## 1.不能返回局部变量的引用

~~~c++
const Vector2& bad_func() {
    Vector2 temp(10, 20); // temp 在栈上创建
    return temp;          // 😱 错误！函数结束 temp 就销毁了
}
~~~

## 2.按值返回

如果函数内部创建了新对象，去掉引用&直接返回对象

~~~c++
Vector2 operator+(const Vector2& v1, const Vector2& v2) {
    Vector2 sum; // 局部变量
    sum.x = v1.x + v2.x;
    // ...
    return sum; // ✅ 正确：触发拷贝构造（或移动构造），把值传出去
}
~~~

**代价**：会发生一次拷贝（但在现代 C++ 中，编译器有 **RVO (返回值优化)**，通常能把这次拷贝优化掉，效率很高）。

## 3.想支持链式调用，返回非const引用

常见于重载赋值运算符 `=` 或输出运算符 `<<`。

```c++
// 允许 a = b = c;
Vector2& operator=(const Vector2& other) {
    // ... 赋值逻辑 ...
    return *this; // ✅ 返回当前对象本身（它肯定还活着）
}
```

这里必须返回引用，因为如果按值传递，`a = b` 会产生一个临时的 `a'`，然后 `a' = c`，真正的 `a` 并没有被 `c` 赋值

## 4.为了效率优先返回const引用

如果函数返回的是**本来就存在的东西**（比如类里的成员，或者传进来的参数），尽量返回 `const &`。

~~~c++
class Vector2 {
    double x;
public:
    // 直接把内部的 x 借你看一眼，不许改，也不用拷贝
    const double& getX() const { return x; } 
};
~~~

## 返回值只用const修饰

~~~c++
const Vector2 func() {
    return Vector2(10, 20);
}
~~~

调用者**必须**用 const 接收，或者拷贝到非 const 对象

~~~c++
// 方式1：用 const 接收
const Vector2 v1 = func();  // ✅
// v1.x = 5;  // ❌ 错误：v1 是 const

// 方式2：拷贝到非 const
Vector2 v2 = func();  // ✅ 进行拷贝
v2.x = 5;            // ✅ 可以修改，v2 是新的对象
~~~

表示返回一个不可修改的临时对象 通常没什么意义

# 指向对象的指针

这一节主要讲 `new` 和 `delete` 与对象的配合。核心在于：**指针是多态的基础**，也是复杂数据结构的基础。

1. **指针访问成员：箭头 `->`**

- 对象用点：`obj.show()`
- 指针用箭头：`ptr->show()`

2. **这里的陷阱：`delete` 还是 `delete []`？**

这是一个极其隐蔽的 Bug。

~~~c++
MyString* ptr = new MyString("Hello"); 
delete ptr;   // ✅ 正确：调用一次析构函数

MyString* arr = new MyString[10]; 
delete arr;   // ❌ 错误！只调用了 arr[0] 的析构函数！剩下 9 个内存泄漏。
delete[] arr; // ✅ 正确：调用 10 次析构函数。
~~~

# 其它说法

## 1.复制并交换惯用语

重载赋值运算符的问题

~~~c++
MyString& operator=(const MyString& other) {
    if (this == &other) return *this; // 1. 检查自赋值
    
    delete[] str; // 2. 先删除旧的内存占用
    
    // 3. 申请新内存
    // 💣 假如这里 new 抛出了异常 (std::bad_alloc) 怎么办？
    str = new char[std::strlen(other.str) + 1]; 
    
    std::strcpy(str, other.str);
    return *this;
}
~~~

你执行了第 2 步，`delete[] str`。旧数据没了，`str` 变成了悬空指针（或者 nullptr）。

执行第 3 步 `new` 时，内存不足，系统抛出异常。

函数非正常退出。

**结果**：你的对象处于**“半死不活”**的状态（Corrupted State）。旧数据丢了，新数据没来，指针还瞎指。程序如果不崩溃，逻辑也全乱了。这叫**“异常不安全”**。

高手利用了**栈对象的自动析构**和**指针交换不抛异常**的特性，写出了“完美”的赋值运算符。

首先，我们需要一个无异常的 `swap` 函数（通常作为友元）：

~~~c++
friend void swap(MyString& first, MyString& second) noexcept {
    using std::swap; 
    swap(first.str, second.str); // 只交换指针，绝不会抛异常
}
~~~

然后，看高手的 `operator=` 怎么写：

~~~c++
// 注意参数：不是 const MyString&，而是传值 (By Value)！
MyString& operator=(MyString other) { 
    // 1. 参数传递时，编译器自动调用拷贝构造函数，生成了一个副本 'other'。
    //    如果这里 new 失败抛异常，函数还没开始执行就退出了，'this' 毫发无损。安全！

    // 2. 交换
    swap(*this, other); 
    // 此时：
    // 'this' 拿到了 'other' 里的新数据（指针）。
    // 'other'（那个副本）拿到了 'this' 的旧数据（旧指针）。

    return *this;
} // 3. 函数结束，副本 'other' 自动销毁。
  //    它的析构函数被调用，顺手把 'this' 的旧数据给 delete 掉了。
~~~

**高在哪里？**

1. **代码极简**：没有 `if (this == &other)`，没有显式的 `delete`，没有 `new`。
2. **异常安全 (Strong Exception Guarantee)**：要么修改成功，要么什么都没发生（原对象保持原样）。
3. **复用代码**：完全复用了“拷贝构造函数”和“析构函数”的逻辑，不需要再写一遍深拷贝逻辑。

## 2.移动语义

~~~c++
MyString a = MyString("Hello"); // 临时对象 "Hello" 构造
// MyString b = a; // 拷贝
~~~

如果是 `MyString b = MyString("World");` 呢？

1. `MyString("World")` 创建了一个临时对象（在堆上申请了内存）。
2. `b` 初始化，又去堆上申请了一块内存，把数据拷过来。
3. 临时对象销毁，把那块内存释放掉。

**高手视角**： “这也太蠢了！临时对象反正马上要死，为什么要**拷贝**它的数据？直接把它手里的指针**抢过来**（窃取资源）不就行了吗？”

这就是 **移动构造函数**。

### 移动构造函数

~~~c++
// 参数是右值引用 MyString &&
MyString(MyString&& other) noexcept {
    // 1. 偷梁换柱：直接把它的指针拿过来
    this->str = other.str;
    
    // 2. 毁灭证据：把它的指针置空
    // 这样它析构时，delete nullptr 啥也不会发生
    other.str = nullptr; 
}
~~~

**高手结论**： 在现代 C++ 中，如果你管理动态内存，你不仅要写析构、拷贝构造、拷贝赋值，还要写 **移动构造** 和 **移动赋值**。这才是完整的内存管理类。

### 举个例子

~~~c++
#include <iostream>
#include <cstring>

class MyString {
private:
    char* str;
    
public:
    // 普通构造函数
    MyString(const char* s) {
        std::cout << "普通构造函数: " << s << std::endl;
        str = new char[std::strlen(s) + 1];
        std::strcpy(str, s);
    }
    
    // 拷贝构造函数（深拷贝）
    MyString(const MyString& other) {
        std::cout << "拷贝构造函数: " << other.str << std::endl;
        str = new char[std::strlen(other.str) + 1];
        std::strcpy(str, other.str);
    }
    
    // 移动构造函数（C++11 新特性）
    MyString(MyString&& other) noexcept {
        std::cout << "移动构造函数: " << other.str << std::endl;
        // 1. 偷取资源
        str = other.str;
        // 2. 置空原指针
        other.str = nullptr;
    }
    
    // 析构函数
    ~MyString() {
        if (str) {
            std::cout << "析构: " << str << std::endl;
            delete[] str;
        } else {
            std::cout << "析构: (null)" << std::endl;
        }
    }
    
    void print() const {
        if (str) std::cout << "内容: " << str << std::endl;
        else std::cout << "内容: (null)" << std::endl;
    }
};
~~~

~~~c++
MyString createString() {
    MyString temp("Hello");
    return temp;  // 没有移动构造函数时：调用拷贝构造函数
}

int main() {
    MyString s = createString();
    s.print();
}
//普通构造函数: Hello
//拷贝构造函数: Hello  ← 额外的拷贝！
//析构: Hello
//内容: Hello
//析构: Hello
~~~

~~~c++
MyString createString() {
    MyString temp("Hello");
    return temp;  // temp 是左值，但编译器会优化
}

int main() {
    MyString s = std::move(createString());  // 强制移动
    s.print();
}
//普通构造函数: Hello
//移动构造函数: Hello  ← 高效移动，没有内存分配！
//析构: (null)         ← 原来的 temp 已经是空指针
//内容: Hello
//析构: Hello
~~~

### 移动语义用于赋值

~~~c++
// 移动赋值运算符
MyString& operator=(MyString&& other) noexcept {
    std::cout << "移动赋值运算符" << std::endl;
    
    if (this != &other) {
        // 1. 释放自己的资源
        delete[] str;
        
        // 2. 偷取对方的资源
        str = other.str;
        
        // 3. 置空对方的指针
        other.str = nullptr;
    }
    return *this;
}
~~~

~~~c++
int main() {
    MyString a("Hello");
    MyString b("World");
    
    b = std::move(a);  // 调用移动赋值运算符
    
    std::cout << "a: ";
    a.print();  // 输出: 内容: (null)
    
    std::cout << "b: ";
    b.print();  // 输出: 内容: Hello
    
    return 0;
}
~~~

### Rule of Five

~~~c++
class MyString {
public:
    // 1. 析构函数
    ~MyString();
    
    // 2. 拷贝构造函数
    MyString(const MyString&);
    
    // 3. 拷贝赋值运算符
    MyString& operator=(const MyString&);
    
    // 4. 移动构造函数 (C++11)
    MyString(MyString&&) noexcept;
    
    // 5. 移动赋值运算符 (C++11)
    MyString& operator=(MyString&&) noexcept;
};
~~~

**注意事项**

~~~c++
// 正确使用
MyString a = createString();  // 自动移动
MyString b = std::move(a);    // 显式移动 将左值引用改为右值引用

//如果直接b = a就是调用拷贝构造而不是移动构造函数了

// 危险！移动后不要使用原对象
std::cout << a.str;  // ❌ 危险：a 可能已经是 nullptr
a.print();           // ❌ 可能崩溃

// 检查是否可安全使用
if (a.str != nullptr) {
    a.print();  // ✅
}
~~~

## 3.返回值优化

~~~c++
MyString makeString() {
    MyString temp("Magic");
    return temp; 
}

MyString s = makeString();
~~~

按照 C++ 语法，这里应该发生：

1. `temp` 构造。
2. `temp` 拷贝给 `main` 的临时返回值。
3. 临时返回值 拷贝给 `s`。
4. 销毁临时对象，销毁 `temp`。

**实际的编译器（高手优化）**： 编译器会看穿一切，直接把 `s` 的内存地址传进 `makeString` 函数里，让 `temp` **直接构造在 `s` 的内存地址上**。 **0 次拷贝，0 次移动。** 这就是 **返回值优化RVO**。

**启示**： 千万不要为了“优化”而去写 `MyString* makeString()`（返回指针），也不要写 `void makeString(MyString& out)`。**直接返回对象**往往是最高效的，因为编译器比你更懂优化。

## 关于delete[]

### `delete[]` 怎么知道要释放多大的内存？（内存曲奇 / Memory Cookie）

**问题：** 我们在代码里写 `delete[] str;` 时，从来没有传过大小参数。 `new char[100]` 申请了 100 个字节。 但是 `free` (底层) 或者 `delete` 是怎么知道它要释放 100 个字节，而不是 50 或 200 个字节的？

**底层原理：Overhead (开销) 与 Cookie** 当编译器处理 `new type[N]` 时，它申请的内存实际上 **大于** `sizeof(type) * N`。 它会在数组的**头部**（通常是地址的前面 4 或 8 个字节）偷偷藏一个整数，记录了**数组的元素个数**（或者总字节数）。这个隐藏的数据块被称为 **Memory Cookie**。

C++

```c++
// 伪代码：new int[10] 的底层视角
char* memory = malloc(sizeof(int) * 10 + 4); // 多申请 4 字节
*(int*)memory = 10; // 在开头记录：这里有 10 个元素
int* ptr = (int*)(memory + 4); // 返回给用户的指针偏移了 4 字节
return ptr;
```

**为什么这是个致命知识点？** 这就解释了为什么 **`new[]` 必须配对 `delete[]`**，绝不能混用！

- **混用后果**：
  - 如果你用 `delete ptr`（不带 `[]`）去释放 `new int[10]`：
  - 编译器以为这是个单个对象，它不会去读那个“Cookie”。
  - 它直接把 `ptr` 传给 `free`。
  - **崩溃**：`free` 接收到的地址是 `ptr`，但真实申请的起始地址是 `ptr - 4`。内存分配器会报错“Invalid Pointer”，或者造成堆破坏。

## 关于初始化列表的顺序欺骗

~~~c++
class Test {
public:
    int m_a;
    int m_b;

    // 构造函数：列表里先写了 m_b，再写 m_a
    Test(int x) : m_b(x), m_a(m_b * 2) {} 
};

int main() {
    Test t(10);
    // m_a 是 20 吗？
}
~~~

**底层原理：声明顺序决定一切** 答案是：**`m_a` 是一个垃圾值（未定义行为）。**

C++ 标准强制规定：**成员变量的初始化顺序，严格按照它们在类定义中声明的顺序进行，与你在初始化列表中写的顺序无关！**

1. 在 `class Test` 里，`m_a` 先声明，`m_b` 后声明。
2. 构造时，编译器**先初始化 `m_a`**。
3. 初始化 `m_a` 时用了 `m_a(m_b * 2)`。此时 `m_b` 还没初始化（是一块生肉，里面的值是随机的）。
4. 所以 `m_a` 计算出了一个垃圾值。
5. 然后才轮到初始化 `m_b`。

**高手的习惯**：永远保证初始化列表的顺序与成员声明顺序**完全一致**。很多编译器（如 GCC/Clang）开启 `-Wreorder` 警告就是为了抓这个。

## 关于nullptr

在 C++98 中，空指针是用 `NULL` 或 `0` 表示的。为什么 C++11 要专门引入 `nullptr`？它在底层到底是什么

**底层原理：重载决议的二义性** `NULL` 在 C++ 中通常被宏定义为 `0`（整数）。这会导致极其隐蔽的 Bug。

~~~c++
void func(int n)   { cout << "Int version"; }
void func(char* s) { cout << "Pointer version"; }

int main() {
    func(NULL); // 你想调用指针版本，但实际输出了 "Int version"！
}
~~~

- **C++98 困境**：因为 `NULL` 是 `0`，是 `int`，所以完美匹配 `func(int)`。编译器认为这比 `func(char*)` 更匹配。
- **C++11 救星**：`nullptr` 是一个新的关键字，它的类型是 `std::nullptr_t`。
  - 它**不是整数**。
  - 它可以隐式转换为任何指针类型。
  - 它**不能**隐式转换为整数。
  - `func(nullptr)` -> 只能匹配 `char*` 版本。

**知识点扩展**：`std::nullptr_t` 是怎么实现的？ 它本质上是一个**空类**的实例，内部重载了各种 `operator type*()` 转换函数，让它可以变成任意指针，唯独不重载 `operator int()`。

## 关于重载new

~~~c++
class Bullet {
public:
    // 重载 new：不找操作系统要内存，而是去自己的池子里拿
    static void* operator new(size_t size) {
        return BulletPool::allocate(size); // 极速分配
    }

    // 重载 delete：把内存还回池子，而不是还给操作系统
    static void operator delete(void* p) {
        BulletPool::deallocate(p);
    }
};
~~~

**底层**：当你写 `new Bullet()` 时，编译器会先检查 `Bullet` 类有没有重载 `operator new`。如果有，就调你的；没有，才去调全局的。

这赋予了 C++ 程序员**绕过操作系统，直接管理物理内存**的最高权限。
