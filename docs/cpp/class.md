此篇对应《C++ Primer Plus》第十章类与对象

# 抽象和类

~~~c++
class Stock { // class 关键字
private: 
    // 私有区域：闲人免进
    std::string company;
    long shares;
    double share_val;
    double total_val;
    void set_tot() { total_val = shares * share_val; } // 辅助函数

public: 
    // 公有区域：对外接口
    void acquire(const std::string & co, long n, double pr);
    void buy(long num, double price);
    void sell(long num, double price);
    void update(double price);
    void show();
}; // 注意分号！
~~~

### 访问控制

**`private` (默认)**：只有类内部的函数能访问。这是**数据封装的关键。不能直接在 `main` 函数里写 `myStock.shares = 100;`，必须通过 `buy()` 函数去改。

- **Why?** 防止数据被设置成非法状态（比如股票数量变成负数）。

**`public`**：全世界都能访问。这是类的**接口 (Interface)**

### 深度解析：类与结构体 (`class` vs `struct`)

这是一个经典的面试题：**在 C++ 中，`struct` 和 `class` 有什么区别？**

**答案：** 在技术上，它们**几乎完全一样**！

- **`class`**：成员默认是 `private` 的。
- **`struct`**：成员默认是 `public` 的（为了兼容 C 语言）。

除此之外，`struct` 也可以有成员函数，也可以有 `private` 区域。但在实际开发惯例中：

- 用 `struct` 表示纯数据结构（Data Object，只包数据，没什么逻辑）。
- 用 `class` 表示拥有复杂逻辑的对象。

## 实现类成员函数

### 作用域解析运算符`::`

普通函数叫 `acquire`，但这不行，因为可能别的地方也有叫 `acquire` 的函数。 我们要告诉编译器：“这是属于 `Stock` 类的 `acquire`”。

~~~c++
// Stock:: 限制了作用域
void Stock::acquire(const std::string & co, long n, double pr) {
    company = co;
    // ...
}
~~~

### 默认内联函数

- **写在类声明里**：如果在 `class {...}` 的大括号里直接写了函数体（如上面的 `set_tot`），编译器会自动把它当作 **`inline` 函数**处理。
- **写在类声明外**：如果在外面定义时加上 `inline` 关键字，它也是内联的。

这样做有利于鼓励小函数设计、在性能上也消除了大函数的调用开销。

从小函数设计角度

~~~c++
// 不好的设计：一个大函数做所有事情
class Vector {
    float x, y, z;
public:
    void setAndNormalize(float a, float b, float c) {
        x = a; y = b; z = c;
        float length = sqrt(x*x + y*y + z*z);
        x /= length; y /= length; z /= length;
    }
};

// 好的设计：多个小函数
class Vector {
    float x, y, z;
public:
    // 这些小函数默认内联候选，调用几乎无开销
    void set(float a, float b, float c) { x=a; y=b; z=c; }
    float length() const { return sqrt(x*x + y*y + z*z); }
    void normalize() { float len = length(); x/=len; y/=len; z/=len; }
};
~~~

从调用开销角度

~~~c++
// 非内联调用的开销：
// 1. 参数压栈
// 2. 保存返回地址
// 3. 跳转到函数代码
// 4. 函数执行
// 5. 恢复现场
// 6. 返回结果

// 内联后：
// 直接展开代码，无上述开销

class Point {
    int x, y;
public:
    // getter/setter 函数 - 完美内联候选
    int getX() const { return x; }  // 内联：直接返回成员
    void setX(int val) { x = val; } // 内联：直接赋值
};

// 使用
Point p;
p.setX(10);
int a = p.getX();

// 内联展开后相当于：
// p.x = 10;
// int a = p.x;
~~~

### 底层调用机制

**“有 100 个 Stock 对象，但代码段里的 `Stock::show()` 函数只有一份。由于函数只有一份，它怎么知道我要打印的是 `stockA` 的数据还是 `stockB` 的数据呢？”**

这是通过隐式传递 **`this` 指针** 实现的。

当你调用 `stockA.show();` 时，编译器在底层悄悄把它转化成了类似 C 语言的代码：

~~~c++
// 编译器的“心理活动”
Stock_show(&stockA);
~~~

它把对象的地址作为一个隐藏参数传给了函数。函数内部访问 `shares` 时，实际上是在访问 `this->shares`。

