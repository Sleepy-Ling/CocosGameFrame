import GameObjectBase from "../GameObjects/GameObjectBase";

const { ccclass, property } = cc._decorator;

@ccclass('GameObjectsManagerBase')
export class GameObjectsManagerBase {
    /**当前游戏场景里面的对象 用于统一控制 */
    protected GameObjectsTable = new Map<String, GameObjectBase>();

    public init() { }

    /**把游戏对象加入表里 */
    public AddGameObjectIntoTable(gameObjectBase: GameObjectBase) {
        let id = gameObjectBase.node.uuid;
        if (this.GameObjectsTable.has(id)) {
            // Debug.Log("重复添加对象 " + id);
            return;
        }
        this.GameObjectsTable.set(id, gameObjectBase);
    }

    /**
     * 移除某个游戏对象
     * @param gameObjectBase 游戏对象
     * @returns 
     */
    public RemoveGameObjectFromTable(gameObjectBase: GameObjectBase) {
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
        let allObjects: Array<GameObjectBase> = [];
        let itor = this.GameObjectsTable.values();
        while (1) {
            let obj = itor.next().value;
            if (obj == null) {
                break;
            }

            allObjects.push(obj);
        }
        return allObjects;
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

}

