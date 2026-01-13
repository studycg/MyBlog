# 运算符重载

二维向量重载+运算符

~~~c++
class Vector2 {
public:
    double x, y;

    Vector2(double a = 0, double b = 0) : x(a), y(b) {}

    // 1. 运算符重载函数
    // 语法：ReturnType operatorOP(Argument)
    Vector2 operator+(const Vector2 & rhs) const {
        Vector2 sum;
        sum.x = this->x + rhs.x; // this->x 是左操作数，rhs.x 是右操作数
        sum.y = this->y + rhs.y;
        return sum; // 返回一个新的对象，不要修改原对象
    }
};

int main() {
    Vector2 v1(1.0, 2.0);
    Vector2 v2(3.0, 4.0);
    
    // 编译器看到 +，转化成 v1.operator+(v2)
    Vector2 v3 = v1 + v2; 
}
~~~

## 限制

- 不能发明新运算符（不能重载 `operator@`）。

- 不能改变运算符的优先级（`*` 永远比 `+` 先算）。

- 不能改变操作数的个数（`+` 必须有两个，除非是一元 `+`）。

# 友元

想象一下乘法。

- `v2 = v1 * 2.0;`  $\rightarrow$ `v1.operator*(2.0)` ✅ (可以通过成员函数实现)
- `v2 = 2.0 * v1;`  $\rightarrow$ `2.0.operator*(v1)` ❌ **崩溃！**

`2.0` 是一个 `double` 类型，它不是类，没有成员函数，我们无法修改 `double` 的源代码。

解决方案： 使用非成员函数。

定义一个全局函数 Vector2 operator*(double n, const Vector2 & v)。

但问题来了：全局函数不能访问类的 private 私有成员！

**友元 (friend)** 登场：类可以声明某个外部函数为“朋友”，允许它访问私有成员。

~~~c++
class Vector2 {
private: // 改为私有，演示友元的作用
    double x, y; 
public:
    Vector2(double a, double b) : x(a), y(b) {}

    // 声明友元（它不是成员函数，但有特权）
    friend Vector2 operator*(double n, const Vector2 & v);
};

// 函数定义（不需要 Vector2:: 前缀，因为它不是成员）
Vector2 operator*(double n, const Vector2 & v) {
    // 可以直接访问 v.x 和 v.y，尽管它们是 private 的
    return Vector2(n * v.x, n * v.y);
}
~~~

最常用的友元：`operator<<`

直接用 `cout` 打印对象？ `cout << v1;`

- 左操作数是 `cout` (类型是 `std::ostream`)。
- 右操作数是 `v1` (类型是 `Vector2`)。
- 如果是成员函数，必须写在 `ostream` 类里。但我们改不了 C++ 标准库。
- **必须使用友元函数！**

~~~c++
// 在类内部声明
friend std::ostream & operator<<(std::ostream & os, const Vector2 & v);

// 在类外部定义
std::ostream & operator<<(std::ostream & os, const Vector2 & v) {
    os << "(" << v.x << ", " << v.y << ")";
    return os; // 重点：返回 os 对象，以便支持连续输出 cout << v1 << v2;
}
~~~

| **运算符类型**     | **推荐方式**      | **理由**                            | **例子**        |
| ------------------ | ----------------- | ----------------------------------- | --------------- |
| **修改自身的**     | 成员函数          | 左操作数必须是对象且会被修改        | `=`, `+=`, `++` |
| **对称的二元运算** | 非成员函数 (友元) | 允许左操作数是普通类型 (如 `2 * v`) | `+`, `-`, `*`   |
| **流运算**         | 非成员函数 (友元) | 左操作数必须是 `ostream`            | `<<`, `>>`      |
| **数组下标**       | 成员函数          | 语法要求                            | `[]`            |

# 隐式调用/转换构造函数

~~~c++
class Vector2 {
public:
    // 这个构造函数只接受一个参数时，它就成了"转换构造函数"
    Vector2(double n) : x(n), y(0) {} 
};

