// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import GameObjectBase from "./GameObjectBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CharacterBase extends GameObjectBase {
    public onGameStart(startInfo?: any): void {
    }
    public onGameUpdate(info?: any): void {
    }
    public onGamePause(info?: any): void {
    }
    public onGameResume(info?: any): void {
    }
    public onGameEnd(endInfo?: any): void {
    }
    public recover(): void {
    }

}
