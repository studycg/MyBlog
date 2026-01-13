此页笔记为《C++ Primer Plus》第三章 处理数据

为了让知识更一体 从头看这本书并吹毛求疵一下

# 简单变量

对于简单变量
~~~c++
int braincount;
braincount = 5;
int braincount(5);
int braincount{5};
int braincount = 5.9;//存5
int braincount(5.9);//存5
int braincount = {5.9};//编译器报错
int braincount{5.9};//编译器报错
~~~

其实是告诉编译器，需要分配一块内存来存储整数，将这块内存的地址标记为braincount。并将这个地址存的整型数据变为5。
那么braincount这个名字本身存在哪里呢？

> braincount这个名字本身不存在于数据内存中，主要存在于编译器的符号表中。
>
> 例如0x7ffeefbff49c。那么表中会有映射关系：
> $$  \text{Symbol Table: } \quad \text{"braincount"} \rightarrow \text{内存地址 } (0\text{x}7\text{ffeefbff}49\text{c})$$

一旦这个映射关系建立，编译器就会将代码中所有出现 `braincount` 的地方，**替换成它实际的内存地址**。

也就是说变量名是面向用户的，编译器在映射后看到的是地址。

# 变量类型

使用sizeof可以计算变量的字节数。

sizeof对类型名使用时用括号

> sizeof(int)

sizeof对变量名使用时加不加都行

> sizeof(braincount)或sizeof braincount

climits头文件中包含了各变量的最大最小值得，头文件里有很多#define

## C++11初始化方式

~~~c++
int cnt1 = {24};
int cnt2{24};
int cnt3 = {};	//0
int cnt4{};		//0
~~~

bool若被置为数字，则0为false非0为true。若bool转为int则true为1false为0。

## const

~~~c++
const int Months = 12;
~~~

常量被初始化后其值就被固定，编译器不允许再修改该常量的值。
## 变量类型转换

### 初始化和赋值时转换

~~~c++
float tree = 3;//int转float
int guess(3.9832);//float转int 存3
~~~

## 以{ }方式初始化时进行转换

列表初始化不允许缩窄(窄化转换)

~~~c++
const int code = 66;
int x = 66;
char c1{31325};//编译失败
char c2 = {66};//编译成功
char c3{code};//警告
char c4 = {x};//编译失败
~~~

## 在表达式中转换

1. 如果有一个操作数的类型是long double，则将另一个操作数 转换为long double。 
2. 否则，如果有一个操作数的类型是double，则将另一个操作 数转换为double。
3. 否则，如果有一个操作数的类型是float，则将另一个操作数 转换为float。
4. 否则，说明操作数都是整型，因此执行整型提升。
5. 在这种情况下，如果两个操作数都是有符号或无符号的，且 其中一个操作数的级别比另一个低，则转换为级别高的类型。
6. 如果一个操作数为有符号的，另一个操作数为无符号的，且 无符号操作数的级别比有符号操作数高，则将有符号操作数转换为无符 号操作数所属的类型。
7. 否则，如果有符号类型可表示无符号类型的所有可能取值， 则将无符号操作数转换为有符号操作数所属的类型。
8. 否则，将两个操作数都转换为有符号类型的无符号版本。

## 传递参数时转换

这个之后再说

## 强制类型转换

~~~c++
(typeName)Value //C风格
typeName(Value) //C++风格
//C++想法是让强制类型转换看起来像函数调用
~~~

~~~c++
cast_name<new_type>(expression)
//这个之后会细说
~~~

# auto声明

~~~c++
//C++98
std::vector<double> scores;
std::vector<double>::iterator pv = scores.begin();
//C++11
std::vector<double> scores;
auto pv = scores.begin();
~~~