int main() {
    Vector2 v1 = 10.5; // 😱 隐式转换！
    // 编译器发现 10.5 是 double，v1 是 Vector2。
    // 它自动调用 Vector2(10.5) 生成临时对象，再赋值。
}
~~~

为什么？？？？？

为啥写一个构造函数 可以直接用等于号赋值啊？好几把抽象

进入编译器视角

~~~c++
Vector2 v1(10.5);    // 直接初始化 (direct-initialization)
Vector2 v2 = 10.5;   // 拷贝初始化 (copy-initialization)
~~~

看起来是赋值，但实际上**这不是赋值操作**，而是**初始化**。

~~~c++
//编译器首先看到
Vector2 v1 = 10.5;
//1.检查右边是double
//	检查左边是vector2
//	检查是否可以将double转为vector2
//2.发现了构造函数Vector2(double)
//3.生成临时对象
Vector2 __temp(10.5);
//4.然后用这个临时对象初始化 v1
Vector2 v1(__temp);  // 调用拷贝构造函数 Vector2(const Vector2&)

//----------------------------------------------------------------------------

// 编译器实际生成的代码（概念上）
double __source = 10.5;          // 原始值
Vector2 __temp(__source);        // 调用 Vector2(double) 转换
Vector2 v1(__temp);              // 调用拷贝构造函数 Vector2(const Vector2&)
~~~

实际有这样的应用

~~~c++
class String {
public:
    String(const char* s);  // 转换构造函数
};

void print(const String& s);

int main() {
    String s1 = "hello";     // const char* → String
    print("world");          // const char* → String 临时对象
}
~~~

但如果不想让这样隐式调用 可以使用**explicit关键字**

## explicit关键字

关闭隐式转换

~~~c++
explicit Vector2(double n) ...
// 之后 v1 = 10.5; 会报错。必须写 v1 = Vector2(10.5);
// 编译器的视角：
Vector2 v = 10.5;
// 1. 需要 Vector2，得到 double
// 2. 找到 explicit Vector2(double)
// 3. explicit 表示"禁止在隐式转换中使用"
// 4. 编译错误 ❌    
~~~

## 问题

~~~c++
class Vector2 {
private:
    double x, y;
    
public:
    // 定义如何转换成 double
    operator double() const {
        return std::sqrt(x * x + y * y);
    }
};

int main() {
    Vector2 v(3, 4);
    double len = v; // ✅ 调用 operator double()，len 变成 5.0
}
~~~

### 二义性陷阱

如果同时定义了：

1. `Vector2(double)` (构造函数，允许 double 转 Vector2)
2. `operator double()` (转换函数，允许 Vector2 转 double)

当你写 `double result = v1 + 2.0;` 时，编译器会崩溃：

- **理解 A**：把 `2.0` 变成 `Vector2`，然后执行向量加法？
- **理解 B**：把 `v1` 变成 `double`，然后执行普通数字加法？
- **结果**：编译器报错“二义性”。

**最佳实践**：尽量**避免**隐式类型转换。多用 `explicit`，多写显式的转换函数（如 `v.to_double()`），少用 `operator double()` 这种隐式转换。

# 关于前置++和后置++

编译器如何识别前置++和后置++

**前缀 (`++i`)**：`Vector2& operator++();`

- **逻辑**：先自增，再返回。
- **效率**：高，因为它返回的是引用（`*this`），没有拷贝。

**后缀 (`i++`)**：`Vector2 operator++(int);`

- **暗号**：参数列表里那个没名字的 `int` 是个**哑元**。它除了告诉编译器“我是后缀”之外，没有任何用处。
- **逻辑**：**先备份**当前状态，再自增，最后**返回备份**。
- **效率**：低，因为它必须创建一个临时对象来保存旧值。

~~~c++
// 前缀：++v
Vector2& operator++() {
    x++; y++;
    return *this; // 返回变身后的自己
}

