# vector

push_back触发扩容

```c++
template <typename T>
class MiniVector {
public:
    MiniVector() : start(nullptr), finish(nullptr), end_of_storage(nullptr) {}

    ~MiniVector() {
        if (start) {
            destroy_elements(); // 析构有效对象
            operator delete(start); // 释放原始内存
        }
    }

    size_t size() const { return finish - start; }
    size_t capacity() const { return end_of_storage - start; }

private:
    T* start;           // 指向数组首元素
    T* finish;          // 指向最后一个有效元素的下一个位置
    T* end_of_storage;  // 指向可用内存的末尾
};
```

```c++
void push_back(const T& value) {
    if (finish != end_of_storage) {
        // 还有剩余空间，在 finish 指向的内存上构造对象
        new (finish) T(value); 
        finish++;
    } else {
        // 空间不足，执行扩容
        reallocate();
        new (finish) T(value);
        finish++;
    }
}

void reallocate() {
    size_t old_size = size();
    size_t new_capacity = (old_size == 0) ? 1 : old_size * 2;

    // 1. 只分配原始内存，不调用构造函数
    T* new_start = static_cast<T*>(operator new(new_capacity * sizeof(T)));

    // 2. 将旧数据搬运到新空间（移动语义或拷贝）
    for (size_t i = 0; i < old_size; ++i) {
        new (new_start + i) T(std::move(start[i])); 
    }

    // 3. 析构旧对象并释放旧内存
    destroy_elements();
    operator delete(start);

    // 4. 更新指针
    start = new_start;
    finish = start + old_size;
    end_of_storage = start + new_capacity;
}

void destroy_elements() {
    if (start) {
        for (T* p = start; p != finish; ++p) {
            p->~T(); // 显示调用析构函数
        }
    }
}
```

resize触发扩容

```c++
void resize(size_t new_size, const T& value = T()) {
    if (new_size < size()) {
        // 情况 A：缩减尺寸，析构多余对象
        while (finish > start + new_size) {
            (--finish)->~T();
        }
    } 
    else if (new_size <= capacity()) {
        // 情况 B：利用剩余空间构造
        while (finish < start + new_size) {
            new (finish++) T(value);
        }
    } 
    else {
        // 情况 C：扩容并构造
        T* new_start = static_cast<T*>(operator new(new_size * sizeof(T)));
        
        size_t old_size = size();
        try {
            // 1. 搬运旧元素
            for (size_t i = 0; i < old_size; ++i) {
                new (new_start + i) T(std::move(start[i]));
            }
            // 2. 构造新元素
            for (size_t i = old_size; i < new_size; ++i) {
                new (new_start + i) T(value);
            }
        } catch (...) {
            // 异常安全性处理：如果构造一半失败了，需要回滚
            // 释放已分配内存并重新抛出
            operator delete(new_start);
            throw;
        }

        // 3. 清理旧空间
        destroy_elements();
        operator delete(start);

        // 4. 更新指针
        start = new_start;
        finish = start + new_size;
        end_of_storage = finish; // 此时 capacity 等于 new_size
    }
}
```

**`reserve`**：只改 `capacity`。它只负责开辟内存，**不构造对象**，`size` 不变。

**`resize`**：既改 `size` 也可能改 `capacity`。它会**构造对象**（调用构造函数），直接影响 `size`。

# string

```c++
class MyString {
public:
    // 默认构造与 C 字符串构造
    MyString(const char* s = "") {
        if (s == nullptr) {
            _size = 0;
            _data = new char[1];
            *_data = '\0';
        } else {
            _size = strlen(s);
            _data = new char[_size + 1];
            strcpy(_data, s);
        }
    }

    // 析构函数
    ~MyString() {
        delete[] _data;
    }

private:
    char* _data;
    size_t _size;
};
```

```c++
// 拷贝构造
MyString(const MyString& other) : _size(other._size) {
    _data = new char[_size + 1];
    strcpy(_data, other._data);
}

MyString& operator=(const MyString& other) {
    // 1. 检查自我赋值 (Self-assignment check)
    // 如果执行 s1 = s1，不加这个判断会导致先把自己的数据删了，再拷贝就报错了
    if (this == &other) {
        return *this;
    }

    // 2. 分配新空间并拷贝数据
    // 技巧：先申请新空间，再释放旧空间，可以保证异常安全性
    // 如果直接 delete 再 new，万一 new 抛出异常，对象就处于毁坏状态了
    char* new_data = new char[other._size + 1];
    strcpy(new_data, other._data);

    // 3. 释放原有内存
    delete[] _data;

    // 4. 更新状态
    _data = new_data;
    _size = other._size;

    return *this;
}
```

```c++
// 移动构造
MyString(MyString&& other) noexcept {
    // 1. 浅拷贝：接管资源
    _data = other._data;
    _size = other._size;

    // 2. 置空源对象：断开连接
    // 这是移动语义的关键，防止 other 析构时调用 delete[] _data
    other._data = nullptr;
    other._size = 0;
}

MyString& operator=(MyString&& other) noexcept {
    // 1. 检查自我移动 (Self-move check)
    if (this == &other) {
        return *this;
    }

    // 2. 释放自己的旧资源
    delete[] _data;

    // 3. 窃取对方资源
    _data = other._data;
    _size = other._size;

    // 4. 将对方置空
    other._data = nullptr;
    other._size = 0;

    return *this;
}
```

```c++
const char* c_str() const { return _data; }
size_t size() const { return _size; }
```

# list

