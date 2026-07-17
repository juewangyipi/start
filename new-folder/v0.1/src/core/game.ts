import {
  CONFIG,
  viewHeightPx,
  viewWidthPx,
} from "./config.ts";
import { Input } from "./input.ts";
import { Player } from "../entities/player.ts";
import { Slime } from "../entities/slime.ts";
import { World } from "../world/world.ts";
import { renderChunkBackground } from "../world/renderChunk.ts";
import { listExits } from "../world/transition.ts";
import { getChunk } from "../world/registry.ts";
import { Inventory } from "../systems/inventory.ts";
import { Skills } from "../systems/skills.ts";
import { InteractionSystem, type Toast } from "../systems/interaction.ts";
import { InteractableStore } from "../systems/interactableStore.ts";
import { FacilityStore } from "../systems/facilityStore.ts";
import { findFacilityFocus } from "../systems/facilityInteraction.ts";
import { Wallet } from "../systems/wallet.ts";
import { Shop } from "../systems/shop.ts";
import { TimeOfDay } from "../systems/timeOfDay.ts";
import { applyOfflineProgress } from "../systems/offline.ts";
import { drawInteractables } from "../world/drawInteractables.ts";
import { drawFacilities } from "../world/drawFacilities.ts";
import { InventoryPanel } from "../ui/inventoryPanel.ts";
import { ShopPanel } from "../ui/shopPanel.ts";
import { WarehousePanel } from "../ui/warehousePanel.ts";
import { GATHER, type InteractKind } from "../entities/interactable.ts";
import type { Facility } from "../entities/facility.ts";
import { loadSave, writeSave, type SavePointData } from "../save/saveGame.ts";
import { getItem } from "../data/items.ts";

/**
 * 核心循环：移动 · 切屏 · 采集 · 背包 · 商店仓库 · 昼夜 · 死亡 · 存档
 */
export class Game {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly hud: HTMLElement;
  private readonly input = new Input();
  private readonly world = new World();
  private readonly player: Player;
  private inventory: Inventory;
  private warehouse: Inventory;
  private readonly skills = new Skills();
  private readonly wallet: Wallet;
  private readonly shop = new Shop();
  private readonly time = new TimeOfDay();
  private readonly interaction = new InteractionSystem();
  private readonly interactables = new InteractableStore();
  private readonly facilities = new FacilityStore();
  private readonly slime = new Slime();
  private readonly invPanel: InventoryPanel;
  private readonly shopPanel: ShopPanel;
  private readonly warehousePanel: WarehousePanel;

  private hp: number = CONFIG.maxHp;
  private savePoint: SavePointData;
  private lastGatherKind: InteractKind | null = null;
  private bagDirty = false;

  private lastTs = 0;
  private raf = 0;
  private running = false;
  private transitionFlash = 0;
  private autosaveAcc = 0;
  private toasts: Toast[] = [];
  private focusGatherId: string | null = null;
  private focusFacility: Facility | null = null;
  private activeInteract = null as ReturnType<
    InteractionSystem["update"]
  >["active"];
  private hurtFlash = 0;
  private readonly onBeforeUnload: () => void;

  constructor(canvas: HTMLCanvasElement, hud: HTMLElement, app: HTMLElement) {
    this.canvas = canvas;
    this.hud = hud;
    this.invPanel = new InventoryPanel(app);
    this.shopPanel = new ShopPanel(app);
    this.warehousePanel = new WarehousePanel(app);

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not available");
    this.ctx = ctx;

    const w = viewWidthPx();
    const h = viewHeightPx();
    canvas.width = w;
    canvas.height = h;

    this.player = new Player(
      (w - CONFIG.tileSize) / 2,
      (h - CONFIG.tileSize) / 2,
    );
    this.inventory = new Inventory(CONFIG.inventorySlots);
    this.warehouse = new Inventory(CONFIG.warehouseSlots);
    this.wallet = new Wallet(CONFIG.startingGold);
    this.savePoint = {
      chunkId: "village",
      x: this.player.x,
      y: this.player.y,
    };

    this.wirePanels();
    this.tryLoad();
    this.invPanel.refresh(this.inventory);

    this.onBeforeUnload = () => this.saveNow();
    window.addEventListener("beforeunload", this.onBeforeUnload);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTs = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.input.dispose();
    this.saveNow();
    window.removeEventListener("beforeunload", this.onBeforeUnload);
  }

