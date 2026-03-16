# 升级系统

```c++
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;

public class ExpManager : MonoBehaviour
{
    public int level;
    public int currentExp;
    public int expToLevel = 10;
    public float expGrowthMultiplier = 1.2f;
    public Slider expSlider;
    public TMP_Text curentLevelText;

    public static event Action<int> OnLevelUp;

    private void Start()
    {
        UpdateUI();
    }
    private void Update()
    {
        if (Input.GetKeyDown(KeyCode.Return))
        {
            GainExperience(2);
        }
    }

    private void OnEnable()
    {
        Enemy_Health.OnMonsterDefeated += GainExperience;
    }
    private void OnDisable()
    {
        Enemy_Health.OnMonsterDefeated -= GainExperience;
    }

    public void GainExperience(int amout)
    {
        currentExp += amout;
        if (currentExp >= expToLevel)
        {
            LevelUp();
        }
        UpdateUI();
    }

    private void LevelUp()
    {
        level++;
        currentExp -= expToLevel;
        expToLevel = Mathf.RoundToInt(expToLevel * expGrowthMultiplier);
        OnLevelUp?.Invoke(1);
    }

    public void UpdateUI()
    {
        expSlider.maxValue = expToLevel;
        expSlider.value = currentExp;
        curentLevelText.text = "Level: " + level;
    }
}
```

### 事件订阅机制 (Action & Events)

这是你代码中最“高级”的地方。你使用了 `C# Action` 来实现不同系统间的解耦：

- **监听敌方死亡**：通过 `OnEnable/OnDisable` 订阅了 `Enemy_Health.OnMonsterDefeated`。
  - **技术细节**：这意味着当任何一个敌人死亡时，它会发出一声“广播”，`ExpManager` 听到后会自动调用 `GainExperience`。敌人脚本完全不需要知道 `ExpManager` 的存在。
- **对外广播升级**：定义了 `public static event Action<int> OnLevelUp`。
  - **技术细节**：当玩家等级提升时，`ExpManager` 会发出广播。其他脚本（比如 `StatsManager`）只要订阅了这个事件，就可以在升级时自动增加攻击力或血量。

### 升级算法与经验曲线

你实现了一个简单的**指数增长经验曲线**：

- **经验增长**：`expToLevel = Mathf.RoundToInt(expToLevel * expGrowthMultiplier)`。
- **倍率控制**：`expGrowthMultiplier` 为 `1.2f`。这意味着每一级所需的经验会比前一级多 20%。
- **溢出处理**：`currentExp -= expToLevel`。这保证了如果玩家一次获得大量经验导致连续升级，多余的经验会保留到下一级，而不是被直接清零。

### UI 交互逻辑

- **Slider 进度条**：你直接操作了 `expSlider.maxValue`。这比固定最大值为 1 然后计算百分比要直观得多，因为进度条的物理长度会随着经验上限的增加而重新映射。
- **实时调试**：你在 `Update` 中写了 `Input.GetKeyDown(KeyCode.Return)`。
  - **回忆**：你在开发测试时，只需按下 **回车键 (Enter)** 就能手动给自己加 2 点经验，方便快速测试升级逻辑和 UI 刷新。

### 潜在逻辑细节（帮你检查）

- **递归升级问题**：目前的 `if (currentExp >= expToLevel)` 使用的是 `if` 而不是 `while`。如果玩家获得超级巨量的经验（足以升好几级），这段代码一次只能升一级。
- **静态事件的内存管理**：你正确地在 `OnDisable` 里取消了订阅（`-=`），这是一个非常好的习惯。如果不取消，切换场景时可能会引发 **NullReferenceException** 或内存泄漏。