**对象**：在栈或堆上分配内存，**只包含数据成员** (`company`, `shares` 等)。

**成员函数**：存储在代码段 (.text)，**所有对象共享同一份代码**。

## 构造函数和析构函数

### 构造函数背景

创建了一个 `Hero` 对象：

~~~c++
class Hero {
public:
    string name;
    int hp;
    void init(string n, int h) { name = n; hp = h; } // 手动初始化函数
};

int main() {
    Hero cloud; 
    // 此时 cloud 处于"未定义状态"。名字是空的，血量可能是垃圾值。
    
    // 如果你忘了调用下一行，程序可能会在后面崩溃
    cloud.init("Cloud", 100); 
}
~~~

这里的 `cloud` 刚出生时是“残疾”的（未初始化），必须靠程序员自觉调用 `init`。这是不安全的。

**解决方案**：**构造函数 (Constructor)**。这是一种特殊的成员函数，**在对象创建的那一瞬间，自动被调用**。

1. 函数名必须与类名**完全相同**。
2. **没有返回值**：构造函数不能声明返回值类型，连 `void` 也不行。

~~~c++
class Hero {
private:
    string name;
    int hp;
public:
    // 构造函数声明
    Hero(string n, int h); 
    
    void show() { cout << name << ": " << hp << endl; }
};

// 构造函数定义
Hero::Hero(string n, int h) {
    name = n;
    hp = h;
    cout << "英雄 " << name << " 诞生了！" << endl;
}
~~~

~~~c++
int main() {
    // 1. 显式调用 (Explicit)
    Hero h1 = Hero("Cloud", 100);

    // 2. 隐式调用 (Implicit) - 最常用
    Hero h2("Tifa", 80);

    // 3. 列表初始化 (C++11, 推荐) - 防止窄化转换
    Hero h3 = {"Aerith", 60};
    Hero h4{"Sephiroth", 999}; 

    return 0;
}
~~~

### 默认构造函数

1. **如果没写任何构造函数**：编译器会好心地赠送你一个隐式的默认构造函数 `Hero() {}`（什么都不做）。允许你写 `Hero h;`。
2. **如果你写了任意一个构造函数**（比如上面的 `Hero(string, int)`）：编译器就**收回**赠送的默认构造函数。

~~~c++
// 假设上面的 Hero 类只有带参构造函数

int main() {
    Hero h; // ❌ 编译报错！
    // 理由：你既然定义了怎么造英雄（必须有名有血），编译器就不允许你造一个无名无血的英雄。
}
~~~

如果非要创造空对象 就要**显式**手写一个默认构造函数

### 析构函数

构造函数负责“出生”，析构函数负责“处理后事”。

**规则**：

1. 函数名是 `~` 加上类名。
2. 没有参数，没有返回值。
3. **不能重载**（一个类只能有一个析构函数）。

**用途**： 如果你的构造函数里使用了 `new` 申请了堆内存，那么析构函数就是你 `delete` 它的唯一机会。如果只是普通的变量（如 `int`），通常不需要写析构函数，编译器生成的默认析构函数就够了。

~~~c++
class Hero {
public:
    ~Hero() {
        cout << name << " 倒下了（对象销毁）" << endl;
    }
};
~~~

**底层视角：什么时候调用？** 这取决于对象的存储持续性（第9章的内容）：

1. **自动对象（栈）**：当程序执行流离开定义它的 `{}` 大括号时，自动调用。
2. **静态对象（全局）**：程序结束时调用。
3. **动态对象（堆）**：当你手动执行 `delete ptr` 时调用。

###  =default

**一旦你手写了任何一个带参数的构造函数，编译器就不再赠送那个无参的默认构造函数了。**

如果你既想用带参的，又想保留无参的，以前你得这样手写：

~~~c++
class Hero {
public:
    Hero(int hp) { this->hp = hp; } // 带参
    Hero() {} // 手写一个空的默认构造函数，为了把编译器收回的那个补回来
};
~~~

**问题**：虽然看起来 `Hero() {}` 和编译器生成的没区别，但在底层优化上，**编译器生成的版本（Trivial Constructor）效率通常更高**，且能保持类是 POD类型的某些特性。

**解决方案**：`= default`

告诉编译器：“我知道我写了带参构造函数，但我还是想要你原本那个默认生成的版本，请把它还给我。”

