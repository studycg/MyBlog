# String

## 定义方式

~~~c++
string();  //构造一个空字符串

string(const char* s);  //复制s所指的字符序列

string(const char* s, size_t n);  //复制s所指字符序列的前n个字符

string(size_t n, char c);  //生成n个c字符的字符串

string(const string& str);  //生成str的复制品

string(const string& str, size_t pos, size_t len = npos);  //复制str中从字符位置pos开始并跨越len个字符的部分
~~~

## 插入

**使用push_back**

~~~c++
void push_back (char c);
~~~

**使用insert**

~~~c++
string& insert (size_t pos, const string& str);
string& insert (size_t pos, const char* s);
iterator insert (iterator p, char c);
~~~

## 拼接

~~~c++
string& append (const string& str);
string& append (const char* s);
string& append (size_t n, char c);//重复n次
~~~

## 删除

**使用pop_back()进行尾删**

~~~c++
void pop_back();
~~~

**使用erase删除**

~~~c++
string& erase (size_t pos = 0, size_t len = npos);
iterator erase (iterator p);
iterator erase (iterator first, iterator last);

string s("I like C++!!!");

//erase(pos, n)删除pos位置开始的n个字符
s.erase(8, 5); //I like C

//erase(pos)删除pos位置的字符
s.erase(s.end()-1); //I like

//erase(pos1, pos2)删除[pos1pos2)上所有字符
s.erase(s.begin() + 1, s.end()); //I
~~~

## 查找

**使用find函数搜索第一个匹配项**

~~~c++
size_t find (const string& str, size_t pos = 0) const;
size_t find (const char* s, size_t pos = 0) const;
size_t find (char c, size_t pos = 0) const;
~~~

**使用rfind函数反向搜索第一个匹配项**

~~~c++
size_t rfind (const string& str, size_t pos = npos) const;
size_t rfind (const char* s, size_t pos = npos) const;
size_t rfind (char c, size_t pos = npos) const;
~~~

## 比较

## 替换

## 交换

# Vector

## 构造

~~~c++
vector<int> v1; //构造int类型的空容器
vector<int> v2(10, 2); //构造含有10个2的int类型容器
vector<int> v3(v2); //拷贝构造int类型的v2容器的复制品
vector<int> v4(v2.begin(), v2.end()); //使用迭代器拷贝构造v2容器的某一段内容
string s("hello world");
vector<char> v5(s.begin(), s.end()); //拷贝构造string对象的某一段内容
~~~

## 增长空间

**size**获取当前容器中有效元素个数

**capacity**获取当前容器最大容量

**reserve**和**resize**

通过**reserse**函数改变容器的最大容量，**resize**函数改变容器中的有效元素个数。

reserve规则：

 1、当所给值大于容器当前的capacity时，将capacity扩大到该值。

 2、当所给值小于容器当前的capacity时，什么也不做。

resize规则：

 1、当所给值大于容器当前的size时，将size扩大到该值，扩大的元素为第二个所给值，若未给出，则默认为0。

 2、当所给值小于容器当前的size时，将size缩小到该值。

**empty**判断当前容器是否为空

## 迭代器

通过**begin**函数可以得到容器中第一个元素的正向迭代器，通过**end**函数可以得到容器中最后一个元素的后一个位置的正向迭代器。

```c++
//正向迭代器遍历容器
vector<int>::iterator it = v.begin();
while (it != v.end())
{
    cout << *it << " ";
    it++;
}
```

通过**rbegin**函数可以得到容器中最后一个元素的反向迭代器，通过**rend**函数可以得到容器中第一个元素的前一个位置的反向迭代器。

```c++
//反向迭代器遍历容器
vector<int>::reverse_iterator rit = v.rbegin();
while (rit != v.rend())
{
    cout << *rit << " ";
    rit++;
}
```

## 增删改查