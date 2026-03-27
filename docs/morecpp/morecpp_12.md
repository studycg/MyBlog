> [!NOTE]
>
> C++类型转换

# C语言强制类型转换

C语言的显式类型转换：`(指定类型)变量`的方式进行类型转换。

C语言的隐式类型转换：编译器在编译阶段自动进行，能转就转，否则编译失败。

只有相近类型才能隐式转换，比如，int和double都是数值，只不过它们表示的范围和精度不同，但指针表示的是地址，因此整形和指针不会隐式转换，如果需要只能显示转化。

```c++
int main()
{
	//隐式类型转换
	int i = 1;
	double d = i;
	cout << i << endl;
	cout << d << endl;

	//显式类型转换
	int* p = &i;
	int address = (int)p;
	cout << p << endl;
	cout << address << endl;
	return 0;
}
```

# C++强制类型转换

## static_cast

编译时处理，不进行RTTI

`static`用于相近类型之间的转换，编译器隐式的执行任何类型转换都可用`static_cast`，但它不能用于两个不同之间的类型转换。

```c++
int main()
{
	double d = 12.34;
	int a = static_cast<int>(d);
	cout << a << endl;

	int* p = &a;
	// int address = static_cast<int>(p); //error
	return 0;
}
```

多重继承下，`static_cast`会根据继承顺序自动偏移指针地址，而`reinterpret_cast`不会。

**指针偏移发生在什么时候？**

发生在**派生类指针->基类指针向上转换**的时候，或在**多重继承下进行向下转移**的时候。

```c++
class A { int a; virtual void funcA() {} };
class B { int b; virtual void funcB() {} };
class C : public A, public B { int c; };
```

在内存布局中，`C` 对象内部先放 `A` 的部分，再放 `B` 的部分。

- 如果你有一个 `C* pC`，它的地址指向对象的开头（也是 `A` 的开头）。
- 当你执行 `B* pB = static_cast<B*>(pC);` 时，编译器必须将地址**增加** `sizeof(A)`，这样 `pB` 才能正确指向 `B` 的子对象部分。

**向上转换（C\* -> B*）**：指针地址会增加（跳过 A 的部分）。

**向下转换（B\* -> C*）**：指针地址会减少（回到 C 的起点）。

如果地址不懂，直接把 `B*` 的地址当 `C*` 用，如果你访问 `C` 的成员，数据就会全部错位！

这和**Thunk**有关

 **Thunk** 是一段极小的汇编代码，用于在调用虚函数时调整 `this` 指针。

- 如果你通过 `B* pB` 调用 `C` 重写的虚函数，但该虚函数期望的 `this` 指针是 `C*`（即对象的起始地址）。
- 此时 vtable 中存储的不是函数的直接地址，而是一个 **Thunk 签名**。它先执行指令 `sub esp, offset`（调整 `this` 指针到 `C` 的开头），然后再跳转到真正的函数实现。

> `static_cast`是如何计算偏移的？

```c++
class BaseA { int a; };        // 占用 4 字节
class BaseB { int b; };        // 占用 4 字节
class Derived : public BaseA, public BaseB { int d; };
```

编译器查表：它查看 `Derived` 的定义，发现 `BaseB` 相对于 `Derived` 起始地址的偏移量（Offset）是 4（跳过 `BaseA` 的大小）。

指令生成：编译器不会在运行时去找偏移，而是在编译时直接生成一条汇编指令：`lea rax, [rdx + 4]`（即：目标地址 = 原地址 + 4）。

如果你确定这个 `BaseB*` 实际上指向的是一个 `Derived` 对象，执行 `static_cast<Derived*>(b)`。 编译器会反向操作：将地址 **减去 4**。

**注意**：这就是为什么 `static_cast` 不安全的原因。如果你传进来的 `BaseB*` 真的只是一个单纯的 `BaseB` 对象，而不是 `Derived` 的一部分，编译器依然会死板地执行“减 4”操作，导致指针指向了一块未知的非法区域。

## reinterpret_cast

最危险的二进制重解释

不产生任何机器指令，只是**告诉编译器将此处内存当成另外一种类型来看待。**

`reinterpret_cast`用于两个不相关类型之间的转换

```c++
int main()
{
	int a = 10;
	int* p = &a;
	int address = reinterpret_cast<int>(p);
	cout << address << endl;
	return 0;
}
```

