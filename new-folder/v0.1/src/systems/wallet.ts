export class Wallet {
  gold: number;

  constructor(starting: number) {
    this.gold = starting;
  }

  canAfford(price: number): boolean {
    return this.gold >= price;
  }

  spend(price: number): boolean {
    if (!this.canAfford(price)) return false;
    this.gold -= price;
    return true;
  }

  earn(amount: number): void {
    if (amount > 0) this.gold += amount;
  }
}