// 后缀：v++
Vector2 operator++(int) { // 那个 int 就是个标记
    Vector2 temp = *this; // 1. 备份旧值
    x++; y++;             // 2. 变身
    return temp;          // 3. 返回旧值
}
~~~

这就是为什么在 C++ 中写 `for` 循环**推荐**用 `++i` 而不是 `i++`，尤其是针对类对象时，少一次拷贝。

~~~c++
class Vector2 {
    double x, y;
public:
    // 版本 1：给普通对象用的（可读可写）
    // v[0] = 10.5; 需要返回引用
    double & operator[](int i) {
        if (i == 0) return x;
        else return y;
    }

    // 版本 2：给 const 对象用的（只读）
    // const Vector2 cv(1, 2); cout << cv[0];
    // 如果没有这个版本，const 对象调用 [] 会报错！
    const double & operator[](int i) const {
        if (i == 0) return x;
        else return y;
    }
};
~~~

## 那么那么 只从语法角度上将能不能搞呢？

可以的 但是

> [!CAUTION]
>
> **太反人类了**

对于编译器来说，`operator++` 只是一个**名字**而已。

- 当你写 `++v` 时，编译器只负责寻找一个叫 `operator++()` 的函数。
- 当你写 `v++` 时，编译器只负责寻找一个叫 `operator++(int)` 的函数。

至于函数里面写什么代码、返回什么类型，编译器**完全不管**。

- 你想在 `++` 里做减法？可以。
- 你想在 `++` 里打印 "Hello World"？可以。
- 你想把前缀和后缀的逻辑完全调换？**完全合法。**

~~~c++
class Vector2 {
    public:
    double x, y;
    Vector2 operator++() {
        Vector2 temp = *this;
        x++; y++;
        return temp;
    }
    Vector2& operator++(int) {
        x++; y++;
        return *this;
    }
};
~~~

~~~c++
Vector2 v(1, 1);
Vector2 a = ++v; // 此时 v 变成了 (2,2)
                 // 但程序员预期 a 是 (2,2)，实际上你的代码让 a 变成了 (1,1)！
~~~

## 同时注意的问题

如果你试图在后缀版本中实现“标准后缀逻辑”（即返回旧值），却硬要返回引用，就会由**逻辑错误**升级为**程序崩溃**：

~~~c++
// ❌ 绝对禁止的写法
Vector2& operator++(int) {
    Vector2 temp = *this; // 备份旧值
    x++; y++;             // 自增
    return temp;          // 😱 致命错误！返回了局部变量的引用！
}
~~~

`temp` 在函数结束时就被销毁了。

你在外面拿到的是一个**悬空引用**。



# 关于下标运算符[]

~~~c++
class Vector2 {
    double x, y;
public:
    // 版本 1：给普通对象用的（可读可写）
    // v[0] = 10.5; 需要返回引用
    double & operator[](int i) {
        if (i == 0) return x;
        else return y;
    }

    // 版本 2：给 const 对象用的（只读）
    // const Vector2 cv(1, 2); cout << cv[0];
    // 如果没有这个版本，const 对象调用 [] 会报错！
    const double & operator[](int i) const {
        if (i == 0) return x;
        else return y;
    }
};
~~~

在重载 `[]` 或 `()` 时，永远要在脑子里过一遍：“如果是 `const` 对象调用它怎么办？”

# []/()=/->必须是成员函数

C++ 强制规定，以下 4 个运算符**必须**声明为**成员函数**，绝对不允许做成友元（全局）：

1. **`=`** (赋值运算符) —— **最重要！** (下一章的重点)
2. `()` (函数调用运算符) —— 用于“仿函数”。
3. `[]` (下标运算符)
4. **`->`** (成员访问箭头) —— 用于智能指针。

**为什么？** 因为这四个运算符涉及到**对象的身份标识**和**基本状态改变**。如果允许外部函数（友元）来定义“赋值”或“下标访问”，会极大地破坏面向对象的封装性和安全性，编译器直接禁止。

