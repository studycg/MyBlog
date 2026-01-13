# 继承

继承的核心意义在于表达 **“是一种 (is-a)”** 的关系。

- 战士 **is a** 角色。
- 圆形  **is a** 形状。

~~~c++
// 基类 (Base Class)
class Character {
public:
    string name;
    int hp;
    Character(string n, int h) : name(n), hp(h) {}
    void move() { cout << "Walking..." << endl; }
};

// 派生类 (Derived Class) : public 继承
class Warrior : public Character {
public:
    int rage; // 战士特有的属性：怒气
    // 构造函数需要特殊处理（见下文）
    Warrior(string n, int h, int r); 
    void slash() { cout << "Slash!" << endl; } // 战士特有的技能
};
~~~

## 传递链

这是继承中最容易写错的地方。 **原则：** 孩子不能直接初始化父母的私有成员。必须调用父母的构造函数来完成。

- **构造顺序**：先基类，后派生类。（像盖房子，先打地基 `Character`，再盖二楼 `Warrior`）。
- **析构顺序**：先派生类，后基类。（像拆房子，先拆二楼，再拆地基）。

~~~c++
// ❌ 错误写法
Warrior::Warrior(string n, int h, int r) {
    name = n; // 错误！如果 name 是 private，你访问不了。即便能访问，也不规范。
    hp = h;
    rage = r;
}

// ✅ 正确写法：使用成员初始化列表
Warrior::Warrior(string n, int h, int r) 
    : Character(n, h), // 1. 把 n 和 h 扔给基类构造函数去处理
      rage(r)          // 2. 自己只处理 rage
{ 
    // 函数体
}
~~~

# 多态与虚函数

## 静态联编vs动态联编

~~~c++
Character* pChar;
Warrior w("Cloud", 100, 50);
pChar = &w; // ✅ 基类指针可以指向派生类对象（向上强制转换）

pChar->move(); // 调用的是谁的 move？
~~~

**静态联编**：默认情况下，编译器看 `pChar` 的类型是 `Character*`，所以它直接生成调用 `Character::move()` 的指令。编译器不管你实际指向的是不是 Warrior。

**问题**：如果 `Warrior` 重写了 `move`（比如变成了“跑”），用基类指针调用时，依然会执行基类的“走”。这不符合直觉。

## 虚函数

要解决这个问题，只需要在基类的函数前加上 **`virtual`** 关键字。

~~~c++
class Character {
public:
    // 虚函数：告诉编译器，不要急着绑定，运行时再看是谁
    virtual void move() { cout << "Walking..." << endl; }
};

class Warrior : public Character {
public:
    // override 是 C++11 新增的，用来检查你是不是真的重写了基类函数（防止拼写错误）
    void move() override { cout << "Running!" << endl; } 
};
~~~

一旦加上 `virtual`，编译器就会采用 **动态联编**。 `pChar->move()` 会在**程序运行时**检查 `pChar` 到底指向什么对象。如果是 `Warrior`，就调用 `Warrior::move()`。

## 虚函数表

C++如何实现“运行时知道调用哪个函数”？**虚函数表**

**vtable (虚表)**：

- 编译器会为每个**含有虚函数的类**（比如 `Character` 和 `Warrior`）分别生成一张**静态表**。
- 这张表里存的是**函数指针数组**。
- `Character` 的表里存着 `&Character::move`。
- `Warrior` 的表里存着 `&Warrior::move`。

**vptr (虚表指针)**：

- 编译器会在**每个对象**的内存头部，偷偷插入一个隐藏的指针成员，叫做 `vptr`。
- 当你创建 `Warrior w` 对象时，它的 `vptr` 会被初始化指向 `Warrior` 类的 vtable。

**调用过程**： 当你执行 `pChar->move()` 时，编译器生成的汇编代码不再是直接 `call address`，而是变成了类似这样的逻辑：

~~~c++
// 伪代码：动态联编的底层实现
// 1. 拿出对象里的 vptr
FunctionTable* tbl = pChar->vptr; 
// 2. 从表里找到 move 函数的地址 (假设 move 是第 0 个虚函数)
FunctionPtr func = tbl[0];
// 3. 调用它
func(pChar);
~~~