`reinterpret_cast`还有很bug的用法，将带参数带返回值的函数指针转换成无参无返回值的函数指针，并且还可以用转换后函数指针调用这个函数。

```c++
typedef void(*Func)();
int DoSomething(int i){
    cout << "DoSomething" << i << endl;
    return 0;
}
int main(){
    Func f = reinterpret_cast<Func>(DoSomething);
    f();
    return 0;
}
```

用转换后的函数指针调用该函数时没有传入参数，因此这里打印出参数`i`的值是一个随机值。

## const_cast

唯一能剥离`const`和`volatile`的转换。

不改变对象本身，仅改变编译器对内存块读写权限认识。

`const_cast`用于删除变量的const属性，转换后就可以对const变量的值进行修改。

```c++
int main()
{
	const int a = 2;
	int* p = const_cast<int*>(&a);
	*p = 3;
	cout << a << endl;  //2
	cout << *p << endl; //3
	return 0;
}
```

1. 代码中用const_cast删除了变量a的地址的const属性，这时就可以通过这个指针来修改变量a的值。

2. 由于编译器认为const修饰的变量是不会被修改的，因此会将const修饰的变量存放到寄存器当中，当需要读取const变量时就会直接从寄存器中进行读取，而我们修改的实际上是内存中的a的值，因此最终打印出a的值是未修改之前的值。

3. 如果不想让编译器将const变量优化到寄存器当中，可以用volatile关键字对const变量进行修饰，这时当要读取这个const变量时编译器就会从内存中进行读取，即保持了该变量在内存中的可见性。

`const_cast`与常量折叠

编译器在处理 `const int x = 10` 时，认为 `x` 的值永远不会改变。于是，它会把代码中所有出现 `x` 的地方直接替换为立即数 `10`。这就像文本替换一样，根本不再去内存里取值。

由于你修改了一个原本声明为 `const` 的对象，这在 C++ 标准中属于 **UB**。在某些平台上（如某些主机的只读内存区），这段代码甚至会直接导致 Segment Fault（段错误） 崩溃。

## dynamic_cast

为多态设计，依赖RTTI，执行向下转换。

`dynamic_cast`用于将父类的指针(或引用)转换成子类的指针(或引用)。

> 向下转型的安全性

**向上转型：** 子类的指针（或引用）→ 父类的指针（或引用）。

**向下转型：** 父类的指针（或引用）→ 子类的指针（或引用）。

向上转型就是所说的切割/切片，是语法天然支持的，不需要进行转换，而向下转型是语法不支持的，需要进行强制类型转换。

向下转型的安全问题：

1. 如果父类的指针（或引用）指向的是一个父类对象，那么将其转换为子类的指针（或引用）是不安全的，因为转换后可能会访问到子类的资源，而这个资源是父类对象所没有的。
2. 如果父类的指针（或引用）指向的是一个子类对象，那么将其转换为子类的指针（或引用）则是安全的。

C风格强制转换：**C风格的强制类型转换是不安全的**，因为此时无论父类的指针指向的是父类对象还是子类对象，都会转化。

**dynamic_cast进行向下转型是安全的**，但如果父类的指针（或引用）指向的是父类对象那么dynamic_cast会转换失败并返回一个空指针。

> `dynamic_cast`是如何做到RTTI的？
>
> `dynamic_cast`运行时会查虚表，vtable 的偏移量处通常存放着 `type_info` 结构的指针。
>
> `dynamic_cast` 会遍历类继承树来确认转换合法性。

在`vtable`的负偏移位置（通常是虚函数地址的前一个槽位）存放着一个`type_info`对象指针，

`type_info`存储了：类的名称，类之间的继承关系（父类列表，偏移量等）。

当执行了`dynamic_cast<Derived*>(base_ptr)`时：

1. `base_ptr`找到对象的vptr，进而找到vtable。
2. 从`vtable`中提取`type_info`。检查当前对象的 `type_info` 是否就是目标类型，如果不是，则顺着 `type_info` 中记录的继承链向上查找，直到找到匹配项 `Derived`。
3. 如果匹配成功，根据 `type_info` 记录的偏移量计算出目标类型的起始地址；否则返回 `nullptr`。

