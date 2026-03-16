# 玩家生命脚本

```c++
using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;

public class PlayerHealth : MonoBehaviour
{

    public TMP_Text healthText;
    public Animator healthTextAnim;

    private void Start()
    {
        healthText.text = "HP:" + StatsManager.Instance.currentHealth + "/" + StatsManager.Instance.maxHealth;
    }

    public void changeHealth(int amount)
    {
        StatsManager.Instance.currentHealth += amount;
        healthTextAnim.Play("TextUpdate");
        healthText.text = "HP:" + StatsManager.Instance.currentHealth + "/" + StatsManager.Instance.maxHealth;

        if (StatsManager.Instance.currentHealth <= 0)
        {
            gameObject.SetActive(false);
        }

    }
}

```

### 数据驱动的设计

你没有在 `PlayerHealth` 里定义 `currentHealth` 变量，而是全部引用了 `StatsManager.Instance`。

- **好处**：这意味着即使用户切换场景或者销毁了 Player 对象，血量数值依然安全地保存在单例管理器中。
- **计算逻辑**：`changeHealth(int amount)` 支持正负值传入。加血传正数，扣血传负数（例如 `-10`），这在处理治疗和伤害时逻辑非常统一。

### UI 动态交互

脚本不仅更新了文字，还通过 `healthTextAnim.Play("TextUpdate")` 触发了一个动画。

- **反馈感**：这通常用于实现血量变动时的“数字跳动”、“红光闪烁”或“抖动”效果。
- **TextMeshPro (TMP)**：你使用了 `TMPro` 命名空间，说明你的项目 UI 渲染质量较高，使用了 Unity 推荐的矢量字体方案。

### 死亡逻辑

- **直接逻辑**：一旦 `currentHealth <= 0`，执行 `gameObject.SetActive(false)`。
- **后果回忆**：
  - 玩家会立即从场景中消失。
  - 由于 Player 物体被禁用了，挂在它上面的 `PlayerMovement` 和 `PlayerCombat` 也会停止工作。
  - **注意**：如果你的相机是跟随玩家的，此时相机可能会停止移动或报错，除非你有额外的处理。
