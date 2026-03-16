# 自动刷怪

```c++
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
public class Enemy_Spawner : MonoBehaviour
{
    [Header("配置")]
    public GameObject enemyPrefab;    // 拖入你的怪物 Prefab
    public int spawnAmount = 5;       // 刷怪数量
    public float spawnRadius = 3f;    // 刷怪随机半径

    [Header("刷怪点(可选)")]
    public Transform[] spawnPoints;   // 如果你想在固定位置刷怪，就把点拖进来

    private bool hasTriggered = false; // 确保只触发一次

    private void OnTriggerEnter2D(Collider2D collision)
    {
        // 检查碰撞体是否为玩家
        if (collision.CompareTag("Player") && !hasTriggered)
        {
            SpawnEnemies();
            hasTriggered = true; // 激活后失效，避免无限刷怪
        }
    }

    void SpawnEnemies()
    {
        for (int i = 0; i < spawnAmount; i++)
        {
            Vector3 spawnPosition;

            // 逻辑：如果有指定的刷怪点就用点，没有就随机圆圈范围内生成
            if (spawnPoints != null && spawnPoints.Length > 0)
            {
                spawnPosition = spawnPoints[i % spawnPoints.Length].position;
            }
            else
            {
                // 在触发器中心周围随机偏移
                Vector2 randomOffset = Random.insideUnitCircle * spawnRadius;
                spawnPosition = transform.position + new Vector3(randomOffset.x, randomOffset.y, 0);
            }

            // 实例化怪物：相当于 C++ 的 new 对象并加入场景管理
            Instantiate(enemyPrefab, spawnPosition, Quaternion.identity);
        }
    }

    // 在编辑器里画个圈，方便调试观察范围
    private void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.green;
        Gizmos.DrawWireSphere(transform.position, spawnRadius);
    }
}
```

### 触发器机制

脚本利用了 Unity 的物理触发系统 `OnTriggerEnter2D`：

- **单次触发逻辑**：你定义了一个布尔值 `hasTriggered`。
  - **作用**：当玩家第一次踏入该区域时，`hasTriggered` 变为 `true`。这保证了怪物只会在玩家第一次经过时刷出来，避免玩家反复横跳导致场景里塞满几百只怪物的“性能灾难”。
- **标签判定**：使用 `collision.CompareTag("Player")`，这要求你在 Unity 的 Inspector 面板里把玩家物体的 **Tag** 必须设置为 **"Player"**。

### 2. 灵活的刷怪策略

你的 `SpawnEnemies()` 方法兼容了两种截然不同的刷怪方式：

- **方式 A：固定点位模式**
  - 如果你在 `spawnPoints` 数组里拖入了特定的 Transform（比如关卡的四个角落）。
  - 脚本使用 `i % spawnPoints.Length` 进行**取模运算**。这意味着如果你要刷 10 个怪但只有 4 个点，它会自动轮循这些点（1,2,3,4,1,2...）进行生成。
- **方式 B：随机范围模式 (Dynamic Offsets)**
  - 如果没有指定点位，它会使用 `Random.insideUnitCircle * spawnRadius`。
  - **技术细节**：这会在一个圆形范围内随机产生偏移量，让怪物的出现看起来更自然、不那么死板。

### 3. 对象实例化

- **`Instantiate(enemyPrefab, ...)`**：这是 Unity 中最核心的动态生成函数。
  - 它会将你制作好的怪物 **Prefab（预制体）**（包含之前我们讨论过的 `Enemy_Movement`, `Enemy_Health`, `Enemy_Combat` 等所有脚本）克隆一份放入当前场景。
  - 生成后的怪物会立即启动其自身的 `Start()` 方法，开始寻找并攻击玩家。