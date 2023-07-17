

import { Enum_GameState, Enum_GameOjectsType } from '../../Def/EnumDef';
import GameObjectBase from '../../GameObjects/GameObjectBase';
import { GameObjectsManagerBase } from '../../Manager/GameObjectsManagerBase';
import { ViewBase, ViewParamBase } from './ViewBase';

export class GameViewBaseParam extends ViewParamBase {
    public LevelID: number = -1;
    constructor(lv: number) {
        super();

        this.LevelID = lv;
    }
}


const { ccclass, property } = cc._decorator;

@ccclass
export default abstract class GameViewBase extends ViewBase {
    /**当前游戏状态 */
    protected gameState: Enum_GameState = Enum_GameState.None;

    protected GameObjectsManagers: Map<Enum_GameOjectsType, GameObjectsManagerBase> = new Map();
    /**游戏开始 */
    protected abstract onGameStart(info?: any): void;
    /**游戏结束 */
    protected abstract onGameEnd(info?: any): void;
    /**游戏恢复（从暂停状态中） */
    public abstract resume(info?: any): void;
    /**游戏暂停 */
    public abstract pause(info?: any): void;
    /**游戏重开 */
    public abstract restart(info?: any): void;
    public startGame(info?: any): void { };

    /**游戏通关判断 */
    protected abstract GamePassCheck(): boolean;

    /**游戏界面参数 */
    protected viewParam: GameViewBaseParam;

    protected init(param: GameViewBaseParam) {
        this.viewParam = param;
    }

    /**
     * 根据类型获取对象管理者
     * @param type 
     * @returns 
     */
    public GetManager(type: Enum_GameOjectsType): GameObjectsManagerBase {
        if (!this.GameObjectsManagers.has(type)) {
            ///根据类型 自定义初始化对象管理者类
            let manager = new GameObjectsManagerBase();
            this.GameObjectsManagers.set(type, manager);
        }

        return this.GameObjectsManagers.get(type);
    }

    public RemoveObjectFromManager(...gameObjectBases: GameObjectBase[]) {
        for (const obj of gameObjectBases) {
            let type = obj.type;
            if (!this.GameObjectsManagers.has(type)) {
                continue;
            }

            (this.GameObjectsManagers.get(type) as GameObjectsManagerBase).RemoveGameObjectFromTable(obj);
            break;
        }
    }

    public RemoveAllGameObects() {
        let itor = this.GameObjectsManagers.values();
        while (1) {
            let managerBase: GameObjectsManagerBase = itor.next().value;
            if (managerBase == null) {
                break;
            }
            managerBase.RemoveAllGameObjects();
        }
    }

    public AddObjectIntoManager(type: Enum_GameOjectsType, obj: GameObjectBase) {
        let manager = this.GetManager(type);
        manager.AddGameObjectIntoTable(obj);
        obj.type = type;
    }

}