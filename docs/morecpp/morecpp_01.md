## 命名空间

多个相同的命名空间最后编译器会将其成员合并到同一个命名空间中

一个命名空间定义了一个新的作用域

如何使用命名空间？

```c++
namespace N{
    int a;
    double b;
}

//1
N::a = 10;
Using N::a;
//2
a = 10;
//3
using N::a;
a=10;
```

## 缺省参数

1. 缺省参数必须从右往左依次给出，不能间隔着给。

   ~~~c++
   //错误示例
   void Print(int a, int b = 20, int c)
   {
   	cout << a << endl;
   	cout << b << endl;
   	cout << c << endl;
   }
   ~~~

2. 缺省参数不能在声明和定义中同时出现

   ```c++
   //错误示例
   //test.h
   void Print(int a, int b, int c = 30);
   //test.c
   void Print(int a, int b, int c = 30)
   {
   	cout << a << endl;
   	cout << b << endl;
   	cout << c << endl;
   }
   
   ```

3. 缺省值必须是常量或者全局变量

   ~~~c++
   //正确示例
   int x = 30;//全局变量
   void Print(int a, int b = 20, int c = x)
   {
   	cout << a << endl;
   	cout << b << endl;
   	cout << c << endl;
   }
   ~~~

## 函数重载

   C++函数汇总出的符号不再单单是函数的函数名，而是通过其参数的类型和个数以及顺序等信息汇总出 一个符号，**修饰符**。

## extern "C"

函数前加“extern C”，意思是告诉编译器，将该函数按照C语言规则来编译。

注意：在函数前加“extern C”后，该函数便**不能支持重载**了。

~~~c++
// add.h
#ifndef ADD_H
#define ADD_H

#ifdef __cplusplus
extern "C" {
#endif

int add(int a, int b);

#ifdef __cplusplus
}
#endif

#endif
~~~

~~~c++
// main.cpp
#include <iostream>
#include "add.h"

int main() {
    std::cout << add(2, 3) << std::endl;
    return 0;
}
~~~

为什么头文件要这么写 希望C编译器认识

几种用法
~~~c++
extern "C" int add(int a, int b);
//
extern "C" {
    int add(int a, int b);
    int sub(int a, int b);
}
//
// math.cpp
extern "C" int add(int a, int b) {
    return a + b;
}
~~~

## 引用

1. 定义时必须初始化
2. 一个变量可以有多个引用
3. 一旦引用了一个实体就不可以再改引用其它实体

引用可以：

1. 做参数 这就是按值传递和按引用传递
2. 做返回值 但是不能将函数内部创建的普通局部变量的引用返回 因为函数结束要销毁

## 常引用

~~~c++
int main()
{
	const int a = 10;
	//int& ra = a;    //该语句编译时会出错，a为常量
	const int& ra = a;//正确
	
	//int& b = 10;    //该语句编译时会出错，10为常量
	const int& b = 10;//正确
	return 0;
}
~~~

## 引用与指针

从语法的角度上讲 引用就是别名，没有独立的空间

从汇编的角度上讲，引用的底层实现类似指针存地址

## 引用与指针的区别

1、引用在定义时必须初始化，指针没有要求。
2、引用在初始化时引用一个实体后，就不能再引用其他实体，而指针可以在任何时候指向任何一个同类型实体。
3、没有NULL引用，但有NULL指针。
4、在sizeof中的含义不同：引用的结果为引用类型的大小，但指针始终是地址空间所占字节个数（32位平台下占4个字节）。
5、引用进行自增操作就相当于实体增加1，而指针进行自增操作是指针向后偏移一个类型的大小。
6、有多级指针，但是没有多级引用。
7、访问实体的方式不同，指针需要显示解引用，而引用是编译器自己处理。
8、引用比指针使用起来相对更安全。

## 内联函数

1. 内联以空间换时间
2. inline对编译器而言只是建议
3. inline不建议声明和定义分离 分离会导致链接错误 因为inline展开后就没有了地址

## auto用法

一、auto声明指针时auto和auto*没有区别 但auto声明引用必须加&

```c++
#include <iostream>
using namespace std;
int main()
{
	int a = 10;
	auto b = &a;   //自动推导出b的类型为int*
	auto* c = &a;  //自动推导出c的类型为int*
	auto& d = a;   //自动推导出d的类型为int
	//打印变量b,c,d的类型
	cout << typeid(b).name() << endl;//打印结果为int*
	cout << typeid(c).name() << endl;//打印结果为int*
	cout << typeid(d).name() << endl;//打印结果为int
	return 0;
}
```

二、同一行定义多个变量 必须相同类型

```c++
int main()
{
	auto a = 1, b = 2; //正确
	auto c = 3, d = 4.0; //编译器报错：“auto”必须始终推导为同一类型
	return 0;
}
```

## auto不能推导的场景

一、auto不能作为函数形参类型

```c++
void TestAuto(auto x)
{}
```

二、auto不能拿来声明数组

```c++
int main()
{
	int a[] = { 1, 2, 3 };
	auto b[] = { 4, 5, 6 };//error
	return 0;
}
```

## NULL

NULL其实是一个宏，在传统的C头文件(stddef.h)中可以看到如下代码：

~~~c++
/* Define NULL pointer value */
#ifndef NULL
#ifdef __cplusplus
#define NULL    0
#else  /* __cplusplus */
#define NULL    ((void *)0)
#endif  /* __cplusplus */
#endif  /* NULL */
~~~

可以看到，NULL可能被定义为字面常量0，也可能被定义为无类型指针(void*)的常量。但是不论采取何种定义，在使用空值的指针时，都不可避免的会遇到一些麻烦

~~~c++
#include <iostream>
using namespace std;
void Fun(int p)
{
	cout << "Fun(int)" << endl;
}
void Fun(int* p)
{
	cout << "Fun(int*)" << endl;
}
int main()
{
	Fun(0);           //打印结果为 Fun(int)
	Fun(NULL);        //打印结果为 Fun(int)
	Fun((int*)NULL);  //打印结果为 Fun(int*)
	return 0;
}
~~~

程序本意本意是想通过Fun(NULL)调用指针版本的Fun(int* p)函数，但是由于NULL被定义为0，Fun(NULL)最终调用的是Fun(int p)函数。

## nullptr

1. 作为关键字在C++11引入

2. sizeof(nullptr)与sizeof((void*)0)所占的字节数相同。

3. 指针空值时最好用nullptr
