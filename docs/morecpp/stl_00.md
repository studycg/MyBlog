> [!NOTE]
>
> 关于string的底层原理请看C++基础的STL章

# string的构造

```c++
string();//构造一个空字符串
```

```c++
string(const char* s);///复制s所指的字符序列
```

```c++
string(const char* s, size_t n);//复制s所指字符序列的前n个字符
```

```c++
string(size_t n, char c);//生成n个c字符的字符串
```

```c++
string(const string& str);//生成str的复制品
```

```c++
string(const string& str, size_t pos, size_t len = npos);  //复制str中从字符位置pos开始并跨越len个字符的部分
```

# string的插入

1. 使用push_back进行尾插

   ```c++
   void push_back (char c);
   ```

2. 使用insert插入

   ```c++
   string& insert (size_t pos, const string& str);
   string& insert (size_t pos, const char* s);
   iterator insert (iterator p, char c);
   ```
# string的拼接

```c++
string& append (const string& str);
string& append (const char* s);
string& append (size_t n, char c);
```

# string的删除

1. 使用pop_back进行删除

   ```c++
   void pop_back();
   ```

2. 使用erase进行删除

   ```c++
   string& erase (size_t pos = 0, size_t len = npos);
   iterator erase (iterator p);
   iterator erase (iterator first, iterator last);
   ```

# string的查找

```c++
size_t find (const string& str, size_t pos = 0) const;
size_t find (const char* s, size_t pos = 0) const;
size_t find (char c, size_t pos = 0) const;
```

```c++
size_t rfind (const string& str, size_t pos = npos) const;
size_t rfind (const char* s, size_t pos = npos) const;
size_t rfind (char c, size_t pos = npos) const;
```

# string的比较

