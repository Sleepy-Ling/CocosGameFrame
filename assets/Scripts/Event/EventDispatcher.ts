export interface IEventObject {
    /**事件名 */
    name: string;
    /**事件回调 */
    func: Function;
    /**事件调起对象 */
    target: unknown;

    once: boolean;
}

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
            target: target,
            once: false,
        }
        listenArr.push(eventObj);

        this._listenDic[eventName] = listenArr;
    }

    Once(eventName: string, func: Function, target: unknown) {
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
            target: target,
            once: true,
        }
        listenArr.push(eventObj);

        this._listenDic[eventName] = listenArr;
    }

    Emit(eventName: string, ...args: any[]) {
        let listenArr = this._listenDic[eventName];

        let onceObjectsList: IEventObject[] = [];

        if (listenArr) {
            for (const obj of listenArr) {
                obj.func.apply(obj.target, args);

                if (obj.once) {
                    onceObjectsList.push(obj);
                }
            }

            let newListenArr = listenArr.filter((value) => {
                if (!onceObjectsList.includes(value)) {
                    return value;
                }
            })

            this._listenDic[eventName] = newListenArr;
        }
    }

    OffListen(eventName: string, func: Function, target: unknown) {
        let listenArr = this._listenDic[eventName];
        if (listenArr == null) {
            return;
        }

        for (let i = listenArr.length - 1; i > -1; i--) {
            let obj = listenArr[i];
            if (obj.target == target && obj.func == func) {
                listenArr.splice(i, 1);
            }
        }

    }

    OffAllListenOfTarget(target: unknown) {
        for (let key in this._listenDic) {
            let eventObj = this._listenDic[key]
            for (const obj of eventObj) {

                if (obj.target == target) {
                    this.OffListen(obj.name, obj.func, obj.target);
                }
            }
        }
    }
}

/**自定义事件派发器 */
export const EventDispatcher = new _EventDispatcher();

