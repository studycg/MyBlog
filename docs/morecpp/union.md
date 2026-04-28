# union对象的大小

所有的union对象共享一块内存

$sizeof(union)=向上对齐(max(sizeof(成员)))$

```c++
union U {
    char a[10];  // 10
    double b;    // 8（对齐要求8）
};
```

union大小必须是8的倍数，所以大小为16

```c++
union U {
    int a;    // 4
    char b;   // 1
};
```

此时对齐也是4

```c++
union U {
    int a;
    double b;
};

U u;
u.a = 10;   // 当前你“认为”它是 int

u.b = 3.14; // 现在你又把这块内存当 double 用
```

后一次写会覆盖前一次

如果乱用的话就是未定义行为

所以正确的解决方法就是带标签的联合体

```c++
struct MyUnion {
    enum Type { INT, DOUBLE } type;

    union {
        int a;
        double b;
    };
};
```

```c++
MyUnion u;
u.type = MyUnion::INT;
u.a = 10;

if (u.type == MyUnion::INT) {
    cout << u.a;
}
```

# union+构造函数

如果union里都是平凡类型，那么不需要构造/析构

```c++
union U {
    int a;
    double b;
};
```

一旦有复杂类型

```c++
union U {
    int a;
    std::string s;
};
```

什么时候要使用构造/析构呢？

```c++
union U {
    int a;
    std::string s;

    U() {}   // 不自动构造 s
    ~U() {}  // 不自动析构 s
};
```

使用时：使用placement new

```c++
U u;

// 构造 string（必须手动）
new (&u.s) std::string("hello");

// 使用
std::cout << u.s << std::endl;

// 析构（必须手动）
u.s.~basic_string();
```

因为union不知道激活的是哪个成员，所以：

**union+平凡类型=生命周期必须手动管理**

