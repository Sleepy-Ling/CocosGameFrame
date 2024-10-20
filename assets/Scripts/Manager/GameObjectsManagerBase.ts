
import GameObjectBase, { GameObjectBaseInitParam } from "../Core/GameObjects/GameObjectBase";
import { ObjectPool } from "../Core/ObjectPool/ObjectPool";
import { LogUtil } from "../Core/Utils/LogUtil";
import ManagerBase from "./ManagerBase";

const { ccclass, property } = cc._decorator;

@ccclass()
export class GameObjectsManagerBase extends ManagerBase {
    /**当前游戏场景里面的对象 用于统一控制 */
    protected GameObjectsTable = new Map<String, GameObjectBase>();

    public init(inf?: any) { return super.init() };

    public getGameObjectByID(id: string) {
        return this.GameObjectsTable.get(id);
    }

    /**把游戏对象加入表里 */
    public AddGameObjectIntoTable(gameObjectBase: GameObjectBase, startInf: GameObjectBaseInitParam = null) {
        let id = gameObjectBase.getUUID();
        if (this.GameObjectsTable.has(id)) {
            LogUtil.Log("重复添加对象 " + id, gameObjectBase.name);
            return;
        }
        this.GameObjectsTable.set(id, gameObjectBase);

        // gameObjectBase.init(startInf);

        if (startInf) {
            gameObjectBase.onJoinScene(startInf);
        }
    }

    /**
     * 移除某个游戏对象
     * @param gameObjectBase 游戏对象
     * @returns 
     */
    public RemoveGameObjectFromTable(gameObjectBase: GameObjectBase) {
        if (gameObjectBase.node == null || !gameObjectBase.node.isValid) {
            return;
        }

        let id = gameObjectBase.node.uuid;
        if (!this.GameObjectsTable.has(id)) {
            return;
        }

        this.GameObjectsTable.delete(id);
        gameObjectBase.recover();
    }

    /**
     * 移除全部游戏对象
     */
    public RemoveAllGameObjects() {
        let allObjects = this.GetAllGameObjects();
        allObjects.forEach((obj) => {
            obj.recover();
        })

        this.GameObjectsTable.clear();

    }

    /**获得该管理器对全部对象 （仅提供对象调用） */
    public GetAllGameObjects(): Array<GameObjectBase> {
        let itor = this.GameObjectsTable.values();
        return Array.from(itor);
    }

    public updateAllObjects(deltaTime: number) {
        let itor = this.GameObjectsTable.values();
        while (1) {
            let obj = itor.next().value;
            if (obj == null) {
                break;
            }

            obj.onGameUpdate(deltaTime);
        }
    }

    public pauseAllGameObjects() {
        this.GetAllGameObjects().forEach((obj) => {
            obj.onGamePause();
            obj.enabled = false;
        })
    }

    public resumeAllGameObjects() {
        this.GetAllGameObjects().forEach((obj) => {
            obj.onGameResume();
            obj.enabled = true;
        })
    }

    public setAllObjectsGameEnd() {
        this.GetAllGameObjects().forEach((obj) => {
            obj.onGameEnd();
        })
    }
}