**空间成本**：每个对象多了一个指针大小（8字节），每个类多了一张表。

**时间成本**：虚函数调用需要**多一次内存寻址**（查表），所以比普通函数稍微慢一点点（微秒级差异，但在高频循环中要注意）。

**构造函数不能是虚函数**：因为在构造函数执行时，对象的 `vptr` 还没初始化好呢！

### 举个例子

**1. 编译器为每个类生成虚函数表**

~~~c++
class Base {
public:
    virtual void func1() { cout << "Base::func1" << endl; }
    virtual void func2() { cout << "Base::func2" << endl; }
    void func3() { cout << "Base::func3" << endl; } // 非虚函数
    int a = 1;
};

class Derived : public Base {
public:
    // 重写 func1
    virtual void func1() override { cout << "Derived::func1" << endl; }
    // 增加新的虚函数
    virtual void func4() { cout << "Derived::func4" << endl; }
    int b = 2;
};
~~~

Base类的虚表：

- 这是一个在编译期就确定好的静态数组，存储在程序的只读数据段。
- 表里按虚函数声明的顺序，存放着指向该函数最终实现的指针。
- Base的虚表内容：[ &Base::func1, &Base::func2 ]

Derived类的虚表：

- 首先，它会复制一份其直接基类 Base的虚表。
- 然后，用派生类重写的函数地址替换掉对应位置的指针。
- 最后，在表尾追加派生类新定义的虚函数。

Derived的虚表内容：[ &Derived::func1, &Base::func2, &Derived::func4 ]

- 注意：func1被重写了，所以地址变成了 Derived::func1。

- func2没有被重写，所以还是 Base::func2。

- func4是新增的，被追加在后面。

**2.对象创建时设置vptr**

当一个对象被创建时（无论是 `Base`对象还是 `Derived`对象），编译器会在其构造函数中，在初始化成员变量之前，插入一行“隐式代码”，将这个对象的 **vptr** 设置为**指向它所属类的虚表**。

~~~c++
//Base对象的 内存
|  vptr  | ---> 指向 Base 的虚表
|   a    | (int)
//Derived对象的 内存
|  vptr  | ---> 指向 Derived 的虚表
|   a    | (从Base继承的成员)
|   b    | (Derived自己的成员)
~~~

**3.通过指针/引用调用函数**

~~~c++
Base* p = new Derived(); // p 是Base指针，但指向一个Derived对象
p->func1(); // 调用哪个函数？
~~~

1. **获取vptr**：编译器看到 `p->func1()`，知道 `func1`是虚函数。它不会直接去调用 `Base::func1`，而是会生成代码，先从 `p`指向的对象内存的**起始位置**（即 `this`指针的位置）读取 **vptr**。
2. **查找虚表**：通过这个 vptr，找到这个对象**实际所属类**的虚表（对于 `Derived`对象，就是 Derived 的虚表）。
3. **定位函数指针**：在虚表中，根据 `func1`在基类中定义的**顺序**（这里是第一个）找到对应的函数指针（现在是 `&Derived::func1`）。
4. **调用函数**：最后，通过这个函数指针进行调用，即 `Derived::func1()`。

**结果**：打印出 `"Derived::func1"`。即使你用的是 `Base*`，调用的依然是对象实际类型 (`Derived`) 的函数。

~~~c++
代码：
Base* p = new Derived();
p->func1();

内存与流程：

        p (Base*)
         |
         v
+----------------------+
|  Derived 对象        |
| +------------------+ |
| | vptr             |----+   +--------------------------> Derived 类的虚表
| |------------------|    |   |                            +-------------------+
| | int a (from Base)|    |   |                            | &Derived::func1 | <- 调用这个！
| |------------------|    |   |                            | &Base::func2    |
| | int b (from Self)|    |   |                            | &Derived::func4 |
| +------------------+    |   |                            +-------------------+
+----------------------+  |   |
                          |   |
                          +---+
~~~

**重要对比**：

