~~~c++
[this] {
			for (;;) {
				std::function<void()> task;

				// --- 临界区开始 ---
				{
					std::unique_lock<std::mutex> lock(this->queue_mutex);

					// 条件变量等待：如果没有任务且池子没停，就睡在这里
					this->condition.wait(lock, [this] {
						return this->stop || !this->tasks.empty();
						});

					// 如果池子停了且任务全干完了，这个工人就下班（退出线程）
					if (this->stop && this->tasks.empty()) return;

					// 从队列取出一个任务
					task = std::move(this->tasks.front());
					this->tasks.pop();
				}
				// --- 临界区结束 ---

				// 执行任务（不占用锁，保证其他工人能继续抢活）
				task();
			}
			}
~~~

