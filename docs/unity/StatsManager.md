# 属性系统

```c++
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class StatsManager : MonoBehaviour
{
    public static StatsManager Instance;
    public TMP_Text healthText;

    [Header("Combat Stats")]
    public int damage;
    public float weaponRange;
    public float knockbackForce;
    public float knockbackTime;
    public float stunTime;

    [Header("Movement Stats")]
    public int speed;

    [Header("Health Stats")]
    public int maxHealth;
    public int currentHealth;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void UpdateMaxHealth(int amount)
    {
        maxHealth += amount;
        healthText.text = "HP:" + currentHealth + "/" + maxHealth;
    }

}
```

### 单例模式 (The Singleton)

这是脚本中最核心的部分。在 `Awake()` 中，你使用了如下代码：

- **全局访问点**：这意味着你在任何其他脚本（如 `PlayerMovement` 或 `PlayerCombat`）中，只需通过 `StatsManager.Instance.xxx` 就能直接获取数据。
- **唯一性保证**：如果场景中由于误操作出现了两个 `StatsManager`，它会自动销毁多余的那个，确保数据源的唯一性。

### 数据中心化

你利用 `[Header]` 属性在 Unity Inspector 面板中将属性分为了三大类：

- **战斗：包括伤害、攻击范围、击退参数等。
- **移动：统领角色的基础速度。
- **生命：管理血量上限和当前血量。 这种做法的好处是：如果你想调整游戏的平衡性（比如让主角跑快点或者砍人更疼），**你不需要翻遍每一个脚本，只需要在这个 Manager 的面板上改数值即可。**

### UI 联动与同步

- **直接引用**：脚本持有了 `TMP_Text healthText` 的引用。
- **动态更新**：`UpdateMaxHealth` 方法允许你在游戏中动态增加血量上限（例如吃到了体力药水），并实时刷新 UI 文字。
- **注意**：你之前在 `PlayerHealth` 脚本中也有更新 UI 的逻辑。这说明你当时的设计思路是：`PlayerHealth` 负责受击时的血量变化反馈，而 `StatsManager` 负责属性基准值的变动反馈。