- `p->func3()`：`func3`不是虚函数。编译器在编译时看到 `p`是 `Base*`，就直接决定了调用 `Base::func3()`。这叫“**早期绑定**”或“**静态绑定**”。
- `p->func4()`：**编译错误**！因为编译器在编译时，只认 `p`的类型（`Base*`）。它会去检查 `Base`类的定义，发现根本没有 `func4`这个成员函数，所以报错。**虚表机制只能在已有的虚函数框架下工作，不能无中生有。**

~~~c++
Base* p = new Derived();

p->func1();  // ✅ 可以，因为Base声明了func1
p->func2();  // ✅ 可以，因为Base声明了func2
p->func4();  // ❌ 编译错误！Base不知道有func4
~~~

~~~c++
class Base {
public:
    virtual void func1() { cout << "Base::func1" << endl; }
    virtual void func2() { cout << "Base::func2" << endl; }
};

class Derived : public Base {
public:
    virtual void func1() override { cout << "Derived::func1" << endl; }
    virtual void func4() { cout << "Derived::func4" << endl; } // 新增
};

class GrandChild : public Derived {
public:
    virtual void func4() override { cout << "GrandChild::func4" << endl; }
};

int main() {
    // 场景1：通过Derived指针调用func4
    Derived* d = new GrandChild();
    d->func4();  // ✅ 输出 "GrandChild::func4"
    
    // 场景2：通过Base指针调用func4 ❌
    Base* b = new GrandChild();
    // b->func4();  // 编译错误！Base没有func4
    
    // 场景3：即使实际对象是GrandChild，Base指针也不能调用func4
    Base* b2 = d;  // 向上转型
    // b2->func4();  // 同样编译错误！
    
    // 场景4：但多态对Base声明的函数仍然有效
    b2->func1();  // ✅ 输出 "Derived::func1" (从Derived继承的重写)
    
    return 0;
}
~~~

~~~c++
Base* p = new Derived();

// 方法1：使用dynamic_cast
if (Derived* d = dynamic_cast<Derived*>(p)) {
    d->func4();  // ✅ 可以调用
}

// 方法2：先转为实际类型
Derived* d = static_cast<Derived*>(p);  // 不安全，但如果你确定类型
d->func4();  // ✅
~~~

## 虚析构函数

如果一个类要作为基类，它的析构函数必须是 `virtual` 的。

~~~c++
Character* p = new Warrior("Cloud", 100, 50);
delete p; // 💣 危险！
~~~

**如果析构函数不是 virtual**：编译器只看 `p` 的类型是 `Character*`，所以它只调用 `~Character()`。

- 结果：`Warrior` 特有的成员（比如 `rage` 如果申请了堆内存）根本没被清理！**内存泄漏**。

**如果析构函数是 virtual**：通过 vtable 机制，编译器知道它实际是 `Warrior`，会先调用 `~Warrior()`，然后再自动调用 `~Character()`。**完美释放**。

# protected

| **访问修饰符** | **基类自己能用吗？** | **派生类能用吗？** | **外部世界 (main) 能用吗？** |
| -------------- | -------------------- | ------------------ | ---------------------------- |
| **public**     | ✅                    | ✅                  | ✅                            |
| **protected**  | ✅                    | **✅ (特权)**       | ❌                            |
| **private**    | ✅                    | **❌ (拒绝)**       | ❌                            |

**慎用 protected 数据**

虽然把成员变量设为 `protected` 很方便（派生类可以直接 `x = 10`，不用写 `setX(10)`），但这**破坏了封装性**。 如果基类决定把 `x` 的含义改了，或者改名了，所有访问它的派生类代码全都要重写。 **最佳实践**：

- **数据成员**依然保持 `private`。
- 提供 `protected` 的访问函数（get/set），供派生类内部使用。

# 抽象基类

C++ 通过**纯虚函数**来定义抽象基类。语法是在虚函数后面写 `= 0`。

~~~c++
class Shape {
public:
    // 纯虚函数：我不知道怎么算面积，但我要求所有的子类必须实现它！
    virtual double area() const = 0; 
    