```c++
template <typename T>
struct ListNode {
    T data;
    ListNode* prev;
    ListNode* next;

    ListNode(const T& val = T()) : data(val), prev(nullptr), next(nullptr) {}
};
```

因为list内存不连续，原生指针`++`会指向错误的地址，所以需要封装一个类，重载操作符。

```c++
template <typename T>
struct ListIterator {
    ListNode<T>* node;

    ListIterator(ListNode<T>* p = nullptr) : node(p) {}

    // 解引用
    T& operator*() { return node->data; }
    T* operator->() { return &(node->data); }

    // 前置 ++
    ListIterator& operator++() {
        node = node->next;
        return *this;
    }

    // 后置 ++
    ListIterator operator++(int) {
        ListIterator tmp = *this;
        node = node->next;
        return tmp;
    }

    bool operator==(const ListIterator& other) const { return node == other.node; }
    bool operator!=(const ListIterator& other) const { return node != other.node; }
};
```

实现容器本身

```c++
template <typename T>
class MyList {
public:
    typedef ListIterator<T> iterator;

    MyList() {
        // 创建哨兵头结点
        head = new ListNode<T>();
        head->next = head;
        head->prev = head;
    }

    ~MyList() {
        clear();
        delete head;
    }

    void push_back(const T& val) {
        ListNode<T>* newNode = new ListNode<T>(val);
        ListNode<T>* tail = head->prev;

        tail->next = newNode;
        newNode->prev = tail;
        newNode->next = head;
        head->prev = newNode;
    }

    iterator begin() { return iterator(head->next); }
    iterator end() { return iterator(head); } // 哨兵节点即为 end

    void clear() {
        ListNode<T>* cur = head->next;
        while (cur != head) {
            ListNode<T>* next = cur->next;
            delete cur;
            cur = next;
        }
        head->next = head;
        head->prev = head;
    }

private:
    ListNode<T>* head;
};
```

# unordered_map

结点定义

```c++
template <typename K, typename V>
struct HashNode {
    std::pair<const K, V> data;
    HashNode* next;

    HashNode(const K& key, const V& val) 
        : data(std::make_pair(key, val)), next(nullptr) {}
};
```

容器框架

```c++
template <typename K, typename V>
class MyUnorderedMap {
public:
    MyUnorderedMap(size_t bucket_count = 10) 
        : _buckets(bucket_count, nullptr), _size(0) {}

    ~MyUnorderedMap() { clear(); }

    // 核心接口：插入
    bool insert(const K& key, const V& value) {
        // 1. 计算哈希值并取模
        size_t index = _hash_func(key) % _buckets.size();

        // 2. 检查键是否已存在
        HashNode<K, V>* cur = _buckets[index];
        while (cur) {
            if (cur->data.first == key) return false; // 已存在则插入失败
            cur = cur->next;
        }

        // 3. 头插法插入新节点
        HashNode<K, V>* newNode = new HashNode<K, V>(key, value);
        newNode->next = _buckets[index];
        _buckets[index] = newNode;
        _size++;

        // 4. 检查负载因子，必要时重哈希 (Rehash)
        if (load_factor() > 0.75) {
            rehash();
        }
        return true;
    }

    // 核心接口：查找
    V* find(const K& key) {
        size_t index = _hash_func(key) % _buckets.size();
        HashNode<K, V>* cur = _buckets[index];
        while (cur) {
            if (cur->data.first == key) return &(cur->data.second);
            cur = cur->next;
        }
        return nullptr;
    }

    double load_factor() const { return (double)_size / _buckets.size(); }

private:
    std::vector<HashNode<K, V>*> _buckets;
    size_t _size;
    std::hash<K> _hash_func; // 使用标准库的哈希函数

    void rehash(); // 扩容逻辑
    void clear();
};
```

rehash逻辑

```c++
void rehash() {
    size_t new_count = _buckets.size() * 2;
    std::vector<HashNode<K, V>*> new_buckets(new_count, nullptr);

    for (size_t i = 0; i < _buckets.size(); ++i) {
        HashNode<K, V>* cur = _buckets[i];
        while (cur) {
            HashNode<K, V>* next = cur->next; // 记录下一个

            // 重新计算在新桶中的位置
            size_t new_index = _hash_func(cur->data.first) % new_count;
            
            // 迁移节点（头插法）
            cur->next = new_buckets[new_index];
            new_buckets[new_index] = cur;

            cur = next;
        }
    }
    _buckets.swap(new_buckets);
}
```

# deque的迭代器

```c++
template <typename T>
struct deque_iterator {
    T* cur;          // 指向当前正在访问的元素
    T* first;        // 指向当前缓冲区的起始边界
    T* last;         // 指向当前缓冲区的结束边界（左闭右开）
    T** node;        // 指向中控器（map）的一个槽位，这个槽位指向当前缓冲区
};
```

```c++
void set_node(T** new_node) {
    node = new_node;
    first = *new_node;
    last = first + buffer_size(); // 假设 buffer_size 是固定的
}

// 前置 ++
deque_iterator& operator++() {
    ++cur;
    if (cur == last) {          // 到底了！
        set_node(node + 1);     // 跳到中控器的下一个槽位
        cur = first;            // 指向新缓冲区的开头
    }
    return *this;
}

// 前置 --
deque_iterator& operator--() {
    if (cur == first) {         // 到头了！
        set_node(node - 1);     // 跳到中控器的上一个槽位
        cur = last;             // 指向旧缓冲区的末尾（后一个位置）
    }
    --cur;
    return *this;
}
```