  private wirePanels(): void {
    this.shopPanel.setActions({
      onSellWood: () => {
        const r = this.shop.sellAll(this.inventory, this.wallet, "wood");
        this.afterShopTrade(r);
      },
      onSellFish: () => {
        const r = this.shop.sellAll(this.inventory, this.wallet, "raw_fish");
        this.afterShopTrade(r);
      },
      onSellAll: () => {
        const r = this.shop.sellEverything(this.inventory, this.wallet);
        this.afterShopTrade(r);
      },
      onExpandBag: () => {
        const err = this.shop.buyBagExpand(this.inventory, this.wallet);
        if (err) this.pushToast(err);
        else {
          this.pushToast(`背包扩至 ${this.inventory.capacity} 格`);
          this.refreshOpenPanels();
          this.saveNow();
        }
      },
      onExpandWarehouse: () => {
        const err = this.shop.buyWarehouseExpand(this.warehouse, this.wallet);
        if (err) this.pushToast(err);
        else {
          this.pushToast(`仓库扩至 ${this.warehouse.capacity} 格`);
          this.refreshOpenPanels();
          this.saveNow();
        }
      },
      onClose: () => this.shopPanel.setOpen(false),
    });

    this.warehousePanel.setActions({
      onDepositAll: () => {
        const n = this.warehouse.depositAllFrom(this.inventory);
        this.pushToast(n > 0 ? `存入 ${n} 件` : "没有可存入的物品或仓库已满");
        this.refreshOpenPanels();
        this.saveNow();
      },
      onWithdrawAll: () => {
        const n = this.inventory.depositAllFrom(this.warehouse);
        this.pushToast(n > 0 ? `取出 ${n} 件` : "没有可取出的物品或背包已满");
        this.refreshOpenPanels();
        this.saveNow();
      },
      onBagSlot: (index) => {
        const stack = this.inventory.takeSlot(index);
        if (!stack) return;
        const err = this.warehouse.addStack(stack);
        if (err) {
          this.inventory.addStack(stack);
          this.pushToast("仓库已满");
        } else {
          this.pushToast(`存入 ${getItem(stack.id).name} x${stack.count}`);
        }
        this.refreshOpenPanels();
      },
      onWarehouseSlot: (index) => {
        const stack = this.warehouse.takeSlot(index);
        if (!stack) return;
        const err = this.inventory.addStack(stack);
        if (err) {
          this.warehouse.addStack(stack);
          this.pushToast("背包已满");
        } else {
          this.pushToast(`取出 ${getItem(stack.id).name} x${stack.count}`);
        }
        this.refreshOpenPanels();
      },
      onClose: () => this.warehousePanel.setOpen(false),
    });
  }

  private afterShopTrade(r: { sold: number; gold: number }): void {
    if (r.sold <= 0) this.pushToast("没有可卖的资源");
    else this.pushToast(`卖出 ${r.sold} 件，+${r.gold} 金`);
    this.refreshOpenPanels();
    this.saveNow();
  }

  private refreshOpenPanels(): void {
    if (this.invPanel.isOpen) this.invPanel.refresh(this.inventory);
    if (this.shopPanel.isOpen) {
      this.shopPanel.refresh(
        this.shop,
        this.wallet,
        this.inventory,
        this.warehouse,
      );
    }
    if (this.warehousePanel.isOpen) {
      this.warehousePanel.refresh(this.inventory, this.warehouse);
    }
  }