```c++
class Hero {
public:
    Hero(int hp) { this->hp = hp; }
    
    // 显式要求编译器生成默认版本
    Hero() = default; 
};
```

- **底层原理**：编译器会生成一个最高效、最标准的默认实现。对于拷贝构造函数和析构函数，这同样适用。

### =delete

**有些东西不能被拷贝**

想象一下，你设计了一个类代表“**文件句柄**”或者“**独一无二的锁**”。 如果有两个对象指向同一个文件句柄，析构时就会出现**双重释放**的 Bug。 所以，这种对象**禁止拷贝**。

**老派写法（C++98）**： 把拷贝构造函数声明为 `private`，并且**不写实现**。

~~~c++
class FileLock {
private:
    // 放在私有区，外面调不到；不写实现，里面调会报链接错误
    FileLock(const FileLock&); 
public:
    FileLock() {}
};
~~~

**解决方案**：`= delete`

告诉编译器：“这个函数被删除了，谁敢调用它，直接编译报错！”

```c++
class FileLock {
public:
    FileLock() {}
    
    // 🚫 禁止拷贝构造
    FileLock(const FileLock&) = delete; 
    
    // 🚫 禁止赋值操作
    FileLock& operator=(const FileLock&) = delete; 
};

int main() {
    FileLock a;
    FileLock b = a; // ❌ 编译直接报错：引用了已删除的函数
}
```

- **底层原理**：编译器在**函数重载解析**阶段看到 `= delete`，就会立即停止并抛出特定的错误信息。这比旧的 private 方法更清晰、更早发现错误。

## 初始化列表

**赋值写法**

~~~c++
class Hero {
    string name;
    int hp;
public:
    Hero(string n, int h) {
        name = n; // 先调用 name 的默认构造，再调用赋值运算符 operator=
        hp = h;
    }
};
~~~

**初始化列表写法**

~~~c++
class Hero {
    string name;
    int hp;
public:
    // 直接调用 name 的带参构造函数
    Hero(string n, int h) : name(n), hp(h) {} 
};
~~~

### 效率差异

**赋值写法**：`string name` 先被**默认构造**（空字符串），然后在函数体里被**赋值**（拷贝字符串）。

**列表写法**：`string name` 直接以参数 `n` 进行**构造**。

### 1.const成员变量

**规则：** `const` 变量一旦初始化，就不能被修改。

❌ 错误做法：在函数体中赋值

~~~c++
class Hero {
    const int id; // 身份证号，不可修改
public:
    Hero(int inputId) {
        // 错误！
        // 此时 id 已经出生了（虽然是随机值），但在这一行，你试图修改一个 const 变量。
        id = inputId; 
    }
};
~~~

**编译报错：** `assignment of read-only member 'Hero::id'`

✅ 正确做法：初始化列表

~~~c++
class Hero {
    const int id;
public:
    Hero(int inputId) : id(inputId) { // 在出生的一瞬间赋予它 inputId
        // 进入这里时，id 已经是 inputId 了，且受到 const 保护
    }
};
~~~

### 2.引用成员&

**规则：** 引用必须在定义时绑定到一个实体，且**不能悬空**，也不能在后续改变指向。

❌ 错误做法：在函数体中赋值

~~~c++
class Shield {
public:
    int defense = 10;
};

class Hero {
    Shield & myShield; // 引用类型成员
public:
    Hero(Shield & s) {
        // 错误！
        // 编译器会问：在进入大括号之前，myShield 绑定到谁了？
        // 答案是没人。C++ 不允许存在未初始化的引用。
        myShield = s; 
    }
};
~~~

**编译报错：** `uninitialized reference member 'Hero::myShield'`

✅ 正确做法：初始化列表

~~~c++
class Hero {
    Shield & myShield;
public:
    // 在 myShield 存在的瞬间，就让它指向 s
    Hero(Shield & s) : myShield(s) { } 
};
~~~

### 3.没有默认构造函数的类成员

**规则：** 如果你的成员变量是另一个类的对象，且那个类**必须要参数才能创建**，你就必须在列表里喂给它参数。

想象一下，`Hero`（英雄）类里有一个成员是 `Pet`（宠物）。 `Pet` 类规定：**创建宠物必须指定名字，不能创建无名宠物。**

