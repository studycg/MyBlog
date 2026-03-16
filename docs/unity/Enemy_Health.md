# 敌人生命

```c++
using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;

public class Enemy_Health : MonoBehaviour
{
    public int ExpReward = 3;
    //创建一个委托
    public delegate void MonsterDefeated(int exp);
    public static event MonsterDefeated OnMonsterDefeated;


    public int currentHealth;
    public int maxHealth;

    private void Start()
    {
        currentHealth = maxHealth;
    }

    public void ChangeHealth(int amount)
    {
        currentHealth += amount;

        if (currentHealth > maxHealth)
        {
            currentHealth = maxHealth;
        }
        else if (currentHealth <= 0)
        {
            OnMonsterDefeated(ExpReward);
            Destroy(gameObject);
        }
    }
}
```

### 委托与静态事件 (Delegate & Event)

这是你实现“怪物死后给玩家加经验”的核心机制。

- **委托定义**：`public delegate void MonsterDefeated(int exp);` 定义了一个函数的模板，规定了该事件必须携带一个 `int` 参数（即经验值）。
- **静态事件**：`public static event MonsterDefeated OnMonsterDefeated;`
  - **回忆细节**：因为它是 `static`（静态）的，所以 `ExpManager` 脚本可以监听**所有**怪物的死亡，而不需要挨个去寻找每一个怪物对象。这是一种非常解耦的架构设计。
  - **触发时机**：当 `currentHealth <= 0` 时，调用 `OnMonsterDefeated(ExpReward)`。这就像是在全频道发送了一个广播：“有个怪物死了，价值 3 点经验！”

### 生命周期与经验奖励

- **`ExpReward = 3`**：你为每个怪物预设了奖励值。不同的怪物预制体（Prefab）可以设置不同的数值（例如小怪 3 点，精英怪 10 点）。
- **自毁逻辑**：调用 `Destroy(gameObject)`。
  - **技术细节**：由于 `Arrow` 脚本里有 `transform.SetParent(target)`，当怪物被销毁时，插在它身上的箭矢也会随之被销毁，保持了场景的干净。

### 血量限制逻辑

相比于 `PlayerHealth`，你在 `ChangeHealth` 里增加了一个边界判定：

- `if (currentHealth > maxHealth)`：这确保了如果你以后给怪物加了“治疗”技能，它的血量不会溢出。
- **加/扣血复用**：同样支持正负值输入（伤害传负，治疗传正）。

---

1. **事件安全性（潜在崩溃点）**： 目前的写法 `OnMonsterDefeated(ExpReward);` 在没有脚本监听该事件时（比如你暂时禁用了 `ExpManager`）会直接导致**游戏报错崩溃**。

- **建议修改方案**：通常推荐写成 `OnMonsterDefeated?.Invoke(ExpReward);`。那个问号会先检查有没有人订阅，没人订阅就不执行。

2. **死亡特效的缺失**： 目前的逻辑是怪物血量归零后瞬间消失。你当时可能打算（或已经在 Animator 里）增加一个 `Death` 触发器，播放一段烟雾消散或倒地动画。如果你想播放完动画再销毁，需要把 `Destroy` 延迟执行，或者放在动画事件里。

3. **UI 表现**： 目前的怪物没有血条显示。如果你当时做了怪物的头顶血条，通常会在这里通过 `SendMessage` 或者引用一个 `Slider` 组件来同步显示。

