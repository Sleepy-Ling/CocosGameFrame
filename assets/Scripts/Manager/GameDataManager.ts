import { GameData } from "../Data/GameData";
import ManagerBase from "./ManagerBase";

const { ccclass, property } = cc._decorator;

@ccclass
class _GameDataManager extends ManagerBase {
    init(mTime: number) {
        GameData.initOnLogin(mTime);

        return super.init();
    }

    /**
     *  管理器每帧tick 函数
     * @param nowMSeconds 当前时间戳 单位：毫秒
     * @param deltaTime 距离上一帧时间间隔 单位：秒
     */
    update(nowMSeconds: number, deltaTime?: number,) {
        GameData.UserData.lastOnlineMTime = nowMSeconds;
    }

}

/**
 * 游戏数据管理者
 * @description 尽量使用该管理器进行对GameData数据的修改
 */
export const GameDataManager = new _GameDataManager();