  private tryLoad(): void {
    const data = loadSave();
    if (!data) {
      this.pushToast("新的旅程 · 本地存档将自动保存");
      return;
    }

    this.wallet.gold = data.gold;
    this.hp = data.hp;
    this.world.currentId = data.chunkId;
    this.player.x = data.playerX;
    this.player.y = data.playerY;
    this.player.facing = data.facing;
    this.inventory = Inventory.fromJSON(data.inventory);
    this.warehouse = Inventory.fromJSON(data.warehouse);
    this.skills.loadJSON(data.skills);
    this.shop.loadJSON(data.shop);
    this.savePoint = data.savePoint;
    this.time.progress = data.dayProgress;
    this.interactables.loadJSON(data.interactables);
    this.lastGatherKind = data.lastGatherKind;
    this.interaction.lastGatherKind = data.lastGatherKind;
    this.slime.x = data.slimeX;
    this.slime.y = data.slimeY;

    const elapsed = (Date.now() - data.wallMs) / 1000;
    const offlineToasts = applyOfflineProgress({
      elapsedSec: elapsed,
      lastGatherKind: this.lastGatherKind,
      inventory: this.inventory,
      skills: this.skills,
    });
    this.toasts.push(...offlineToasts);
    if (offlineToasts.length === 0) {
      this.pushToast("已读取本地存档");
    }
  }

  private saveNow(): void {
    writeSave({
      version: CONFIG.version,
      wallMs: Date.now(),
      gold: this.wallet.gold,
      hp: this.hp,
      chunkId: this.world.currentId,
      playerX: this.player.x,
      playerY: this.player.y,
      facing: this.player.facing,
      inventory: this.inventory.toJSON(),
      warehouse: this.warehouse.toJSON(),
      skills: this.skills.toJSON(),
      shop: this.shop.toJSON(),
      savePoint: this.savePoint,
      dayProgress: this.time.progress,
      interactables: this.interactables.toJSON(),
      lastGatherKind: this.lastGatherKind,
      slimeX: this.slime.x,
      slimeY: this.slime.y,
    });
  }

  private readonly frame = (ts: number): void => {
    if (!this.running) return;
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
    this.lastTs = ts;

    this.update(dt);
    this.render();
    this.input.endFrame();
    this.raf = requestAnimationFrame(this.frame);
  };

  private update(dt: number): void {
    // 面板开关
    if (this.input.isEscapeJustPressed()) {
      this.closeAllPanels();
    }

    if (this.input.isInventoryJustPressed()) {
      const next = !this.invPanel.isOpen;
      this.closeAllPanels();
      this.invPanel.setOpen(next);
      if (next) this.invPanel.refresh(this.inventory);
    }

    this.time.update(dt);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt);

    const axis = this.input.getMoveAxis();
    this.player.update(dt, axis);

    if (this.world.resolvePlayerBounds(this.player)) {
      this.transitionFlash = 1.6;
    }
    if (this.transitionFlash > 0) {
      this.transitionFlash = Math.max(0, this.transitionFlash - dt);
    }

    const nowSec = Date.now() / 1000;
    const gatherList = this.interactables.forChunk(this.world.currentId);
    const facilityList = this.facilities.forChunk(this.world.currentId);

    this.focusFacility = findFacilityFocus(this.player, facilityList);

    // 设施：点按 E（面板打开时 E 关闭）
    if (this.input.isInteractJustPressed()) {
      if (this.shopPanel.isOpen || this.warehousePanel.isOpen) {
        this.closeAllPanels();
      } else if (this.focusFacility) {
        this.openFacility(this.focusFacility);
      }
    }

    // 采集：按住 E（开店/仓时不采）
    const canGather =
      !this.shopPanel.isOpen && !this.warehousePanel.isOpen;
    const result = this.interaction.update({
      dt,
      nowSec,
      player: this.player,
      interactHeld: canGather && this.input.isInteractHeld(),
      list: gatherList,
      inventory: this.inventory,
      skills: this.skills,
    });

    this.focusGatherId = result.focus?.id ?? null;
    this.activeInteract = result.active;
    if (result.lastGatherKind) this.lastGatherKind = result.lastGatherKind;

