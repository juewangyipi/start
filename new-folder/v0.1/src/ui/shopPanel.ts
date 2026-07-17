import type { Inventory } from "../systems/inventory.ts";
import type { Wallet } from "../systems/wallet.ts";
import type { Shop } from "../systems/shop.ts";
import { CONFIG } from "../core/config.ts";
import { getItem } from "../data/items.ts";

export type ShopActions = {
  onSellWood: () => void;
  onSellFish: () => void;
  onSellAll: () => void;
  onExpandBag: () => void;
  onExpandWarehouse: () => void;
  onClose: () => void;
};

export class ShopPanel {
  private readonly root: HTMLElement;
  private readonly body: HTMLElement;
  private open = false;
  private actions: ShopActions | null = null;

  constructor(host: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "shop-panel";
    this.root.className = "side-panel";
    this.root.hidden = true;

    const title = document.createElement("div");
    title.className = "inv-title";
    title.textContent = "商店";

    this.body = document.createElement("div");
    this.body.className = "panel-body";

    const hint = document.createElement("div");
    hint.className = "inv-hint";
    hint.textContent = "Esc / E 关闭";

    this.root.append(title, this.body, hint);
    host.appendChild(this.root);
  }

  get isOpen(): boolean {
    return this.open;
  }

  setActions(actions: ShopActions): void {
    this.actions = actions;
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.root.hidden = !open;
  }

  refresh(shop: Shop, wallet: Wallet, bag: Inventory, warehouse: Inventory): void {
    this.body.replaceChildren();

    const gold = el("div", "panel-row strong", `金币: ${wallet.gold}`);
    this.body.appendChild(gold);

    this.body.appendChild(
      el(
        "div",
        "panel-muted",
        `木头 x${bag.countOf("wood")}（${getItem("wood").sellPrice}金/个） · 生鱼 x${bag.countOf("raw_fish")}（${getItem("raw_fish").sellPrice}金/个）`,
      ),
    );

    this.body.appendChild(
      btn("卖出全部木头", () => this.actions?.onSellWood()),
    );
    this.body.appendChild(
      btn("卖出全部生鱼", () => this.actions?.onSellFish()),
    );
    this.body.appendChild(btn("卖出背包全部资源", () => this.actions?.onSellAll()));

    this.body.appendChild(el("div", "panel-divider", ""));

    this.body.appendChild(
      btn(
        `扩背包 +${CONFIG.expandSlots} 格（${shop.bagPrice()} 金）· 当前 ${bag.capacity}`,
        () => this.actions?.onExpandBag(),
      ),
    );
    this.body.appendChild(
      btn(
        `扩仓库 +${CONFIG.expandSlots} 格（${shop.warehousePrice()} 金）· 当前 ${warehouse.capacity}`,
        () => this.actions?.onExpandWarehouse(),
      ),
    );

    this.body.appendChild(
      btn("关闭", () => this.actions?.onClose(), "ghost"),
    );
  }
}

function el(tag: string, cls: string, text: string): HTMLElement {
  const n = document.createElement(tag);
  n.className = cls;
  n.textContent = text;
  return n;
}

function btn(
  label: string,
  onClick: () => void,
  variant: "normal" | "ghost" = "normal",
): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = variant === "ghost" ? "panel-btn ghost" : "panel-btn";
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}