```c++
class A
{
public:
	virtual void f()
	{}
};
class B : public A
{};
void func(A* pa)
{
	B* pb1 = (B*)pa;               //不安全
	B* pb2 = dynamic_cast<B*>(pa); //安全

	cout << "pb1: " << pb1 << endl;
	cout << "pb2: " << pb2 << endl;
}
int main()
{
	A a;
	B b;
	func(&a);
	func(&b);
	return 0;
}
//如果传入func函数的是子类对象的地址，那么在转换后pb1和pb2都会有对应的地址，但如果传入func函数的是父类对象的地址，那么转换后pb1会有对应的地址，而pb2则是一个空指针。
```

**dynamic_cast只能用于含有虚函数的类**，因为运行时类型检查需要运行时的类型信息，而这个信息是存储在虚函数表中的，只有定义了虚函数的类才有虚函数表。

因为 RTTI 信息存储在虚函数表（vtable）中。如果没有虚函数，类就没有虚表指针（vptr），也就无法在运行时获取具体的类型信息。

> `dynamic_cast`可以向上转换吗？

可以，但是没必要。用`static_cast`就行。

# explicit

`explicit`用来修饰构造函数，从而禁止参数构造函数的隐式转换。

```c++
class A
{
public:
	explicit A(int a)
	{
		cout << "A(int a)" << endl;
	}
	A(const A& a)
	{
		cout << "A(const A& a)" << endl;
	}
private:
	int _a;
};
int main()
{
	A a1(1);
	//A a2 = 1; //error
	return 0;
}
```

在语法上`A a2 = 1`等价于

```c++
A tmp(1);  //先构造
A a2(tmp); //再拷贝构造
```

在早期的编译器中，当编译器遇到A a2 = 1这句代码时，会先构造一个临时对象，再用这个临时对象拷贝构造a2。

现在的编译器已经做了优化，当遇到A a2 = 1这句代码时，会直接按照A a2(1)的方式进行处理，这也叫做隐式类型转换。

但对于单参数的自定义类型来说，A a2 = 1这种代码的可读性不是很好，因此可以用explicit修饰单参数的构造函数，从而禁止单参数构造函数的隐式转换。

# RTTI运行时类型识别

C++使用：

`typeid`：在运行时识别对象的类型

`dynamic_cast`：在运行时识别一个父类指针/引用指向的是父类对象还是子类对象

`type_info`：类型信息对象

# 一些问题

> 在游戏场景管理中，如果我有一个 `std::vector<Entity*>`，里面混合了 `Player` 和 `NPC`。为了追求极致性能，我不想使用 `dynamic_cast` 来区分它们，你会推荐什么方案？为什么这种方案比 `dynamic_cast` 快

通常使用Type ID（枚举类型）

```c++
enum class EntityType { Player, NPC, Enemy };

class Entity {
public:
    EntityType type; // 在构造函数中初始化
    Entity(EntityType t) : type(t) {}
    virtual ~Entity() {}
};

class Player : public Entity {
public:
    Player() : Entity(EntityType::Player) {}
    void Heal() { /* ... */ }
};

// 转换逻辑
void Process(Entity* e) {
    if (e->type == EntityType::Player) {
        // 确定是 Player，直接用 static_cast，省去 RTTI 查找开销
        static_cast<Player*>(e)->Heal();
    }
}
```

为什么这个快？

**CPU 友好**：`dynamic_cast` 需要通过 vptr 找 vtable，再找 `type_info`，最后可能还要遍历继承树（涉及多次内存间接访问，易导致 Cache Miss）。

**分支预测**：简单枚举比较（`e->type == ...`）对 CPU 的分支预测器非常友好，几乎是瞬时完成。

> 在 C++ 中，`const_cast` 只能改变指针或引用的 `const` 属性。如果我有一个原本就被定义为 `const int x = 10;` 的变量，我强行用 `const_cast` 拿到它的非 `const` 指针并修改它的值，这会发生什么？从编译器优化的角度解释原因。

常量折叠：编译器在处理 `const int x = 10` 时，认为 `x` 的值永远不会改变。于是，它会把代码中所有出现 `x` 的地方直接替换为立即数 `10`。这就像文本替换一样，根本不再去内存里取值。

内存行为：`const_cast` 确实让你获得了修改那块内存的权限，内存里的值确实变成了 `20`。

未定义行为：由于你修改了一个原本声明为 `const` 的对象，这在 C++ 标准中属于 UB。某些平台可能直接报错。

> 在游戏客户端开发中，我们经常需要处理网络同步。假设你收到一个字节流 `char* buffer`，里面存储了一个 `PlayerState` 结构体的数据。你会选择使用 `static_cast` 还是 `reinterpret_cast` 将这个 `char*` 转换为 `PlayerState*`？为什么？在这种场景下，需要特别注意内存的什么特性（提示：跟字节对齐有关）？

