# Vector的扩容

```c++
void resize(size_t n) {
    size_t old_size = size();

    if (n <= old_size) {
        // 缩小：销毁多余元素
        for (size_t i = n; i < old_size; i++) {
            (start + i)->~T();
        }
        finish = start + n;
    } else {
        // 变大
        if (n > capacity()) {
            // 扩容
            size_t new_capacity = std::max(n, capacity() * 2);
			
            //只分配内存 不触发构造函数
            T* new_start = (T*)operator new(sizeof(T) * new_capacity);

            size_t i = 0;

            // 1. 移动旧元素
            for (; i < old_size; i++) {
                //定位new 
                //new(ptr) T(x)
                new(new_start + i) T(std::move(start[i]));
            }

            // 2. 构造新元素
            for (; i < n; i++) {
                new(new_start + i) T();
            }

            // 3. 销毁旧对象
            for (T* p = start; p != finish; ++p) {
                p->~T();
            }

            operator delete(start);

            start = new_start;
            finish = start + n;
            end = start + new_capacity;

        } else {
            // 不需要扩容，只需要构造新元素
            for (size_t i = old_size; i < n; i++) {
                new(start + i) T();
            }
            finish = start + n;
        }
    }
}
```

```c++
// 1. 开辟新内存（空地）
T* new_start = (T*)operator new(sizeof(T) * new_capacity);

// 2. 在新内存上构造对象（搬家）
new(new_start + i) T(std::move(start[i]));

// 3. 销毁旧对象（人走）
start[i].~T();

// 4. 释放旧内存（房子拆）
operator delete(start);
```