    virtual ~Shape() {} // 记得写虚析构！
};
~~~

1. **不能实例化**：`Shape s;` ❌ 编译报错。
2. **强制实现**：如果派生类 `Circle` 继承了 `Shape` 但没有实现 `area()`，那 `Circle` 也会变成抽象基类，无法实例化。

这强制了**接口的统一**：所有继承 `Shape` 的东西，我都确信它一定有一个 `area()` 方法能调用。

# 继承和动态内存分配

## 情况 1：派生类不使用 new

假设基类 `Base` 用了 `new`（有析构、拷贝构造、赋值重载），但派生类 `Derived` 只增加了一些普通的 `int` 或 `double` 成员。

**结论**：**你不需要为派生类写任何特殊函数！**

- **析构**：编译器生成的默认析构函数会自动销毁 `int`，然后自动调用 `Base::~Base()`。
- **拷贝构造**：编译器生成的默认拷贝构造会自动拷贝 `int`，然后自动调用 `Base` 的拷贝构造。
- **赋值**：同上。

## 情况 2：派生类也使用了 new

假设派生类 `Derived` 自己也申请了一块堆内存（比如也有个 `char* style`）。

**结论**：**必须显式定义析构、拷贝构造、赋值运算符 (Rule of Three)。** 且必须**手动处理基类部分**。

**1.析构函数**

~~~c++
~Derived() {
    delete[] style; // 1. 释放派生类自己的内存
    // 2. 基类的内存怎么办？
    // 不要管！编译器会自动调用 ~Base()。这是唯一自动的地方。
}
~~~

**2.拷贝构造函数(手动调用父类拷贝构造)**

~~~c++
Derived(const Derived& other) 
    : Base(other), // ⚠️ 关键！显式调用基类的拷贝构造函数，把基类部分拷过去
      style(new char[strlen(other.style) + 1]) 
{
    strcpy(style, other.style); // 处理自己的部分
}
~~~

**3.赋值运算符(手动调用父类赋值运算)**

~~~c++
Derived& operator=(const Derived& other) {
    if (this == &other) return *this;

    // 1. ⚠️ 关键！手动让基类去赋值
    // 必须用作用域解析运算符，否则就是递归调用自己（死循环）
    Base::operator=(other); 

    // 2. 处理派生类自己的内存（标准三步走）
    delete[] style;
    style = new char[strlen(other.style) + 1];
    strcpy(style, other.style);

    return *this;
}
~~~

**那么我就要想 还有这种写法？**

但在**继承体系**中，或者**类成员是 `const`/引用**时，拷贝构造函数**必须**使用冒号初始化列表

~~~c++
class Warrior : public Hero {
    int rage;
public:
    // 拷贝构造函数
    Warrior(const Warrior& other) {
        // 😱 灾难发生在这里！
        // 在进入大括号之前，编译器必须先构造父类部分。
        // 因为你没在冒号里指定，编译器只能默默调用 Hero() 无参构造函数（如果有的话）。
        // 结果：新战士的 name 变成了空，hp 变成了 0（或者垃圾值）。父类的数据丢失了！
        
        rage = other.rage; // 只拷贝了子类的数据
    }
};
~~~

正确写法

这是最关键的。当 `Warrior` **继承** `Hero` 时，`Warrior` 的肚子里包含了一个 `Hero` 的部分。

当你拷贝 `Warrior` 时，你不仅要拷贝 `Warrior` 自己的数据（比如 `rage`），**还得负责拷贝那个 `Hero` 的数据**。

~~~c++
class Warrior : public Hero {
    int rage;
public:
    // 拷贝构造函数
    // : Hero(other) 的意思是：
    //   把 other 对象（虽然它是 Warrior 类型）切片成 Hero 类型，
    //   传给 Hero 的拷贝构造函数，用来初始化我的父类部分。
    Warrior(const Warrior& other) 
        : Hero(other),  // 👈 核心：手动调用父类拷贝构造
          rage(other.rage) // 👈 初始化自己的成员
    { 
        // 函数体为空
    }
};
~~~

## why？