`tatic_cast` 要求转换的类型之间必须有某种“隐式转换”关系（如继承、基本类型转换）。而 `char*`（字节级指针）和自定义结构体 `PlayerState*` 之间是完全没有逻辑联系的。

必须使用`reinterpret_cast`，如果PlayState不在Buffer的开头，通常使用指针算术来解决。`auto* state = reinterpret_cast<PlayerState*>(buffer + offset);`。

> 在多重继承中，既然 `static_cast` 只是简单的加减地址，那如果我使用 `void*` 作为中转站，会发生什么灾难？ 比如：`Derived* d = new Derived(); void* v = d; BaseB* b = static_cast<BaseB*>(v);` 这段代码得到的 `b` 指针还能正常工作吗？为什么？

`void*` 被称为**泛型指针**或**原始指针**。

- 本质：它仅仅是一个**内存地址数值**（在 64 位系统下就是一个 8 字节的数字）。
- 特性：它不包含任何类型信息。编译器不知道这块地址存的是一个整数、一个字符串，还是一个复杂的 `Derived` 对象。
- 局限：你不能对 `void*` 进行解引用（因为不知道取多少字节），也不能进行指针算术（因为不知道步长是多少）。

```c++
Derived* d = new Derived(); 
void* v = d;                        // 信息丢失！只剩下一个起始地址
BaseB* b = static_cast<BaseB*>(v);  // 危险！
```

时的 `b` 实际上指向了 `Derived` 对象的开头（即 `BaseA` 的位置）。当你尝试通过 `b->funcB()` 调用函数或访问 `b->memberB` 时，程序会去 `BaseA` 的内存区域读取数据。

- 如果访问的内存恰好非法，程序崩溃。
- 如果访问的内存合法但数据错乱（例如把 A 的成员变量当成 B 的），程序会产生诡异的 Bug，这是游戏开发中最难调试的内存污染。

错误路径：`Derived*` -> `void*` -> `BaseB*` （偏移量丢失，导致指向错误位置）。

正确路径：`Derived*` -> `BaseB*` -> `void*` -> `BaseB*` （在进入 `void*` 之前，先由编译器完成正确的偏移）。（有点脱裤子放屁的感觉）

> 现在有一个非常棘手的情况：你在维护一个老旧的游戏引擎，里面大量使用了 `void*` 来传递消息。 如果你手上只有一个 `void*` 指针，且你**百分之百确定**它原本是一个 `Derived*` 类型，但你现在需要调用它父类 `BaseB` 的成员函数。 为了确保指针偏移正确，你该如何编写这段转换代码？

先将void* reinterpret_cast为Derived再static_cast为Base

```c++
void* v = get_some_data(); // 假定它原本是 Derived*

// 1. 还原身份 (不产生指令偏移)
Derived* d = reinterpret_cast<Derived*>(v); 

// 2. 重新寻址 (编译器根据 Derived 布局计算 BaseB 的偏移量)
BaseB* b = static_cast<BaseB*>(d);
```

如果是 `reinterpret_cast<BaseB*>(v)` 会怎样？

它直接把 `void*` 的原始数值赋给了 `BaseB*`。

`BaseB*` 指向了 `Derived` 对象的开头（即 `BaseA` 的位置）。

如果你在 `BaseB` 里定义了一个虚函数，调用时会因为 `vptr` 指向的是 `BaseA` 的虚表而调用到错误的函数，或者直接因找不到函数地址而 Crash。

> 关于`dynamic_cast`处理`*void`

如果你有一个指向多态对象（有虚函数）任何部位的指针（比如 `BaseB*`），执行 `dynamic_cast<void*>(ptr)` 会返回该**整个对象的起始地址**。

它通过 RTTI 找到最顶层派生类的偏移信息并回退地址。

`dynamic_cast<void*>` 并不是因为“向上查找无果”才停在最下面的。相反，它是**直接去虚表的特定槽位取值**。

**底层机制：** 在支持 RTTI 的编译器（如 GCC/Clang/MSVC）中，虚函数表不仅存放函数地址，还存放了一个 **"offset-to-top"（到顶端偏移量）** 的字段。

