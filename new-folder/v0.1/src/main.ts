import "./style.css";
import { Game } from "./core/game.ts";

const app = document.querySelector<HTMLElement>("#app");
const canvas = document.querySelector<HTMLCanvasElement>("#game");
const hud = document.querySelector<HTMLElement>("#hud");

if (!app || !canvas || !hud) {
  throw new Error("缺少 #app / #game / #hud 节点");
}

const game = new Game(canvas, hud, app);
game.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.stop());
}
