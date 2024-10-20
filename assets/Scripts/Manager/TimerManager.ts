import { Util } from "../Core/Utils/Util";
import ManagerBase from "./ManagerBase";

/**计时器事件 */
export interface ITimerEvent {
    /**循环次数 大于0（小于等于0 则无限循环） */
    repeatTimes: number;
    /**循环间隔 单位：秒 */
    repeatInterval: number;
    /**执行的回调 */
    func: Function;
    /**执行回调对象 */
    target: unknown;
}

export class TimerEventObject implements ITimerEvent {
    repeatTimes: number;
    repeatInterval: number;
    func: Function;
    target: unknown;

    /**当前计时器 记录时长 */
    curTime: number;
    /**标识符 用于表示当前计时器失效，需要被删除 */
    waitForDelete: boolean;

    id: string;

    constructor(event: ITimerEvent, id: string) {
        this.repeatTimes = event.repeatTimes;
        this.repeatInterval = event.repeatInterval;
        this.func = event.func;
        this.target = event.target;

        this.curTime = 0;
        this.waitForDelete = false;
        this.id = id;
    }
}

export default class TimerManager extends ManagerBase {
    protected timerList: TimerEventObject[];

    private _clearDataTimer: number = 0;

    /**移除无效数据时间间隔 */
    public static readonly Remove_Useless_Data_Interval: number = 1;

    public init(...inf: unknown[]): boolean {
        this.timerList = [];

        this._clearDataTimer = 0;

        return true;
    }

    public update(deltaTime?: number): void {
        for (const obj of this.timerList) {
            obj.curTime += deltaTime;

            if (obj.waitForDelete) {
                continue;
            }

            if (obj.curTime >= obj.repeatInterval) {
                obj.curTime -= obj.repeatInterval;
                obj.repeatTimes--;

                if (obj.func) {
                    obj.func.apply(obj.target);
                }

                if (obj.repeatTimes == 0) {
                    obj.waitForDelete = true;
                }
            }
        }

        this._clearDataTimer += deltaTime;
        if (this._clearDataTimer >= TimerManager.Remove_Useless_Data_Interval) {
            this.clearUselessData();
            this._clearDataTimer -= TimerManager.Remove_Useless_Data_Interval;
        }

    }

    /**增加计时器 */
    public addTimer(param: ITimerEvent) {
        let id: string = this.generateUID();
        const timer: TimerEventObject = new TimerEventObject(param, id);
        this.timerList.push(timer);

        return id;
    }

    /**通过id 移除计时器 */
    public removeTimerByID(id: string) {
        const timer: TimerEventObject = this.timerList.find((value) => {
            return value.id == id;
        })

        if (timer == null) {
            return false;
        }

        timer.waitForDelete = true;

        return true;
    }

    /**移除相关对象的计时器 */
    public removeTimerByTarget(target: unknown) {
        this.timerList.forEach((value) => {
            if (value.target == target) {
                value.waitForDelete = true;
            }
        })

    }

    /**移除相关对象的计时器 */
    public removeTimerByFunc(func: Function, target: unknown) {
        this.timerList.forEach((value) => {
            if (value.target == target && value.func == func) {
                value.waitForDelete = true;
            }
        })
    }

    /**立刻清理无效计时器数据（通常不用手动调用，一定时间间隔自动会清除） */
    public clearUselessData() {
        if (this.timerList.length <= 0) {
            return;
        }

        this.timerList = this.timerList.filter((value) => {//清除失效的计时器
            return !value.waitForDelete
        })

        // console.log("Timer manager clear data", this.timerList);
    }

    /**立刻清除全部数据 */
    public clearAllDataImmediately() {
        this.timerList = [];
    }

    /**生成Uid */
    protected generateUID() {
        return Util.getUidWithTimestamp();
    }
}