- 当你把 `Player` 转成 `IB` 时，`IB` 指针指向的是对象中间。
- 此时 `IB` 对应的虚表里，专门有一个槽位记录着：**“从当前位置往回跳 8 字节，就是整个对象的起始点。”**
- `dynamic_cast<void*>` 的指令非常简单：**直接读取这个偏移量数值，并加到当前指针上。** 它不需要像 `dynamic_cast<T*>` 那样递归对比类型名称，所以它的性能其实比普通 `dynamic_cast` 还要快一些！

> 既然 `static_cast` 在多继承下会改变指针的数值，那么将一个派生类指针 `d` 转换为 `void* v`，再转换回来的过程中，`d` 和 `v` 的数值一定相等吗？如果我把 `d` 先转为 `BaseB*` 再转为 `void*`，结果又会如何？

假设 `Derived` 的内存布局中，`BaseA` 在偏移 0，`BaseB` 在偏移 8。

情况 A：`Derived*` -> `void*` -> `Derived*`

1. `Derived* d = 0x1000;`
2. `void* v = d;` —— 此时 `v` 的数值是 `0x1000`。
3. `Derived* d2 = static_cast<Derived*>(v);` —— 此时 `d2` 数值依然是 `0x1000`。

结果：`d == v`（数值上），且还原后完全正确。

情况B：`Derived*` -> `BaseB*` -> `void*`

1. `Derived* d = 0x1000;`
2. `BaseB* b = d;` —— **关键点！** 编译器发现要转成第二个基类，自动加 8。此时 `b` 的数值是 **`0x1008`**。
3. `void* v = b;` —— 此时 `v` 的数值是 **`0x1008`**。

结果：此时如果你拿 `v` 和 `d` 比较（`v == (void*)d`），结果是 **false**！因为 `v` 指向的是对象的腹部，而 `d` 指向的是头部。

情况C：从 `void* (0x1008)` 转回 `Derived*`

如果你尝试 `Derived* d2 = static_cast<Derived*>(v);`：

编译器看到 `v` 是 `void*`，它不敢乱动地址，只能把 `0x1008` 原样给 `d2`。

**灾难**：此时 `d2` 的数值是 `0x1008`，但它类型是 `Derived*`。当你访问 `d2` 的 `BaseA` 成员时，它会去 `0x1008` 找，而 `BaseA` 其实在 `0x1000`。**程序逻辑彻底崩溃。**

---

`static_cast` 在非 `void*` 之间转换时，拥有足够的上下文（知道源类型和目标类型），所以它能帮你自动加减偏移量。

一旦进入 `void*` 的黑盒，所有的**语义信息全丢了**。编译器不再帮你做任何偏移计算。

---

> 既然指针数值会变，那 C++ 怎么判断两个指针是否指向同一个对象？

```c++
Derived* d = new Derived();
BaseB* b = d;

if (d == b) { 
    // 这里会进入吗？
}
```

会进入！当你比较 `d == b` 时，编译器并不会简单地比较 `0x1000 == 0x1008`。它会自动执行**隐式类型转换**，将两者转换到同一基准线上（通常是提升到派生类或公共基类）再比较数值。 但如果你写 `(void*)d == (void*)b`，结果就是 **false**。

---

# *void

## 作为无返回值

当你在函数声明中使用 `void func()` 时：

**底层含义**：它告诉编译器，该函数在退出时**不需要在 `rax` 或 `eax` 寄存器（通常的返回值寄存器）中存放任何有效数据**。

**物理存在**：它不占用任何内存空间。你不能定义 `void x;`，因为编译器不知道该给 `x` 分配多少字节，也不知道如何解释它的内存。

## 作为无类型指针

`void*` 并不是“指向 void 的指针”，而是**“一个只包含地址、不包含长度和解释方式的裸指针”**。

- **编译器的账本**：
  - `int* p`：编译器在账本上记下：`p` 是一个地址，且从这个地址开始的 **4 个字节**要按**整数**解析。
  - `void* v`：编译器在账本上只记下：`v` 是一个地址。**没了。**
- **为什么不能解引用？** 当你尝试 `*v` 时，编译器会报错。因为它不知道该读取 1 字节、4 字节还是 8 字节，也不知道读出来的是浮点数还是二进制码。

但是如果此时sizeof(v)的话64位系统还是8字节。

**底层本质**：`void` 在 C++ 中是**不可完整类型。它存在的唯一目的就是**抹除编译器的类型检查**。

(这么看来void*和std::move，reinterpret_cast有点像)

# 智能指针的转换
