> [!NOTE]
>
> string

# string的使用

## string的构造

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

## string的插入

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
## string的拼接

```c++
string& append (const string& str);
string& append (const char* s);
string& append (size_t n, char c);
```

## string的删除

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

## string的查找

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

## string的比较

# 迭代器失效

**迭代器失效的本质是：当内存不再代表原来的元素**

1. 发生扩容，重新分配内存，旧内存释放。此时原来的迭代器变为了悬空指针。
2. 未发生扩容，但发生insert/erase。
   - 发生删除时，元素整体前移，原位置内容变了。
   - 发生插入时，元素整体后移，原位置内容也变了。
   - 此时it可能仍是一个有效位置，但语义已经错了。这时候用就是未定义行为了。

# String的底层

## 常量拷贝

`"abs"`是字符串字面量，存储在常量区。

是全局生命周期的，从程序启动到结束一直存在。且是只读的。

本质是一个const char类型的数组。

string的生命周期是局部的，当`std::string`离开作用域时就会析构

当执行`string s1 = "abc"`时，编译器从常量区拷贝了一份数据到栈上或堆上（大小取决于SSO）。

## string扩容

string的扩容与vector高度相似，通常是旧容量的1.5倍或者2倍，并调用移动/拷贝到新空间。

## string与`vector<char>`的区别

| 特性      | string              | vector     |
| --------- | ------------------- | ---------- |
| '\0' 结尾 | ✅ 必须              | ❌ 不保证   |
| 字符语义  | ✅ 文本              | ❌ 普通数组 |
| API       | 丰富（find/substr） | 少         |
| SSO       | ✅                   | ❌          |

为什么用string对象包装const char*而不是直接用指针呢？

| **维度**     | **const char\* (指向字面量)** | **std::string 对象**                  |
| ------------ | ----------------------------- | ------------------------------------- |
| **内存管理** | 手动/静态 (极易内存泄漏)      | **RAII (自动管理，极其安全)**         |
| **可变性**   | 只读，不可原地修改            | 可变，支持 `push_back`, `erase` 等    |
| **安全性**   | 容易越界访问 (指针不带长度)   | **受控访问** (通过 `size()` 和迭代器) |

## 小字符串优化SSO

小字符串优化的核心思想是：**小字符串不分配内存，直接存储在对象内部**

**引入SSO的目的就是为了避免频繁的malloc**

实现类似下面

```c++
class string {
    char* _data;
    size_t _size;

    union {
        size_t _capacity;
        char _buf[16];
    };
};
```

因为最后一位要放`\0`所以能存15字节数据。

如果申请`<=15字节`，那么直接存储在对象内部，不用malloc和free。

如果是大字符串，才会分配堆内存。

### SSO如何判断当前状态

```c++
if (_data == _buf)
```

表示当前是小字符串

小字符串中capacity隐含=15

大字符串中capacity存在union中

## 写时拷贝COW

```c++
string a = "hello";
string b = a;  // 共享同一块内存
//直到修改
b[0] = 'H';
//才发生复制
```

为什么现在放弃了COW？

1. 线程不安全
2. 与move冲突

## string对象的大小

```c++
class string {
    char* _data;     // 8
    size_t _size;    // 8

    union {
        size_t _capacity; // 大字符串
        char _buf[16];    // 小字符串（SSO）
    };
};
```

因为union的大小=最大成员的大小

所以这里`sizeof(string)=8+8+16=32`字节

## 移动语义失效

string的move避免拷贝：这就是正常的移动语义写法

```c++
b._data = a._data;
b._size = a._size;
b._capacity = a._capacity;

a._data = nullptr;
a._size = 0;
a._capacity = 0;
```

但如果是小字符串 数据在`_buf`内部

此时因为不在堆上，无法偷内存，只能发生`O(n)`拷贝

# 手动实现

```c++
class MyString {
private:
    size_t _size;

    union {
        struct {
            char* _data;
            size_t _capacity;
        };
        char _buf[16];
    };

    bool isSmall() const {
        return _size < 16;
    }
};
```

```c++
MyString(const char* s = "") {
    _size = strlen(s);

    if (_size < 16) {
        memcpy(_buf, s, _size + 1);
    } else {
        _capacity = _size;
        _data = new char[_capacity + 1];
        memcpy(_data, s, _size + 1);
    }
}
```

```c++
void push_back(char c) {
    if (isSmall()) {
        if (_size < 15) {
            _buf[_size++] = c;
            _buf[_size] = '\0';
        } else {
            // 转大字符串
            size_t new_cap = 32;
            char* new_data = new char[new_cap + 1];

            memcpy(new_data, _buf, _size);
            new_data[_size++] = c;
            new_data[_size] = '\0';

            _data = new_data;
            _capacity = new_cap;
        }
    } else {
        if (_size == _capacity) {
            size_t new_cap = _capacity * 2;
            char* new_data = new char[new_cap + 1];

            memcpy(new_data, _data, _size);
            delete[] _data;

            _data = new_data;
            _capacity = new_cap;
        }

        _data[_size++] = c;
        _data[_size] = '\0';
    }
}
```

```c++
~MyString() {
    if (!isSmall()) {
        delete[] _data;
    }
}
```

