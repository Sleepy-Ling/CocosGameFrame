import { Enum_EventType } from "../../Def/EnumDef";
import { CustomEvents } from "../../Event/CustomEvents";
import { GM } from "../Global/GM";



/**红点节点 */
export class RedDotNode {
    /**前置事件 */
    public preKey: string;

    public uiTrans: cc.Node;

    public key: string;

    /**红点图案 */
    public redDot: cc.Node;

}

/**红点检测函数 */
export type IRedDotCheckFunc = (...param: any) => boolean;

/**红点事件 */
export class RedDotEvent {
    public key: string;
    public id: number;
    public checkFunc: IRedDotCheckFunc;
    public target: any;

    constructor(key: string, id: number, checkFunc: IRedDotCheckFunc, target: any) {
        this.key = key;
        this.id = id;
        this.checkFunc = checkFunc;
        this.target = target;
    }
}

/**红点系统 */
class _RedDotSystem {
    private _redDotPool: cc.NodePool = new cc.NodePool();
    private _redDot: cc.Node;
    /**红点注册表 */
    private _registerMap: Map<string, Array<RedDotNode>> = new Map();
    /**红点事件注册表 （针对无节点的红底事件或者事件驱动的红点）*/
    private _registerEventMap: Map<string, Array<RedDotEvent>> = new Map();
    /**事件检测间隔 */
    private _eventCheckInterval: number = 3000;
    /**事件序列号id （用于生成事件id） */
    protected event_serial_uid: number = 0;
    /**事件检测计时器 */
    private _eventCheckTimer: number;
    /**事件状态 */
    private _eventState: Map<string, boolean> = new Map();

    init(redDot: cc.SpriteFrame) {
        let node = new cc.Node("redDot");
        let spr = node.addComponent(cc.Sprite);
        spr.spriteFrame = redDot;
        this._redDot = spr.node;

        const uiEventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.UI);
        uiEventDispatcher.Listen(CustomEvents.RedDotEvent, this.OnRedDotEvent, this);