    if (result.toasts.length) {
      this.toasts.push(...result.toasts);
      this.bagDirty = true;
    }
    if (this.bagDirty) {
      this.refreshOpenPanels();
      this.bagDirty = false;
    }

    // 史莱姆
    this.slime.update(dt, this.player, this.world.currentId);
    if (
      this.world.currentId === this.slime.chunkId &&
      this.slime.touching(this.player)
    ) {
      this.applyDamage(CONFIG.slimeDps * dt);
    }

    // 自动存档
    this.autosaveAcc += dt;
    if (this.autosaveAcc >= CONFIG.autosaveSec) {
      this.autosaveAcc = 0;
      this.saveNow();
    }

    for (const t of this.toasts) t.ttl -= dt;
    this.toasts = this.toasts.filter((t) => t.ttl > 0);
  }

  private openFacility(f: Facility): void {
    this.closeAllPanels();
    switch (f.kind) {
      case "shop":
        this.shopPanel.setOpen(true);
        this.shopPanel.refresh(
          this.shop,
          this.wallet,
          this.inventory,
          this.warehouse,
        );
        break;
      case "warehouse":
        this.warehousePanel.setOpen(true);
        this.warehousePanel.refresh(this.inventory, this.warehouse);
        break;
      case "save_point":
        this.activateSavePoint();
        break;
    }
  }

  private activateSavePoint(): void {
    this.savePoint = {
      chunkId: this.world.currentId,
      x: this.player.x,
      y: this.player.y,
    };
    this.hp = CONFIG.maxHp;
    this.pushToast("存档点已激活 · 生命已恢复");
    this.saveNow();
  }

  private applyDamage(amount: number): void {
    if (amount <= 0) return;
    this.hp -= amount;
    this.hurtFlash = 0.15;
    if (this.hp <= 0) {
      this.hp = 0;
      this.respawn();
    }
  }

  private respawn(): void {
    this.world.currentId = this.savePoint.chunkId;
    this.player.x = this.savePoint.x;
    this.player.y = this.savePoint.y;
    this.hp = CONFIG.maxHp;
    this.closeAllPanels();
    this.pushToast("你倒下了……回到最近存档点");
    this.saveNow();
  }

  private closeAllPanels(): void {
    this.invPanel.setOpen(false);
    this.shopPanel.setOpen(false);
    this.warehousePanel.setOpen(false);
  }

  private pushToast(text: string, ttl = 2.4): void {
    this.toasts.push({ text, ttl });
  }

  private render(): void {
    const { ctx, canvas, world, player } = this;
    const chunk = world.current;
    const nowSec = Date.now() / 1000;
    const gatherList = this.interactables.forChunk(world.currentId);
    const facilityList = this.facilities.forChunk(world.currentId);

    renderChunkBackground(ctx, chunk, canvas.width, canvas.height);
    drawFacilities(ctx, facilityList, this.focusFacility?.id ?? null);
    drawInteractables(
      ctx,
      gatherList,
      nowSec,
      this.focusGatherId,
      this.activeInteract,
    );

    if (world.currentId === this.slime.chunkId) {
      this.drawSlime();
    }

    this.drawPlayer();
    this.drawDayOverlay();
    this.drawHpBar();

    // 交互提示
    const tip = this.promptText();
    if (tip) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      const tw = ctx.measureText(tip).width;
      const px = player.x + player.size / 2;
      const py = player.y - 10;
      ctx.fillRect(px - tw / 2 - 4, py - 7, tw + 8, 12);
      ctx.fillStyle = "#f5f0d8";
      ctx.textBaseline = "middle";
      ctx.fillText(tip, px, py);
    }

    this.drawToasts();
    this.updateHud();
  }

  private promptText(): string | null {
    if (this.shopPanel.isOpen || this.warehousePanel.isOpen) return null;
    if (this.focusFacility) {
      return `E · ${this.focusFacility.label}`;
    }
    if (this.focusGatherId) {
      const list = this.interactables.forChunk(this.world.currentId);
      const focus = list.find((i) => i.id === this.focusGatherId);
      if (focus) return `按住 E · ${GATHER[focus.kind].label}`;
    }
    return null;
  }

  private drawSlime(): void {
    const { ctx, slime } = this;
    ctx.fillStyle = "#5ecf7a";
    ctx.beginPath();
    ctx.ellipse(
      slime.x + slime.size / 2,
      slime.y + slime.size * 0.55,
      slime.size * 0.45,
      slime.size * 0.35,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "#1a3a20";
    ctx.fillRect(slime.x + 4, slime.y + 5, 2, 2);
    ctx.fillRect(slime.x + slime.size - 6, slime.y + 5, 2, 2);
  }

  private drawPlayer(): void {
    const { ctx, player } = this;
    if (this.hurtFlash > 0) ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#f0d28a";
    ctx.fillRect(
      Math.round(player.x),
      Math.round(player.y),
      player.size,
      player.size,
    );
    ctx.fillStyle = "#2a2010";
    const cx = Math.round(player.x) + player.size / 2;
    const cy = Math.round(player.y) + player.size / 2;
    const n = 3;
    switch (player.facing) {
      case "up":
        ctx.fillRect(cx - 1, cy - n - 1, 2, n);
        break;
      case "down":
        ctx.fillRect(cx - 1, cy + 1, 2, n);
        break;
      case "left":
        ctx.fillRect(cx - n - 1, cy - 1, n, 2);
        break;
      case "right":
        ctx.fillRect(cx + 1, cy - 1, n, 2);
        break;
    }
    ctx.globalAlpha = 1;
  }

  private drawDayOverlay(): void {
    const d = this.time.darkness();
    if (d <= 0) return;
    const { ctx, canvas } = this;
    ctx.fillStyle = `rgba(8, 12, 28, ${d})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  private drawHpBar(): void {
    const { ctx, canvas } = this;
    const w = 60;
    const h = 5;
    const x = canvas.width - w - 8;
    const y = 8;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = "#3a2020";
    ctx.fillRect(x, y, w, h);
    const ratio = Math.max(0, this.hp / CONFIG.maxHp);
    ctx.fillStyle = ratio > 0.3 ? "#d05050" : "#ff3030";
    ctx.fillRect(x, y, w * ratio, h);
  }

  private drawToasts(): void {
    const { ctx, canvas } = this;
    let y = canvas.height - 12;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      const t = this.toasts[i]!;
      const alpha = Math.min(1, t.ttl / 0.4);
      ctx.fillStyle = `rgba(0,0,0,${0.55 * alpha})`;
      const tw = ctx.measureText(t.text).width;
      ctx.fillRect(canvas.width / 2 - tw / 2 - 6, y - 8, tw + 12, 16);
      ctx.fillStyle = `rgba(255,245,210,${alpha})`;
      ctx.fillText(t.text, canvas.width / 2, y);
      y -= 18;
    }
  }

  private updateHud(): void {
    const chunk = this.world.current;
    const inv = this.inventory;
    const lines = [
      `${CONFIG.title}`,
      `地图: ${chunk.name} · ${this.time.phaseLabel()}`,
      `金 ${this.wallet.gold} · HP ${Math.ceil(this.hp)}/${CONFIG.maxHp}`,
      `技能: ${this.skills.summaryLine()}`,
      `背包 ${inv.usedSlots()}/${inv.capacity} 仓 ${this.warehouse.usedSlots()}/${this.warehouse.capacity} · 木${inv.countOf("wood")} 鱼${inv.countOf("raw_fish")}`,
      `出口: ${listExits(chunk)}`,
      `E 互动 · B 背包 · 村内店/仓/存档点`,
    ];

    if (this.transitionFlash > 0 && this.world.lastTransition) {
      const t = this.world.lastTransition;
      lines.push(
        `切屏: ${getChunk(t.from).name} → ${getChunk(t.to).name}`,
      );
    }

    this.hud.textContent = lines.join("\n");
  }
}
