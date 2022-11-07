const { ccclass, property } = cc._decorator;

export interface IEventObject {
    /**事件名 */
    name: string;
    /**事件回调 */
    func: Function;
    /**事件调起对象 */
    target: unknown;
}

@ccclass('EventDispatcher')
class _EventDispatcher {
    private _listenDic: { [key: string]: Array<IEventObject> } = {};

    constructor() {
        this._listenDic = {};
    }

    Listen(eventName: string, func: Function, target: unknown) {
        let listenArr = this._listenDic[eventName];
        if (listenArr == null) {
            listenArr = [];
        }
        else {
            for (const obj of listenArr) {
                if (obj.target == target && func == obj.func) {
                    console.error("listen same function");
                    return;
                }
            }
        }
        let eventObj: IEventObject = {
            name: eventName,
            func: func,
            target: target
        }
        listenArr.push(eventObj);

        this._listenDic[eventName] = listenArr;
    }

    Emit(eventName: string, ...args: any[]) {
        let listenArr = this._listenDic[eventName];
        if (listenArr == null) {
            return;
        }

        for (const obj of listenArr) {
            obj.func.apply(obj.target, args);
        }
    }

    OffListen(eventName: string, target: unknown) {
        let listenArr = this._listenDic[eventName];
        if (listenArr == null) {
            return;
        }

        for (let i = listenArr.length - 1; i > -1; i--) {
            let obj = listenArr[i];
            if (obj.target == target) {
                listenArr.splice(i, 1);
            }
        }

    }

    OffAllListenOfTarget(target: unknown) {
        for (let key in this._listenDic) {
            this.OffListen(key, target)
        }
    }
}

/**自定义事件派发器 */
export const EventDispatcher = new _EventDispatcher();

