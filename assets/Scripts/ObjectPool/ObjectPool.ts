import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ObjectPool')
class _ObjectPool {
    private _pool: { [key: string]: Array<Node> };
    constructor() {
        this._pool = {};
    }

    put(key: string, obj: Node) {
        if (this._pool[key] == null) {
            this._pool[key] = [];
        }

        this._pool[key].push(obj);
        if (obj.parent) {
            obj.setParent(null);
        }
    }

    get(key: string) {
        if (this._pool[key] != null && this._pool[key].length > 0) {
            return this._pool[key].pop();
        }
    }
}

export const ObjectPool = new _ObjectPool();