如果你不在列表里初始化 `Pet`，编译器在“隐形初始化阶段”会试图调用 `Pet` 的**默认构造函数**（无参构造），结果发现找不到，直接罢工。

假设有Pet类

~~~c++
class Pet {
public:
    // 只有一个带参构造函数，意味着编译器不会生成默认无参构造函数
    Pet(string name) { cout << "宠物 " << name << " 诞生"; }
};
~~~

❌ 错误做法：试图在体内构造

~~~c++
class Hero {
    Pet myPet;
public:
    Hero(string petName) {
        // 错误！
        // 编译器在进入 { 之前，试图执行 myPet()，但在 Pet 类里找不到无参构造函数。
        myPet = Pet(petName); 
    }
};
~~~

**编译报错：** `no matching function for call to 'Pet::Pet()'`

✅ 正确做法：初始化列表

~~~c++
class Hero {
    Pet myPet;
public:
    // 显式告诉编译器：在创建 myPet 时，请调用带 string 参数的构造函数
    Hero(string petName) : myPet(petName) { }
};
~~~

### 4.基类构造函数

如果你定义的类（子类）继承自另一个类（父类），且**父类没有默认构造函数**，你也必须在初始化列表中显式调用父类的构造函数。

~~~c++
class Person { // 父类
public:
    Person(string name) { ... } // 只有带参构造
};

class Hero : public Person { // 子类
public:
    // 必须在列表里先构造父类部分
    Hero(string name) : Person(name) { 
        // ...
    }
};
~~~

### 对比初始化域赋值

| **场景**   | **代码**      | **动作**                                                 | **针对 const/引用**               |
| ---------- | ------------- | -------------------------------------------------------- | --------------------------------- |
| **初始化** | `int a = 10;` | 申请内存的同时，把 10 放进去。                           | **合法** (`const int a = 10;`)    |
| **赋值**   | `a = 10;`     | 内存早就有了（里面可能是旧值），现在把 10 搬过去覆盖它。 | **非法** (`const` 内存禁止被覆盖) |

编译器视角：

~~~c++
class Hero {
    const int id;
    int& ref;
public:
    Hero(int n, int& r) : id(n), ref(r) { // 初始化列表
        // 构造函数体
        cout << "Done";
    }
};
~~~

当编译器看到 `Hero h(100, x);` 时，它在底层生成的伪代码流程如下：

1. **分配内存**：`malloc(sizeof(Hero))`。此时内存里有一块地盘叫 `id`，一块地盘叫 `ref`，但都是垃圾值。
2. **执行初始化列表（关键时刻！）**：
   - 编译器在 `id` 的内存地址上，直接写入 `100`。
     - *语义检查*：这是 `const int id = 100;` 吗？是的。**通过！**
   - 编译器在 `ref` 的内存地址上，直接写入 `x` 的地址。
     - *语义检查*：这是 `int& ref = x;` 吗？是的。**通过！**
3. **进入构造函数体 `{ ... }`**：
   - 此时 `id` 和 `ref` 已经**完全诞生**了。
   - 如果你在这里写 `id = 200;`，编译器会看成：`const int id` 已经存在了，你试图修改它。**报错！**

如果成员变量不是 `int`，而是一个类 `string`，区别就更大了。

- **赋值（函数体内）**：

  ```c++
  Hero() { name = "Cloud"; }
  ```

  相当于：

  1. `string name;` (先调用默认构造函数，造一个空字符串 "")
  2. `name.operator=("Cloud");` (再调用赋值运算符，把 "" 变成 "Cloud")

  - **做了两次工，且前提是 string 支持被修改。**

- **初始化列表**：

  ```c++
  Hero() : name("Cloud") {}
  ```

  相当于：

  1. `string name("Cloud");` (直接调用带参构造函数)

  - **只做一次工。**

## 拷贝构造函数

除了默认构造函数，C++ 还有一个极其重要的构造函数——**拷贝构造函数**。

### 定义

当你用一个已有的对象去创建一个新对象时，调用的就是它。
~~~c++
Hero h1("Cloud", 100);
Hero h2 = h1; // 调用拷贝构造函数！
// 或者 Hero h2(h1);
~~~

原型通常是：`ClassName(const ClassName & other);`

### 默认行为：浅拷贝

如果您不写拷贝构造函数，编译器会生成一个默认的。它的行为是：**逐个字节拷贝。

- 对于 `int`, `double`：直接拷贝数值。

