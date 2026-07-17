import type { Inventory } from "../systems/inventory.ts";
import { getItem } from "../data/items.ts";

export type WarehouseActions = {
  onDepositAll: () => void;
  onWithdrawAll: () => void;
  onBagSlot: (index: number) => void;
  onWarehouseSlot: (index: number) => void;
  onClose: () => void;
};

export class WarehousePanel {
  private readonly root: HTMLElement;
  private readonly bagGrid: HTMLElement;
  private readonly whGrid: HTMLElement;
  private readonly meta: HTMLElement;
  private open = false;
  private actions: WarehouseActions | null = null;

  constructor(host: HTMLElement) {
    this.root = document.createElement("div");
    this.root.id = "warehouse-panel";
    this.root.className = "side-panel wide";
    this.root.hidden = true;

    const title = document.createElement("div");
    title.className = "inv-title";
    title.textContent = "仓库（各村镇互通）";

    this.meta = document.createElement("div");
    this.meta.className = "inv-meta";

    const actions = document.createElement("div");
    actions.className = "panel-actions";
    const dep = document.createElement("button");
    dep.type = "button";
    dep.className = "panel-btn";
    dep.textContent = "全部存入";
    dep.addEventListener("click", () => this.actions?.onDepositAll());
    const wit = document.createElement("button");
    wit.type = "button";
    wit.className = "panel-btn";
    wit.textContent = "尽量取出";
    wit.addEventListener("click", () => this.actions?.onWithdrawAll());
    actions.append(dep, wit);

    const bagLabel = el("div", "panel-sub", "背包（点击存入仓库）");
    this.bagGrid = document.createElement("div");
    this.bagGrid.className = "inv-grid";

    const whLabel = el("div", "panel-sub", "仓库（点击取出到背包）");
    this.whGrid = document.createElement("div");
    this.whGrid.className = "inv-grid";

    const hint = document.createElement("div");
    hint.className = "inv-hint";
    hint.textContent = "Esc / E 关闭";

    this.root.append(
      title,
      this.meta,
      actions,
      bagLabel,
      this.bagGrid,
      whLabel,
      this.whGrid,
      hint,
    );
    host.appendChild(this.root);
  }

  get isOpen(): boolean {
    return this.open;
  }

  setActions(actions: WarehouseActions): void {
    this.actions = actions;
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.root.hidden = !open;
  }

  refresh(bag: Inventory, warehouse: Inventory): void {
    this.meta.textContent = `背包 ${bag.usedSlots()}/${bag.capacity} · 仓库 ${warehouse.usedSlots()}/${warehouse.capacity}`;
    fillGrid(this.bagGrid, bag, (i) => this.actions?.onBagSlot(i));
    fillGrid(this.whGrid, warehouse, (i) => this.actions?.onWarehouseSlot(i));
  }
}

function fillGrid(
  grid: HTMLElement,
  inv: Inventory,
  onSlot: (index: number) => void,
): void {
  grid.replaceChildren();
  inv.slots.forEach((slot, index) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "inv-slot clickable";
    if (slot) {
      const def = getItem(slot.id);
      cell.style.borderColor = def.color;
      const swatch = document.createElement("span");
      swatch.className = "inv-swatch";
      swatch.style.background = def.color;
      const label = document.createElement("span");
      label.className = "inv-label";
      label.textContent = def.name;
      const count = document.createElement("span");
      count.className = "inv-count";
      count.textContent = String(slot.count);
      cell.append(swatch, label, count);
    } else {
      cell.classList.add("empty");
    }
    cell.addEventListener("click", () => onSlot(index));
    grid.appendChild(cell);
  });
}

function el(tag: string, cls: string, text: string): HTMLElement {
  const n = document.createElement(tag);
  n.className = cls;
  n.textContent = text;
  return n;
}
