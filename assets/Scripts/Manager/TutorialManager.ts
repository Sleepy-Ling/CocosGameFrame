import ManagerBase from "./ManagerBase";

import { CustomEvents } from "../Event/CustomEvents";
import { GM } from "../Core/Global/GM";
import { Enum_AssetBundle, Enum_EventType, UIName } from "../Def/EnumDef";
import { MathUtil } from "../Core/Utils/MathUtil";
import { ViewBase } from "../Core/View/ViewBase";
import { IS_LOG_MOUSE_DETAIL } from "../Def/ConstDef";
import { TBDATA_PlayerTutorial } from "../TableData/TBDATA_PlayerTutorial";
import { ViewData } from "./UIManager";
import { PlayerData } from "../Data/PlayerData";

export type TutorialCallback = (err, result) => void;

export interface TutorialTask {
    /**形状 0 长方形 1圆型 */
    shape?: cc.Mask.Type;
    /**是否显示遮罩 */
    showMask: boolean;
    /**点击中心 */
    center?: cc.Vec2;
    /**范围 */
    radius?: number;
    /**宽高 */
    size?: cc.Size;

    /**提示 文本 */
    tips?: string;
    /**提示 世界位置 */
    tipsWorldPosition?: cc.Vec2;
    /**是否能触摸移动 */
    canTouchMove?: boolean;
    /**手指开始移动位置 */
    handFromPos?: cc.Vec2;
    /**手指移动到某个位置 */
    handToPos?: cc.Vec2;
    /**0:一次  1：循环动作 */
    handAction?: number;
    /**动作时长 */
    handActionDuration?: number;

    /**开始回调 */
    startCallback?: TutorialCallback;
    /**结束回调 */
    finishCallback?: TutorialCallback;

    /**是否打开该界面 */
    isForceOpenView?: boolean;
    /**是否为强制引导 */
    isForceTutorial?: boolean;
    /**模块名 */
    bundleName?: string;
    /**目标界面 */
    targetView?: UIName;
    /**目标点击按钮路径 */
    targetBtnPath?: string;
    /**响应的事件id */
    eventID?: string;
    /**可能遇到的失败事件id */
    failEventID?: string;
    /**返回到某个步骤id（在失败时) */
    backToStepIDWhenFail?: number;
}

export class TutorialManager extends ManagerBase {
    protected layer: cc.Node;
    protected node_hand: cc.Node;
    protected _mask: cc.Mask;
    protected lab_tips: cc.Label;

    protected curTaskIdx: number;
    protected curTask: TutorialTask;

    protected tasksList: TutorialTask[];

    public init(layer: cc.Node): boolean {
        this.layer = layer;

        this._mask = cc.find("mask", this.layer)?.getComponent(cc.Mask);
        this.lab_tips = cc.find("node_tips", this.layer)?.getComponentInChildren(cc.Label);
        this.node_hand = cc.find("node_hand", this.layer);


        return true;
    }

    /**根据配置表初始化 */
    public initWithTable(table: Object) {
        let tasksList: TutorialTask[] = [];

        for (const key in table) {
            if (Object.prototype.hasOwnProperty.call(table, key)) {
                const element = table[key] as TBDATA_PlayerTutorial;
                let task: TutorialTask = {
                    shape: element.shape,
                    showMask: element.showMask,
                    center: element.center ? cc.v2(element.center.x, element.center.y) : null,
                    radius: element.radius,
                    size: element.size ? cc.size(element.size.width, element.size.height) : null,
                    tips: element.tips,

                    tipsWorldPosition: element.tipsWorldPosition ? cc.v2(element.tipsWorldPosition.x, element.tipsWorldPosition.y) : null,

                    canTouchMove: element.canTouchMove,

                    handFromPos: element.handFromPos ? cc.v2(element.handFromPos.x, element.handFromPos.y) : null,

                    handToPos: element.handToPos ? cc.v2(element.handToPos.x, element.handToPos.y) : null,

                    handAction: element.handAction,
                    handActionDuration: element.handActionDuration,

                    targetView: element.targetView,
                    targetBtnPath: element.targetBtnPath,
                    eventID: element.eventID,
                }

                tasksList.push(task);
            }
        }

        this.tasksList = tasksList;

    }

    /**根据指引任务初始化 */
    public initTaskList(tasksList: TutorialTask[]) {
        this.tasksList = tasksList;
    }

    protected onBlockTouch(evt: cc.Event.EventTouch) {
        evt.stopPropagation();

    }

    /**设置是否可以点击 */
    public setblockTouchEnable(enabled: boolean) {
        if (enabled) {
            this.layer.on(cc.Node.EventType.TOUCH_START, this.onBlockTouch, this);
        }
        else {
            this.layer.off(cc.Node.EventType.TOUCH_START, this.onBlockTouch, this);
        }
    }