        this._eventCheckTimer = setInterval(this._doEventCheck.bind(this), this._eventCheckInterval);
    }

    private _doEventCheck() {
        let allEventKey: string[] = [];

        let arr = Array.from(this._registerEventMap.values());
        for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr[i].length; j++) {
                const event = arr[i][j];
                if (event.checkFunc) {
                    let rdstate = event.checkFunc.apply(event.target);
                    let tempEventKey = this.updateEventState(event.key, rdstate);
                    allEventKey.push(...tempEventKey);
                }
            }

        }

        if (allEventKey.length > 0) {
            // console.log("do event check ", allEventKey);

            this.refreshRedDotByEventType(allEventKey);
        }
    }

    /**注册红点事件 */
    RegisterEvent(key: string, func: IRedDotCheckFunc, target: any) {
        if (func == null) {
            console.error("regis event is null");
            return null;
        }

        let redDotEventList: Array<RedDotEvent> = this._registerEventMap.get(key);

        let event: RedDotEvent;
        if (redDotEventList == null) {
            redDotEventList = [];
        }
        else {
            redDotEventList.find((event) => {
                return key == event.key && event.target == target && event.checkFunc == func;
            })
        }

        if (event) {
            console.log("same regist event", key, target);

            return;
        }

        event = new RedDotEvent(key, this.event_serial_uid, func, target);
        redDotEventList.push(event);


        this._registerEventMap.set(key, redDotEventList);


        this.event_serial_uid++;

        return event.id;
    }

    /**
     * 取消某个事件注册 根据id  (最好填上事件类型，不然全部检索一遍全部事件)
     * @param id 事件id
     * @param key 事件类型
     */
    UnRegisterEvent(id: number, key?: string) {
        if (key == null) {
            let keys = Array.from(this._registerEventMap.keys());

            for (const k of keys) {
                let eventList = this._registerEventMap.get(k);
                if (eventList == null) {
                    continue;
                }
                let idx = eventList.findIndex((rdEvent) => {
                    return rdEvent.id == id;
                })

                if (idx >= 0) {
                    eventList.splice(idx, 1);
                }

                this._registerEventMap.set(k, eventList);

                return true;
            }
        }
        else {
            let eventList: RedDotEvent[] = this._registerEventMap.get(key);
            if (eventList == null) {
                return false;
            }

            let idx = eventList.findIndex((rdEvent) => {
                return rdEvent.id == id;
            })


            if (idx >= 0) {
                eventList.splice(idx, 1);
            }

            this._registerEventMap.set(key, eventList);

            return true;
        }

        return false;
    }


    /**
     * 取消某个事件注册 根据作用域 (最好填上事件类型，不然全部检索一遍全部事件)
     * @param target 事件作用域
     * @param key 事件类型
     */
    UnRegisterEventByTarget(target: any, key?: string) {
        if (key == null) {
            let keys = Array.from(this._registerEventMap.keys());

            for (const k of keys) {
                let eventList = this._registerEventMap.get(k);
                if (eventList == null) {
                    continue;
                }
                let idx = eventList.findIndex((rdEvent) => {
                    return target == rdEvent.target;
                })

                if (idx >= 0) {
                    eventList.splice(idx, 1);
                }

                this._registerEventMap.set(k, eventList);

                return true;
            }
        }
        else {
            let eventList: RedDotEvent[] = this._registerEventMap.get(key);
            if (eventList == null) {
                return false;
            }

            let idx = eventList.findIndex((rdEvent) => {
                return target == rdEvent.target;
            })

            if (idx >= 0) {
                eventList.splice(idx, 1);
            }

            this._registerEventMap.set(key, eventList);

            return true;
        }

        return false;
    }

    /**
     * 注册节点
     * @param key 红点事件
     * @param node 节点
     * @param preKey 前置事件
     * @param isOn 是否开启红点
     */
    RegisterNode(key: string, node: cc.Node, preKey?: string, isOn?: boolean) {
        // console.log("RegisterNode", " key", key);

        let uiTrans: cc.Node = node;

        /**红点列表 */
        let redDotNodeList: Array<RedDotNode> = this._registerMap.get(key) || [];
        /**当前红点节点 */
        let curRDNode = redDotNodeList.find((curNode) => {
            return curNode.uiTrans.uuid == node.uuid;
        })

        let rdstate: boolean = isOn || this._eventState.get(key) || false;
        if (curRDNode == null) {
            curRDNode = new RedDotNode();
            curRDNode.uiTrans = uiTrans;
            curRDNode.preKey = preKey;
            curRDNode.key = key;

            redDotNodeList.push(curRDNode);

            this._registerMap.set(key, redDotNodeList);
        }

        let allEventKey = this.updateEventState(key, rdstate);
        this.refreshRedDotByEventType(allEventKey);
    }

    /**取消注册节点 */
    UnRegisterNode(key: string, node: cc.Node) {
        // console.log("UnRegisterNode", " key", key, node);

        /**红点列表 */
        let redDotNodeList: Array<RedDotNode> = this._registerMap.get(key);
        if (redDotNodeList) {

            let idx = redDotNodeList.findIndex((rdNode) => {
                return rdNode.uiTrans.uuid == node.uuid;
            })

            if (idx >= 0) {
                let curDeleteRdNode = redDotNodeList.splice(idx, 1)[0];
                this._registerMap.set(key, redDotNodeList);
                this.refreshRedDot(curDeleteRdNode, false);//回收一下红点节点
            }

        }
    }

    protected updateEventState(key: string, isOn: boolean) {
        /**红点列表 */
        const redDotNodeList: Array<RedDotNode> = Array.from(this._registerMap.get(key) || []);

        //更新当前事件状态
        // isOn = isOn || this._eventState.get(key);

        this._eventState.set(key, isOn);

        /**临时记录 全部前置事件id 数组 */
        let preEventKeyList_temp: string[] = [];

        for (let index = 0; index < redDotNodeList.length; index++) {
            const rdNode = redDotNodeList[index];
            if (rdNode.preKey != null && !preEventKeyList_temp.includes(rdNode.preKey)) {
                preEventKeyList_temp.push(rdNode.preKey);
            }

        }

        // console.log("preEventKeyList_temp", preEventKeyList_temp);

        let keys = Array.from(this._registerMap.keys());

        for (const k of keys) {
            let list = this._registerMap.get(k);
            if (list) {
                for (const rdNode of list) {
                    if (preEventKeyList_temp.includes(rdNode.preKey) && rdNode.key != key) {//与preKey 的子级作比较
                        let pre_isOn: boolean = this._eventState.get(rdNode.preKey);

                        let self_isOn: boolean = this._eventState.get(rdNode.key);

                        this._eventState.set(rdNode.preKey, pre_isOn || self_isOn);

                        // console.log("rdNode.preKey", rdNode.preKey, pre_isOn || self_isOn);
                    }
                }
            }

        }

        let allEventKey: string[] = [key, ...preEventKeyList_temp];
        for (const k of preEventKeyList_temp) {
            let s = this._eventState.get(k);
            let tt = this.updateEventState(k, s);
            allEventKey.push(...tt);
        }

        return allEventKey;
    }

    /**红点事件 */
    protected OnRedDotEvent(key: string, ...param: unknown[]) {
        let isOn: boolean = param[0] as boolean;

        // /**红点列表 */
        // const redDotNodeList: Array<RedDotNode> = Array.from(this._registerMap.get(key) || []);

        // //更新当前事件状态
        // isOn = isOn || this._eventState.get(key);

        // this._eventState.set(key, isOn);

        // /**临时记录 全部前置事件id 数组 */
        // let preEventKeyList_temp: string[] = [];

        // while (redDotNodeList.length > 0) {
        //     let rdNode = redDotNodeList.shift();
        //     if (rdNode.preKey != null && !preEventKeyList_temp.includes(rdNode.preKey)) {
        //         let nodeList = this._registerMap.get(rdNode.preKey);
        //         redDotNodeList.push(...nodeList);

        //         preEventKeyList_temp.push(rdNode.preKey);
        //     }
        // }

        // for (const eventKey of preEventKeyList_temp) {
        //     if (eventKey) {
        //         let pre_isOn: boolean = this._eventState.get(eventKey);
        //         pre_isOn = pre_isOn || isOn;

        //         this._eventState.set(eventKey, pre_isOn);

        //         // console.log("update event", eventKey, pre_isOn);
        //     }
        // }

        // let allEventKey: string[] = [key, ...preEventKeyList_temp];

        let allEventKey = this.updateEventState(key, isOn);

        this.refreshRedDotByEventType(allEventKey);

    }

    /**刷新节点 */
    protected refreshRedDot(RDNode: RedDotNode, state: boolean) {
        if (state) {
            if (!RDNode.uiTrans) {
                return;
            }

            if (RDNode.redDot) {
                return;
            }

            let redDot = this._redDotPool.get();
            if (!redDot) {
                redDot = cc.instantiate(this._redDot);
            }
            RDNode.redDot = redDot;
            redDot.setParent(RDNode.uiTrans);
            let contentSize: cc.Size = RDNode.uiTrans.getContentSize();

            redDot.setPosition(contentSize.width / 2, contentSize.height / 2);
        }
        else {
            if (RDNode.redDot) {
                this._redDotPool.put(RDNode.redDot);
                RDNode.redDot = null;
            }
        }
    }

    /**根据红点事件刷新相关节点 */
    protected refreshRedDotByEventType(keyList: string[]) {

        for (const key of keyList) {
            /**红点列表 */
            const redDotNodeList: Array<RedDotNode> = this._registerMap.get(key);

            if (!redDotNodeList) {
                continue;
            }

            let isOn: boolean = this._eventState.get(key);

            for (const rdNode of redDotNodeList) {
                this.refreshRedDot(rdNode, isOn);
            }
        }


        // let preEventKeyList: string[] = [];
        // for (const rdNode of redDotNodeList) {
        //     if (rdNode.preKey) {
        //         if (!preEventKeyList.includes(rdNode.preKey)) {
        //             preEventKeyList.push(rdNode.preKey);
        //         }

        //         this.refreshRedDot(rdNode, isOn);
        //     }

        // }

        // for (const preKey of preEventKeyList) {
        //     this.refreshRedDotByEventType(preKey);
        // }



    }

    /**刷新全部节点 */
    RefreshAll() {
        for (let key in this._registerMap) {
            let node = this._registerMap[key];
            this.refreshRedDot(node, node.isOn);
        }
    }
}

export const RedDotSystem = new _RedDotSystem();