- 对于 `string`, `vector`：调用它们自己的拷贝构造函数（智能拷贝）。

- **对于指针：** **只拷贝地址！**

假设类里面有一个指针，指向堆内存（`new` 出来的数组）

~~~c++
class Array {
    int* data;
public:
    Array() { data = new int[10]; }
    ~Array() { delete[] data; }
};

int main() {
    Array a; 
    Array b = a; // 默认浅拷贝：b.data = a.data
} // 💥 崩溃！
~~~

**崩溃原因：**

1. **浅拷贝**后，对象 `a` 和对象 `b` 的 `data` 指针指向**同一块**堆内存。
2. 函数结束，`b` 先销毁，调用析构函数 `delete[] data`。内存被释放。
3. `a` 后销毁，再次调用析构函数 `delete[] data`。
4. **Double Free (重复释放)** 导致程序崩溃。

**解决方案：深拷贝** 这时候，你必须**手写拷贝构造函数**，重新申请一块内存，把数据搬过去。

~~~c++
// 手写深拷贝
Array(const Array& other) {
    data = new int[10]; // 1. 申请新内存
    // 2. 拷贝数据内容
    for(int i=0; i<10; i++) data[i] = other.data[i]; 
}
~~~



# this指针

~~~c++
void Hero::takeDamage(int damage) {
    hp -= damage; 
}
~~~

如果有两个对象 `h1` 和 `h2`，都调用 `takeDamage(10)`。代码只有一份，计算机怎么知道 `hp -= damage` 到底是在减 `h1` 的血，还是 `h2` 的血？

**原理**： C++ 编译器会秘密地给每个成员函数传递一个隐藏参数——**指向当前对象的指针**，这就叫 `this` 指针。

上述代码在编译器眼里其实是这样的：

~~~c++
// 伪代码，展示底层逻辑
void Hero_takeDamage(Hero* this, int damage) {
    this->hp -= damage;
}
~~~

**用途**：

1. **区分成员变量和参数**：如果参数也叫 `hp`，你可以写 `this->hp = hp;`。
2. **链式编程 (Chaining)**：返回 `*this`。

~~~c++
// 允许 h.addExp().levelUp().heal(); 这种连写
Hero& train() {
    // 做一些事...
    return *this; // 返回调用这个函数的对象本身
}
~~~

# 对象数组

~~~c++
// 想要一个英雄小队
Hero party[4];
~~~

**底层流程**：

1. 编译器在栈上分配足够容纳 4 个 `Hero` 的空间。
2. **依次**对这 4 个空间调用**默认构造函数**。
   - ⚠️ **重点**：如果你的 `Hero` 类没有默认构造函数，这行代码会直接报错！

~~~c++
Hero party[4] = {
    Hero("Cloud", 100),  // 调用带参构造
    Hero("Tifa", 80),    // 调用带参构造
    // 剩下两个没有显式写，会调用默认构造函数 Hero()
};
~~~

# 类作用域

## 作用域为类的常量

**痛点**：想定义一个数组，数组长度是类的所有对象通用的常量。

~~~c++
class Hero {
    const int MAX_SKILLS = 10; // ❌ 错误（在老标准中）
    int skills[MAX_SKILLS];    // 编译器不知道 10 是多少，因为类声明只是蓝图，没分配内存
};
~~~

### 解决方法1：enum

~~~c++
class Hero {
    enum { MAX_SKILLS = 10 }; // 这里的 MAX_SKILLS 只是个符号常量
    int skills[MAX_SKILLS];   // ✅ 可行
};
~~~

枚举在编译期间会被替换为整数

### 解决方法2：static const

~~~c++
class Hero {
    static const int MAX_SKILLS = 10; // 静态常量，属于类，不属于对象
    int skills[MAX_SKILLS];           // ✅ 可行
};
~~~

## 作用域内枚举

传统的 `enum` 有个大问题：**名字污染**。 `enum Egg { Small, Medium, Large };` `enum Tshirt { Small, Medium, Large };` 编译器会报错，因为两个 `Small` 都在同一个作用域里。

~~~c++
enum class Egg { Small, Medium, Large };
enum class Tshirt { Small, Medium, Large };

Egg e = Egg::Small;       // ✅ 必须带帽子（作用域）
Tshirt t = Tshirt::Small; // ✅ 互不冲突
~~~