    /**开始指引 需要先执行 initTask 或者 initTable 方法*/
    public startGuide(idx: number) {
        if (this.curTaskIdx == idx) {
            return;
        }

        if (this.curTask) {
            this.curTask.finishCallback && this.curTask.finishCallback(null, this.curTaskIdx);
        }

        this._mask.node.active = true;

        this.layer.targetOff(this);
        this.layer.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.layer.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.layer.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        let eventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.Guide);
        eventDispatcher.Listen(CustomEvents.FinishGuide, this.onFinishGuide, this);
        //监听action 事件
        eventDispatcher.Listen(CustomEvents.OnGuideActionChange, this.onActionChange, this);

        // eventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.UI);
        // eventDispatcher.Listen(CustomEvents.OnViewOpen, this.onViewOpen, this);

        this.refreshGuide(idx);
    }

    /**完成当前阶段的指引 */
    protected onFinishGuide(idx: number) {
        if (this.curTaskIdx != idx) {
            return;
        }
        console.log("onFinishGuide", idx);

        this.lab_tips.node.parent.active = false

        this.curTask.finishCallback && this.curTask.finishCallback(null, this.curTaskIdx);

        this.curTaskIdx++;
        this.refreshGuide(this.curTaskIdx);
    }

    /**监听界面打开事件 (监听响应的按钮）*/
    protected onViewOpen(id: UIName, comp: ViewBase) {
        console.log("监听界面打开事件", id);

        if (this.curTask.targetView != null && this.curTask.targetView == id) {


            let eventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.UI);
            eventDispatcher.OffListen(CustomEvents.OnViewOpen, this.onViewOpen, this)

            if (this.curTask.targetBtnPath) {
                let btnNode = cc.find(this.curTask.targetBtnPath, comp.node);

                if (btnNode) {
                    const clickBtn: Function = () => {
                        this.onFinishGuide(this.curTaskIdx);
                    }

                    btnNode.once(cc.Node.EventType.TOUCH_END, clickBtn);

                }

            }

        }
    }

    protected onActionChange(id: number) {
        let actionID: string = id.toString();
        console.log("onActionChange ====>", actionID);

        //看看是否符合当前的响应事件id，如果符合，则说明引导完成
        if (this.curTask.eventID && this.curTask.eventID == actionID) {
            this.onFinishGuide(this.curTaskIdx);
        }
        else if (this.curTask.failEventID) {
            let failEventIDList: string[] = this.curTask.failEventID.split(',');

            if (failEventIDList.includes(actionID)) {
                console.log("fail ===>", actionID);

                if (this.curTask.backToStepIDWhenFail != null) {
                    console.log("back to ==>", this.curTask.backToStepIDWhenFail);

                    this.refreshGuide(this.curTask.backToStepIDWhenFail);
                }
                else {
                    console.error("无法跳转，跳转id 为空");

                }
            }
        }

    }

    protected refreshGuide(idx: number) {
        console.log("refreshGuide", idx);

        this.curTaskIdx = idx;
        this.curTask = this.tasksList[idx];
        if (this.curTask == null || PlayerData.isDebugPassPlayerTutorial) {
            this.lab_tips.node.parent.active = false
            this._mask.node.active = false;
            this.node_hand.active = false;
            this.layer.targetOff(this);

            let eventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.Guide);
            eventDispatcher.OffAllListenOfTarget(this);

            eventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.UI);
            eventDispatcher.OffAllListenOfTarget(this);

            this.curTaskIdx = null;
            console.log("all guide finish !");

            return;
        }


        if (this.curTask.targetBtnPath) {//当前需要监听指定点击按钮
            //目标的界面是否已经打开了
            let isShowingView = GM.uiManager.GetUIIsShowing(this.curTask.targetView);

            let comp = GM.uiManager.GetUI(this.curTask.targetView);

            if (isShowingView) {
                let btnNode = cc.find(this.curTask.targetBtnPath, comp.node);

                if (btnNode) {

                    const clickBtn: Function = () => {
                        this.onFinishGuide(this.curTaskIdx);
                    }

                    btnNode.once(cc.Node.EventType.TOUCH_END, clickBtn);

                }
            }
            else {//目标的界面还没打开，则监听它的打开事件，然后再监听指定按钮点击事件
                let eventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.UI);
                eventDispatcher.Listen(CustomEvents.OnViewOpen, this.onViewOpen, this);
            }
        }

        if (this.curTask.isForceOpenView) {
            GM.uiManager.OpenUI(this.curTask.targetView, null, this.curTask.bundleName as Enum_AssetBundle);
        }

        // if (this.curTask.targetView) {
        //     GM.uiManager.OpenUI(this.curTask.targetView, null, this.curTask.bundleName as Enum_AssetBundle);
        // }

        this._mask.node.active = this.curTask.showMask;

        if (this.curTask.showMask) {
            let localPosition = this._mask.node.parent.convertToNodeSpaceAR(this.curTask.center);
            this._mask.node.setPosition(localPosition);

            if (this.curTask.shape == cc.Mask.Type.RECT) {
                this._mask.node.setContentSize(this.curTask.size.width, this.curTask.size.height);
            }
            else if (this.curTask.shape == cc.Mask.Type.ELLIPSE) {
                let v: number = this.curTask.radius * 2;
                this._mask.node.setContentSize(v, v);
            }

            this._mask.type = this.curTask.shape == null ? cc.Mask.Type.ELLIPSE : this.curTask.shape;

            console.log("this._mask.type", this._mask.type);

        }

        this.curTask.startCallback && this.curTask.startCallback(null, this.curTaskIdx);

        if (this.lab_tips) {
            this.lab_tips.node.parent.active = this.curTask.tips != null && this.curTask.tips.length > 0;
            if (this.curTask.tips) {
                this.lab_tips.string = this.curTask.tips;

                let labPos = this.lab_tips.node.parent.parent.convertToNodeSpaceAR(this.curTask.tipsWorldPosition);
                this.lab_tips.node.parent.setPosition(labPos);
            }

        }

        this.node_hand.active = this.curTask.handAction != null;

        cc.Tween.stopAllByTarget(this.node_hand);
        if (this.curTask.handAction != null) {
            let fromPos = this.curTask.handFromPos ? this.node_hand.parent.convertToNodeSpaceAR(this.curTask.handFromPos) : cc.v2();
            let toPos = this.curTask.handToPos ? this.node_hand.parent.convertToNodeSpaceAR(this.curTask.handToPos) : cc.v2();

            this.node_hand.setPosition(fromPos);
            const tween = cc.tween(this.node_hand);

            if (this.curTask.handAction == 0) {
                tween.set({ position: cc.v3(fromPos) });
            }
            else if (this.curTask.handAction == 1) {
                tween.to(this.curTask.handActionDuration * 0.5, { position: cc.v3(toPos) });
                tween.to(this.curTask.handActionDuration * 0.5, { position: cc.v3(fromPos) });
                tween.union();
                tween.repeatForever();
            }
            else if (this.curTask.handAction == 3) {
                tween.to(this.curTask.handActionDuration * 0.5, { position: cc.v3(toPos) });
                tween.delay(1);
                tween.set({ position: cc.v3(fromPos) }).union();
                tween.repeatForever();
            }

            tween.start();
        }
    }

    public clear() {
        if (this.layer) {
            this.layer.targetOff(this);
        }
        this.curTaskIdx = null;

        this.layer = null;
        this.node_hand = null;
        this._mask = null;
        this.lab_tips = null;

        this.curTaskIdx = null;
        this.curTask = null;

        this.tasksList = [];

        if (this._mask) {
            this._mask.node.active = false;
        }

        let eventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.Guide);
        eventDispatcher.OffAllListenOfTarget(this);
    }

    /**
     * 是否进行中
     */
    public isRunning() {
        return this.curTaskIdx != null;
    }

    /**获取当前任务信息 */
    public getCurTaskInf(): Readonly<TutorialTask> {
        return this.curTask;
    }

    /**返回当前任务索引 */
    public getTaskIndex() {
        return this.curTaskIdx;
    }

    /**
     * 事件的吞没处理机制
     */
    onTouchStart(event: cc.Event.EventTouch) {
        // if (!this._mask.node.active) {

        //     this.layer["_touchListener"].setSwallowTouches(false);

        //     return;

        // }

        // return;

        let worldPosition = event.getLocation();

        this.layer["_touchListener"].setSwallowTouches(false);

        if (!this.curTask.isForceTutorial) {//非强制引导
            if (this._mask.node.active) {
                this._mask.node.active = false;
            }

            if (this.node_hand.active) {
                this.node_hand.active = false;
            }

            return;
        }

        if (this.curTask.shape == cc.Mask.Type.RECT) {
            let xMin: number = this.curTask.center.x - this.curTask.size.width / 2;
            let xMax: number = this.curTask.center.x + this.curTask.size.width / 2;

            let yMin: number = this.curTask.center.y - this.curTask.size.height / 2;
            let yMax: number = this.curTask.center.y + this.curTask.size.height / 2;

            let isHit: boolean = xMin <= worldPosition.x && xMax >= worldPosition.x && yMin <= worldPosition.y && yMax >= worldPosition.y;

            this.layer["_touchListener"].setSwallowTouches(!isHit);

            console.log("setSwallowTouches", !isHit);
        }
        else if (this.curTask.shape == cc.Mask.Type.ELLIPSE) {
            let dis = this.curTask.center.sub(worldPosition).len();

            this.layer["_touchListener"].setSwallowTouches(dis > this.curTask.radius);

            console.log("setSwallowTouches", dis > this.curTask.radius);
        }

    }

    onTouchMove(event: cc.Event.EventTouch) {
        if (!this.curTask.isForceTutorial) {//非强制引导
            return;
        }

        if (event.getDelta().lengthSqr() > 0 && !this.curTask.canTouchMove) {
            console.log("dont move in tutorial");
            this.layer["_touchListener"].setSwallowTouches(true);
            return;
        }
    }

    onTouchEnd(event: cc.Event.EventTouch) {
        // console.log("event", event.target.name);
    }
}
