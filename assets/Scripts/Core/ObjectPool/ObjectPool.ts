import { Enum_Layer } from "../../Def/EnumDef";
import GameObjectBase from "../GameObjects/GameObjectBase";
import IRecoverObject from "../GameObjects/IRecoverObject";
import { GM } from "../Global/GM";
import GameViewBase from "../View/GameViewBase";

const { ccclass, property } = cc._decorator;

@ccclass('ObjectPool')
class _ObjectPool {
    private _pool: { [key: string]: Array<IRecoverObject> };
    constructor() {
        this._pool = {};
    }

    put(key: string, obj: IRecoverObject) {
        if (obj == null) {
            return;
        }

        if (this._pool[key] == null) {
            this._pool[key] = [];
        }

        if (obj.onRecover()) {
            this._pool[key].push(obj);
        }

        // if (obj instanceof GameObjectBase) {
        //     let layer = GM.uiManager.getLayer(Enum_Layer.recovery);
        //     obj.node.setParent(layer);
        // }

        // console.log(key, " : ", this._pool[key].length);

    }

    get(key: string) {
        if (this._pool[key] != null && this._pool[key].length > 0) {
            let obj = this._pool[key].pop();
            return obj;
        }
    }

    has(key: string) {
        return this._pool[key] != null && this._pool[key].length > 0;
    }
}

export const ObjectPool = new _ObjectPool();

