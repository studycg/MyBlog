# 属性显示

```c++
using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;

public class StatsUI : MonoBehaviour
{
    public GameObject[] statsSlot;
    public CanvasGroup statsCanvas;

    private bool statsOpen = false;

    private void Start()
    {
        UpdateAllStats();
    }

    private void Update()
    {
        if (Input.GetButtonDown("ToggleStats"))
        {
            if (statsOpen)
            {
                Time.timeScale = 1;
                UpdateAllStats();
                statsCanvas.alpha = 0;
                statsOpen = false;
            }
            else
            {
                Time.timeScale = 0;
                UpdateAllStats();
                statsCanvas.alpha = 1;
                statsOpen = true;
            }
        }
    }

    public void UpdateDamage()
    {
        statsSlot[0].GetComponentInChildren<TMP_Text>().text = "Damage:" + StatsManager.Instance.damage;
    }

    public void UpdateSpeed()
    {
        statsSlot[1].GetComponentInChildren<TMP_Text>().text = "Speed:" + StatsManager.Instance.speed;
    }

    public void UpdateAllStats()
    {
        UpdateDamage();
        UpdateSpeed();
    }
}
```

这是该脚本最重要的功能。你通过切换 `Time.timeScale` 来控制游戏的运行状态：

- **打开面板时 (`Time.timeScale = 0`)**：整个游戏世界会“静止”。所有的物理计算 (`FixedUpdate`)、倒计时 (`Update` 中的 `Time.deltaTime`) 都会停止。这为玩家创造了一个安全的属性查看时间。
- **关闭面板时 (`Time.timeScale = 1`)**：游戏恢复正常速度。

**记忆闪回：** 你在 `PlayerMovement` 里的 `FixedUpdate` 位移逻辑会因为这个设置而自动停止，玩家无法在开菜单时移动。

### CanvasGroup 控制显隐

你没有使用 `gameObject.SetActive(true/false)`，而是使用了 `CanvasGroup.alpha`：

- **优势**：修改 `alpha`（透明度）可以让 UI 的出现和消失更平滑（如果你之后想加淡入淡出动画的话）。
- **代价**：需要注意的是，仅仅把 `alpha` 设为 0，UI 其实还在那里，只是看不见。如果你发现透明后鼠标还是点不到背后的东西，可能还需要操作 `statsCanvas.blocksRaycasts`。

### 组件解耦与 Slot 模式

你使用了 `public GameObject[] statsSlot` 数组来管理属性显示槽位：

- **索引约定**：你在代码中硬编码了索引：`statsSlot[0]` 对应 **Damage**，`statsSlot[1]` 对应 **Speed**。
- **层级查找**：通过 `GetComponentInChildren<TMP_Text>()` 自动寻找子物体里的文本。这意味着你的每一个 `statsSlot` 下面应该都有一个 TextMeshPro 对象。

### 数据同步流向

这个脚本完成了从 **单例数据 -> UI 文字** 的最后一步转化：

1. 玩家按下 `"ToggleStats"` 按键。
2. 脚本立刻调用 `UpdateAllStats()`。
3. `UpdateAllStats` 向 `StatsManager.Instance` 索要最新的 `damage` 和 `speed`。
4. 将数值拼接成字符串并填入对应的文本框。