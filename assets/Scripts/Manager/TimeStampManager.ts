import ManagerBase from "./ManagerBase";

/**时间戳管理者 */
export class TimeStampManager extends ManagerBase {
    protected gamingTimeStamp: number;

    protected gamingTime: number;

    public init(inf?: unknown): boolean {
        this.gamingTimeStamp = Date.now();
        this.gamingTime = 0;

        return super.init(inf);
    }

    public update(deltaTime?: number): void {
        this.gamingTimeStamp += deltaTime * 1000;
        this.gamingTime += deltaTime;
    }

    /**获取游戏中的时间戳 单位：ms */
    public getGamingTimeStamp() {
        return this.gamingTimeStamp;
    }

    /**获取本地的时间戳 单位：ms */
    public getDateTimeStamp() {
        return Date.now();
    }

    public logGamingTime() {
        console.log("当前游戏时长:", this.gamingTime);
    }

    public reset() {
        this.gamingTime = 0;
        this.gamingTimeStamp = Date.now();
    }

}