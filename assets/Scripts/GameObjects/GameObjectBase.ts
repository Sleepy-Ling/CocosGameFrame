import { Enum_GameOjectsType, Enum_ColliderMask } from "../Def/EnumDef";
const { ccclass, property } = cc._decorator;

/**游戏对象类 */
@ccclass('GameObjectBase')
export default abstract class GameObjectBase extends cc.Component {
    public abstract onGameStart(startInfo?): void
    public abstract onGameUpdate(info?): void
    public abstract onGamePause(info?): void
    public abstract onGameResume(info?): void
    public abstract onGameEnd(endInfo?): void
    public abstract recover(): void;


    private _type: Enum_GameOjectsType;
    public get type(): Enum_GameOjectsType {
        return this._type;
    }
    public set type(v: Enum_GameOjectsType) {
        this._type = v;
    }
}