import { CalcUtil } from "../Core/Utils/CalcUtil";
import { GM } from "../Core/Global/GM";
import { LogUtil } from "../Core/Utils/LogUtil";
import { MathUtil } from "../Core/Utils/MathUtil";
import { GameData } from "../Data/GameData";
import { DISCOUNT_ACTIVITY_VALID_TIME, IS_DEBUG, LogEvent, MAX_TASK_COUNT, SP_ACTIVITY_VALID_TIME } from "../Def/ConstDef";
import { ConfigType, Enum_UnlockType, Enum_OwnerSubject, Enum_UserSettingType, Enum_Language, Enum_EventType, Enum_Currency, Enum_Difficulty, Enum_LevelPassState, Enum_EquipmentType, Enum_TechnicType, Enum_RewardState, Enum_TaskFinishType, Enum_RewardItemType, Enum_PlaneEquipmentPlace, Enum_DamageType, Enum_RealCurrency, Enum_GameMode, Enum_ActivityCurrency, Enum_EquipmentQuality, Enum_EngineEquipmentPlace, UIName, Enum_AssetBundle, Enum_Layer, Enum_TutorialFirstTips, Enum_OnlineParam } from "../Def/EnumDef";

import { EquipmentPlace, ICostData, IEngineData, IEquipmentGoods, IEquipmentInf, ILevelRecord, IMileageShopBoardData, IModuleBoardData, IObjectData, IPlaceElementDetailInf, IPlaneData, IPlaneTroopDetail, ISkillData, ISpModeShopBoardData, ITutorialBackupdata, IWingmanData, RewardBase, RewardDisplayData, TaskRecordBase } from "../Def/StructDef";
import { CustomEvents } from "../Event/CustomEvents";
import { TBDATA_Engine } from "../TableData/TBDATA_Engine";
import { TBDATA_Plane } from "../TableData/TBDATA_Plane";
import { TBDATA_Task } from "../TableData/TBDATA_Task";
import { TBDATA_Wingman } from "../TableData/TBDATA_Wingman";
import ManagerBase from "./ManagerBase";
import { TBDATA_Equipment } from "../TableData/TBDATA_Equipment";
import { TBDATA_MilitaryRank } from "../TableData/TBDATA_MilitaryRank";
import { TBDATA_Purchase } from "../TableData/TBDATA_Purchase";
import { TBDATA_SpecialActivity } from "../TableData/TBDATA_SpecialActivity";
import { TBDATA_DiscountActivity } from "../TableData/TBDATA_DiscountActivity";
import { TBDATA_Shop } from "../TableData/TBDATA_Shop";
import { SDKManager } from "../SDK/SDKManager";
import { PlayerData } from "../Data/PlayerData";
import { UpgradeMilitaryPopupViewParam } from "../../AssetsBundles/PopUpView/Scripts/UpgradeMilitaryPopupView";
import { Ad_DoubleRewardViewParam } from "../../AssetsBundles/PopUpView/Scripts/Ad_DoubleRewardView";
import { TBDATA_Vip } from "../TableData/TBDATA_Vip";
import { StringUtil } from "../Core/Utils/StringUtil";
import { TBDATA_LuckyRaffleFinalReward } from "../TableData/TBDATA_LuckyRaffleFinalReward";
import UpgradeVipPopupView, { UpgradeVipPopupViewParam } from "../../AssetsBundles/PopUpView/Scripts/UpgradeVipPopupView";


/**
 * 游戏数据管理者
 * @description 尽量使用该管理器进行对GameData数据的修改
 */
export default class GameDataManager extends ManagerBase {
    nowMSeconds: number;
    userInfo;

    isNewPlayer: boolean = false;

    init(mTime: number) {
        this.nowMSeconds = mTime;
        let loginInf = GameData.initOnLogin(mTime);
        let isNewDay = loginInf.isNewDay;
        let isNewPlayer = loginInf.isNewPlayer;
        if (isNewDay) {
            GameData.WatchAdData.todayFreePickSustainBuff = true;

            let curSignInDays = this.addSignInDays();

            this.setTodayResetModuleBoard(false);
            console.log("sign in success !", curSignInDays);

            this.setTodayWatchAdBoxTimes(0);

            let spGameMode: Enum_GameMode[] = [
                Enum_GameMode.Assault,
                Enum_GameMode.Barrage,
                Enum_GameMode.Escort,
                Enum_GameMode.Secret,
            ]
            for (let index = 0; index < spGameMode.length; index++) {
                const element = spGameMode[index];
                this.setSpGameFreeTimes(element, 3);
            }

            this.setIsFirstSevenSignIn(false);

            if (isNewPlayer) {
                SDKManager.LogEvent(LogEvent.FIRST_ENTER_GAME);
            }

            GameData.LuckyRaffleData.todayDrawTimes = 0;
        }


        this.isNewPlayer = isNewPlayer;

        return super.init();
    }

    /**在配置表都加载完后初始化 */
    initAfterConfigLoadFinish() {
        let keys: number[];
        if (GameData.BagData.plane == null) {
            GameData.BagData.plane = {};
            const table = GM.configManager.syncGetConfigByType(ConfigType.Table_Plane);
            keys = Object.keys(table).map((v) => { return Number(v) });
            for (const k of keys) {
                if ((table[k] as TBDATA_Plane).unlock_type == Enum_UnlockType.None) {
                    this.unlockObject(Enum_OwnerSubject.Plane, k);
                }
            }
        }

        if (GameData.BagData.wingman == null) {
            GameData.BagData.wingman = {};
            const table = GM.configManager.syncGetConfigByType(ConfigType.Table_Wingman);
            keys = Object.keys(table).map((v) => { return Number(v) });
            for (const k of keys) {
                if ((table[k] as TBDATA_Wingman).unlock_type == Enum_UnlockType.None) {
                    this.unlockObject(Enum_OwnerSubject.Wingman, k);
                }
            }
        }

        if (GameData.BagData.engine == null) {
            GameData.BagData.engine = {};
            const table = GM.configManager.syncGetConfigByType(ConfigType.Table_Engine);
            keys = Object.keys(table).map((v) => { return Number(v) });
            for (const k of keys) {
                if ((table[k] as TBDATA_Engine).unlock_type == Enum_UnlockType.None) {
                    this.unlockObject(Enum_OwnerSubject.Engine, k);
                }
            }
        }

        if (GameData.TaskData.curTaskList == null || GameData.TaskData.curTaskList.length <= 0) {
            for (let i = 0; i < MAX_TASK_COUNT; i++) {
                const taskID = this.randomGetTaskID();
                const taskRecord: TaskRecordBase = {
                    id: taskID,
                    curCount: 0
                }

                GameData.TaskData.curTaskList.push(taskRecord);
            }

            console.log("GameData.TaskData.curTaskList", GameData.TaskData.curTaskList);

            GameData.markChange(GameData.TaskData.name);
        }

        let hasRefreshedModuleBoardsInTodayZero = this.getTodayResetModuleBoard();
        if (!hasRefreshedModuleBoardsInTodayZero) {
            this.moduleShopCheck();
            this.setTodayResetModuleBoard(true);
        }

        let hasRefreshedSpBoardsInTodayZero = this.getTodayResetSpModeShopBoard();

        if (!hasRefreshedSpBoardsInTodayZero) {
            this.SpGameModeShopCheck();
            this.setTodayResetSpModeShopBoard(true);
        }

        let hasRefreshedMileageBoardsInTodayZero = this.getTodayResetMileageShopBoard();

        if (!hasRefreshedMileageBoardsInTodayZero) {
            this.MileageShopCheck();
            this.setTodayResetMileageShopBoard(true);
        }

        // this.getacti
    }

    public dailyCheck(mTime: number) {
        console.log("dailyCheck");

        this.init(mTime);
        this.initAfterConfigLoadFinish();
    }

    /**体力检测 */
    public powerCheck(mTime: number) {
        let elapsedTime = mTime - GameData.UserData.powerLastUpdateTimeStamp;

        let interval: number = GM.configManager.update_power_interval * 1000;
        let maxPower: number = GM.configManager.power_max;
        if (GameData.UserData.power < maxPower && elapsedTime >= interval) {
            GameData.UserData.powerLastUpdateTimeStamp = mTime;

            let add = Math.floor(elapsedTime / interval);
            console.log("add power", add);
            let nowPower = GameData.UserData.power;
            nowPower = MathUtil.clamp(nowPower + add, nowPower, maxPower);

            this.setPower(nowPower);
        }
    }

    /**
     *  管理器每帧tick 函数
     * @param nowMSeconds 当前时间戳 单位：毫秒
     * @param deltaTime 距离上一帧时间间隔 单位：秒
     */
    update(nowMSeconds: number, deltaTime?: number,) {
        this.nowMSeconds = nowMSeconds;

        GameData.UserData.lastOnlineMTime = nowMSeconds;
    }

    /**进行数据保存 */
    public saveData() {
        GameData.saveAllChangedData();
    }

    /**立刻保存全部数据 */
    public saveAllDataImmediately() {
        GameData.saveAllData();
    }

    /**每秒更新 */
    public updateInEachSecond(mTime: number) {

    }

    /**每分钟更新 */
    public updateInEachMinute(mTime: number) {
        this.dailyCheck(mTime);
        this.powerCheck(mTime);
    }

    /**
     * 更改玩家设置
     * @param type 
     * @param isOn 
     */
    public changeUserSetting(type: Enum_UserSettingType, value: number) {
        switch (type) {
            case Enum_UserSettingType.SoundsEff:
                GameData.SettingData.effect = value;
                break;
            case Enum_UserSettingType.BGM:
                GameData.SettingData.sound = value;
                break;
            case Enum_UserSettingType.Vibrate:
                GameData.SettingData.vibration = value;
                break;
            case Enum_UserSettingType.Sensitivity:
                GameData.SettingData.sensitivity = value;
                break;
            case Enum_UserSettingType.GameControlMode:
                GameData.SettingData.gameControlMode = value;
                break;
            case Enum_UserSettingType.GameUIMode:
                GameData.SettingData.gameUIMode = value;
                break;

            default:
                break;
        }

        console.log("changeUserSetting", type, value);

        GameData.SettingData.SaveData();
        GameData.markChange(GameData.SettingData.name);
    }

    /**获取用户设置 */
    getUserSetting(type: Enum_UserSettingType) {
        if (type == Enum_UserSettingType.SoundsEff) {
            return GameData.SettingData.effect;

        }
        else if (type == Enum_UserSettingType.BGM) {
            return GameData.SettingData.sound;
        }
        else if (type == Enum_UserSettingType.Vibrate) {
            return GameData.SettingData.vibration;
        }
        else if (type == Enum_UserSettingType.Sensitivity) {
            return GameData.SettingData.sensitivity;
        }
        else if (type == Enum_UserSettingType.GameControlMode) {
            return GameData.SettingData.gameControlMode;
        }
        else if (type == Enum_UserSettingType.GameUIMode) {
            return GameData.SettingData.gameUIMode;
        }
    }

    public getLanguage(): Enum_Language {
        return GameData.SettingData.language as Enum_Language || Enum_Language.CN;
    }
    public setLanguage(value: Enum_Language) {
        GameData.SettingData.language = value;
        GameData.markChange(GameData.SettingData.name);
    }

    /*------------------飞机队伍数据模块相关------------------ */
    //#region
    public getTroopIsUnlock(index: number) {
        return GameData.PlaneTroopsData.unlockIndex.includes(index);
    }

    public setTroopData(index: number, data: IPlaneTroopDetail) {
        if (isNaN(index)) {
            console.error("setTroopData error");
            return;
        }

        if (index < 0 || index >= 4) {
            console.error("setTroopData error");
            return;
        }

        GameData.PlaneTroopsData.troopsData[index] = data;
        for (let i = 0; i < GameData.PlaneTroopsData.troopsData.length; i++) {
            const element = GameData.PlaneTroopsData.troopsData[i];
            if (index == i || element == null) {
                continue;
            }

            if (element.planeID == data.planeID) {
                element.planeID = null;
            }
            if (element.wingmanID == data.wingmanID) {
                element.wingmanID = null;
            }
            if (element.engineID == data.engineID) {
                element.engineID = null;
            }
        }

        console.log("setTroopData ==> index", index, "data", data);

        const eventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.PlaneTroop);
        eventDispatcher.Emit(CustomEvents.OnTroopDataChange, index, data);

        GameData.markChange(GameData.PlaneTroopsData.name);
    }

    public getTroopData(index: number): IPlaneTroopDetail {
        return GameData.PlaneTroopsData.troopsData[index];
    }

    public getIsInAnyTroop(type: Enum_OwnerSubject, id: number) {
        if (id == null || isNaN(id)) {
            console.error("getIsInAnyTroop error : id error");
            return -1;
        }

        if (type == null) {
            console.error("getIsInAnyTroop error : type error");
            return -1;
        }

        return GameData.PlaneTroopsData.troopsData.findIndex((value) => {
            if (type == Enum_OwnerSubject.Plane) {
                return value.planeID == id;
            }
            else if (type == Enum_OwnerSubject.Wingman) {
                return value.wingmanID == id;
            }
            else if (type == Enum_OwnerSubject.Engine) {
                return value.engineID == id;

            }
        })
    }

    public unlockTroop(index: number) {
        if (isNaN(index)) {
            console.error("unlockTroop error");
            return;
        }

        if (index < 0 || index >= 4) {
            console.error("unlockTroop error");
            return;
        }

        console.log("unlockTroop", index);


        if (!GameData.PlaneTroopsData.unlockIndex.includes(index)) {
            GameData.PlaneTroopsData.unlockIndex.push(index);
            GameData.PlaneTroopsData.troopsData[index] = {};

            GameData.markChange(GameData.PlaneTroopsData.name);
        }
    }

    /**返回指定队伍的指定类型对象id */
    public getObjectIDInTroop(troopIdx: number, type: Enum_OwnerSubject) {
        const troopData = this.getTroopData(troopIdx);
        if (!troopData) {
            return -1;
        }

        let id: number = -1;
        switch (type) {
            case Enum_OwnerSubject.Plane:
                id = troopData.planeID
                break;
            case Enum_OwnerSubject.Wingman:
                id = troopData.wingmanID
                break;
            case Enum_OwnerSubject.Engine:
                id = troopData.engineID
                break;
            default:
                id = troopData.planeID
                break;
        }

        return id;
    }

    //#endregion
    /*------------------飞机队伍数据模块相关 end------------------ */

    /*------------------货币数据模块相关------------------ */
    //#region
    public getCurrency(type: Enum_Currency) {
        return GameData.BagData.currency[type] || 0;
    }

    public addCurrency(type: Enum_Currency, add: number) {
        let now = this.getCurrency(type);
        let next = now + add;
        if (next < 0) {
            return false;
        }

        if (add > 0) {
            let finishTaskType: Enum_TaskFinishType;
            if (type == Enum_Currency.Diamond) {
                finishTaskType = Enum_TaskFinishType.Get_Diamond;
            }
            else if (type == Enum_Currency.Gold) {
                finishTaskType = Enum_TaskFinishType.Get_Gold;
            }

            if (finishTaskType) {
                GM.gameDataManager.addTasksFinishCount(finishTaskType, Math.abs(add));
            }
        }


        if (add < 0) {//当前为消费货币

            let finishTaskType: Enum_TaskFinishType;
            if (type == Enum_Currency.Gold) {
                finishTaskType = Enum_TaskFinishType.Consume_Gold;
            }
            else if (type == Enum_Currency.Diamond) {
                finishTaskType = Enum_TaskFinishType.Consume_Diamond;
            }

            if (finishTaskType) {
                GM.gameDataManager.addTasksFinishCount(finishTaskType, Math.abs(add));
            }
        }

        console.log("addCurrency ", type, add);

        this.setCurrency(type, next);

        return true;
    }

    public setCurrency(type: Enum_Currency, num: number) {
        GameData.BagData.currency[type] = num;

        let eventDispatcherManager = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.Currency);
        eventDispatcherManager.Emit(CustomEvents.OnCurrencyChange);

        GameData.markChange(GameData.BagData.name);
    }

    public isCurrencyEnough(type: Enum_Currency, cost: number) {
        return this.getCurrency(type) >= cost;
    }
    //#endregion
    /*------------------货币数据模块相关 end------------------ */

    /*------------------碎片模块相关------------------ */
    //#region
    /**
     * 获取对应id碎片
     * @param id 如果id为null 则 获取对应通用类型碎片
     * @param type 
     * @returns 
     */
    public getChip(id: number, type: Enum_OwnerSubject) {
        if (id == null) {
            return GameData.BagData.commomChip[type] || 0;
        }
        else {
            return GameData.BagData.chip[type][id] || 0;
        }
    }

    public setChip(id: number, count: number, type: Enum_OwnerSubject) {
        if (id == null) {
            GameData.BagData.commomChip[type] = count;
        }
        else {
            GameData.BagData.chip[type][id] = count;
        }

        GameData.markChange(GameData.BagData.name);
    }

    /**
     * 新增对应id碎片
     * @param id 如果id为null 则 获取对应通用类型碎片
     * @param type 
     * @returns 
     */
    public addChip(id: number, add: number, type: Enum_OwnerSubject) {
        let now: number = this.getChip(id, type);

        let next = now + add;
        if (next < 0) {
            return false;
        }

        console.log("addChip ", id, type, add);

        this.setChip(id, next, type);

        return true;
    }
    //#endregion
    /*------------------碎片模块相关 end------------------ */

    /*------------------体力模块相关------------------ */
    //#region
    public getPower() {
        return GameData.UserData.power;
    }

    public addPower(add: number) {
        this.powerCheck(this.nowMSeconds);
        let now = this.getPower();
        let next = now + add;
        if (next < 0) {
            return false;
        }

        console.log("addPower", add);

        this.setPower(next);

        return true;
    }

    public setPower(num: number) {
        GameData.UserData.power = num;
        let eventDispatcherManager = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.Power);
        eventDispatcherManager.Emit(CustomEvents.OnPowerChange);

        GameData.markChange(GameData.UserData.name);
    }
    //#endregion
    /*------------------体力模块相关 end------------------ */

    /*------------------关卡模块相关------------------ */
    //#region
    /**
     * 记录关卡首次通关奖励已经被领取
     */
    public setLevelFirstPassRewardState(lv: number, difficulty: Enum_Difficulty): boolean {
        if (lv - 1 < 0) {
            return false;
        }

        const data: ILevelRecord = this.getLevelRecordData(lv);
        if (!data.firstPassReward.includes(difficulty)) {
            data.firstPassReward.push(difficulty);

            GameData.markChange(GameData.LevelData.name);

            return true;
        }

        return false;
    }
    /**
     * 获得关卡首次通关奖励领取情况
     * @returns 返回一个数组，里面记录了对应难度的领取情况
     */
    public getLevelFirstPassRewardState(lv: number): ReadonlyArray<Enum_Difficulty> {
        if (lv - 1 < 0) {
            return null;
        }

        const data: ILevelRecord = this.getLevelRecordData(lv);
        return data.firstPassReward;
    }

    /**获取关卡通关状态 */
    public getLevelPassState(lv: number, difficulty: Enum_Difficulty): Readonly<Enum_LevelPassState> {
        if (lv - 1 < 0) {
            return null;
        }

        const data: ILevelRecord = this.getLevelRecordData(lv);

        if (data && data.difficultyState[difficulty]) {
            return data.difficultyState[difficulty]
        }

        return Enum_LevelPassState.Lock;
    }

    /**设置关卡状态 */
    public setLevelState(lv: number, difficulty: Enum_Difficulty, state: Enum_LevelPassState): boolean {
        if (lv - 1 < 0) {
            return false;
        }

        let data: ILevelRecord = this.getLevelRecordData(lv);
        if (data == null) {
            data = {
                difficultyState: {},
                firstPassReward: [],
            }
        }

        if (data.difficultyState[difficulty] != state) {
            data.difficultyState[difficulty] = state;
            GameData.LevelData.normalRecordList[lv] = data;
            GameData.markChange(GameData.LevelData.name);
        }

        return true;
    }

    /**获取关卡记录数据 */
    public getLevelRecordData(lv: number) {
        if (lv < 1) {
            return null;
        }

        let data: ILevelRecord = GameData.LevelData.normalRecordList[lv];
        if (data == null) {
            data = {
                difficultyState: {},
                firstPassReward: [],
            }
        }

        return data;
    }

    /**获得对应关卡星星数 */
    public getLevelStars(lv: number) {
        let data: ILevelRecord = this.getLevelRecordData(lv);
        if (data == null) {
            return 0;
        }

        let stars: number = 0;
        if (data.difficultyState[Enum_Difficulty.Primary] == Enum_LevelPassState.Pass) {
            stars++;
        }
        if (data.difficultyState[Enum_Difficulty.Junior] == Enum_LevelPassState.Pass) {
            stars++;
        }
        if (data.difficultyState[Enum_Difficulty.Senior] == Enum_LevelPassState.Pass) {
            stars++;
        }

        return stars;
    }

    /**获取当前玩第几个系列 */
    public getPlayingSeason() {
        const list = GameData.LevelData.normalRecordList;

        let season = Math.ceil((list.length - 1) / GM.configManager.lv_count_in_one_season);

        season = Math.min(season, GM.configManager.max_count_seasons);
        return season || 1;
    }

    /**获取某个系列的星星数 */
    public getStarsInSeason(season: number) {
        let startLv: number = (season - 1) * GM.configManager.lv_count_in_one_season + 1;
        let t: number = 0;
        let stars: number = 0;
        while (t < GM.configManager.lv_count_in_one_season) {
            stars += this.getLevelStars(startLv + t);
            t++;
        }

        return stars;
    }

    /**当前系列是否解锁 */
    public isSeasonUnlock(season: number) {
        let lv: number = (season - 1) * GM.configManager.lv_count_in_one_season + 1;
        let data = this.getLevelRecordData(lv);;

        if (!data) {
            return false;
        }

        if (data.difficultyState[Enum_Difficulty.Primary] == null) {
            return false;
        }

        return data.difficultyState[Enum_Difficulty.Primary] != Enum_LevelPassState.Lock;
    }

    /**设置关卡系列领取情况  */
    public setSeasonRewardState(season_id: number, rewardLv: number) {
        GameData.LevelData.seasonRewardRecord[season_id] = rewardLv;

        GameData.markChange(GameData.LevelData.name);
    }

    /**获取关卡系列领取情况 0：则未领取任何等级 1：已经领取等级1奖励 */
    public getSeasonRewardState(season_id: number) {
        return GameData.LevelData.seasonRewardRecord[season_id] || 0;
    }

    /**获得当前正在游玩的关卡 */
    public getCurPlayingLevel() {
        return GameData.LevelData.normalRecordList.length - 1;
    }
    //#endregion
    /*------------------关卡模块相关 end------------------ */

    /*------------------飞机僚机引擎模块相关 ------------------ */
    //#region

    /**获取拥有的飞机列表 */
    public getOwnObjectList(type: Enum_OwnerSubject) {
        switch (type) {
            case Enum_OwnerSubject.Plane:
                return GameData.BagData.plane;
                break;
            case Enum_OwnerSubject.Wingman:
                return GameData.BagData.wingman;
                break;
            case Enum_OwnerSubject.Engine:
                return GameData.BagData.engine;
                break;
        }
    }

    public getIsPlaneUnlock(id: number) {
        let keys = Object.keys(GameData.BagData.plane);
        const isUnlock = keys.find((value) => {
            return Number(value) == id;
        })

        return isUnlock;
    }

    public getPlaneData(id: number): IPlaneData {
        let result: IPlaneData = {
            equipment: undefined,
            lv: 0,
            skill: undefined,
            stars: 1,
            shape: 0,
            isUnlock: false
        }

        let data = GameData.BagData.plane[id];
        result = data == null ? result : data;

        return result;
    }

    public getObjectData(type: Enum_OwnerSubject, id: number): IObjectData {
        if (type == Enum_OwnerSubject.None || id == null) {
            return null;
        }

        let result: IObjectData = {
            lv: 0,
            stars: 1,
            skill: {},
            shape: 0,
            isUnlock: false
        }

        if (type == Enum_OwnerSubject.Plane) {
            let data = GameData.BagData.plane[id];
            (result as IPlaneData).equipment = {};
            result = data == null ? result : data;
        }
        else if (type == Enum_OwnerSubject.Wingman) {
            let data = GameData.BagData.wingman[id];
            let d = (result as IWingmanData)
            d.equipment_1 = {};
            d.equipment_2 = {};
            result = data == null ? result : data;
        }
        else if (type == Enum_OwnerSubject.Engine) {
            let data = GameData.BagData.engine[id];
            (result as IEngineData).equipment = {};
            result = data == null ? result : data;
        }

        return result;
    }

    public setObjectData(type: Enum_OwnerSubject, id: number, data: IObjectData): void {
        if (type == Enum_OwnerSubject.Plane) {
            GameData.BagData.plane[id] = data as IPlaneData;
        }
        else if (type == Enum_OwnerSubject.Wingman) {
            GameData.BagData.wingman[id] = data as IWingmanData;
        }
        else if (type == Enum_OwnerSubject.Engine) {

            GameData.BagData.engine[id] = data as IEngineData;
        }

        console.log("setObjectData", type, id, data);

        GameData.markChange(GameData.BagData.name);
    }

    public getObjectIsUnlock(type: Enum_OwnerSubject, id: number): boolean {
        // let keys: string[];
        let data: Record<number, IObjectData>;

        if (type == Enum_OwnerSubject.Plane) {
            data = GameData.BagData.plane;
        }
        else if (type == Enum_OwnerSubject.Wingman) {
            data = GameData.BagData.wingman;
        }
        else if (type == Enum_OwnerSubject.Engine) {
            data = GameData.BagData.engine;
        }

        if (data == null || data[id] == null) {
            return false;
        }

        return data[id].isUnlock;
    }

    public unlockObject(type: Enum_OwnerSubject, id: number): void {
        if (this.getObjectIsUnlock(type, id)) {
            console.error("repeat unlock same object");
            return;
        }

        console.log("unlockObject", type, id);

        let init_lv: number = 0;
        switch (type) {
            case Enum_OwnerSubject.Plane:
                {
                    let cfg = GM.configManager.getPlaneCfgByID(id);
                    init_lv = cfg.init_lv || 0;

                    let skill = {};
                    for (let i = 0; i < GM.configManager.getPassiveSkillCount(type); i++) {
                        let skillData: ISkillData = {
                            lv: 0
                        }
                        skill[i] = skillData;
                    }
                    let stars: number = CalcUtil.getStarsByLv(init_lv, type, true);
                    GameData.BagData.plane[id] = { lv: init_lv, equipment: {}, skill: skill, stars: stars, shape: 0, isUnlock: true };
                }
                break;
            case Enum_OwnerSubject.Wingman:
                {
                    let cfg = GM.configManager.getWingmanCfgByID(id);
                    init_lv = cfg.init_lv || 0;

                    let skill = {};
                    for (let i = 0; i < GM.configManager.getPassiveSkillCount(type); i++) {
                        let skillData: ISkillData = {
                            lv: 0
                        }
                        skill[i] = skillData;
                    }
                    let stars: number = CalcUtil.getStarsByLv(init_lv, type, true);
                    GameData.BagData.wingman[id] = { lv: init_lv, equipment_1: {}, equipment_2: {}, stars: stars, skill: skill, shape: 0, isUnlock: true };
                }
                break;
            case Enum_OwnerSubject.Engine:
                {
                    let cfg = GM.configManager.getEngineCfgByID(id);
                    init_lv = cfg.init_lv || 0;

                    let skill = {};
                    for (let i = 0; i < GM.configManager.getPassiveSkillCount(type); i++) {
                        let skillData: ISkillData = {
                            lv: 0
                        }
                        skill[i] = skillData;
                    }
                    let stars: number = CalcUtil.getStarsByLv(init_lv, type, true);
                    GameData.BagData.engine[id] = { lv: init_lv, equipment: {}, skill: skill, stars: stars, shape: 0, isUnlock: true };
                }
                break;

            default:
                break;
        }
        GameData.markChange(GameData.BagData.name);

    }

    /**获得对象的进阶次数 */
    public getObjectAdvanceTimes(ownerType: Enum_OwnerSubject, ownerID: number) {

        const cfg = GM.configManager.getObjectCfgByID(ownerID, ownerType);
        cfg.init_lv;

        const objectData = GM.gameDataManager.getObjectData(ownerType, ownerID);

        /**初始化时的星级 */
        let init_stars: number = CalcUtil.getStarsByLv(cfg.init_lv, ownerType, true);

        let advanceTimes: number = objectData.stars - init_stars;

        return advanceTimes;
    }

    //#endregion
    /*------------------飞机僚机引擎模块相关 end------------------ */

    /*------------------装备模块相关------------------ */
    //#region
    /**获取指定类型的装备数组 */
    public getEquipmentList(ownerType: Enum_OwnerSubject, equipmentType: EquipmentPlace) {
        if (GameData.BagData.equipment[ownerType] == null) {
            return [];
        }

        if (GameData.BagData.equipment[ownerType][equipmentType] == null) {
            return [];
        }

        return Array.from(GameData.BagData.equipment[ownerType][equipmentType]);
    }

    /**添加装备 */
    public addEquipment(ownerType: Enum_OwnerSubject, equipmentType: EquipmentPlace, equipmentInf: IEquipmentInf) {
        equipmentInf.isNew = true;

        const equipmentList = this.getEquipmentList(ownerType, equipmentType);
        equipmentList.push(equipmentInf);

        GameData.BagData.equipment[ownerType][equipmentType] = equipmentList;

        GameData.markChange(GameData.BagData.name);
    }

    /**移除装备 */
    public removeEquipment(ownerType: Enum_OwnerSubject, equipmentType: EquipmentPlace, uid: string) {
        let equipmentInf = this.getEquipment(ownerType, equipmentType, uid);
        const oldOwnerID = equipmentInf.ownerID;
        const oldOwnerType = equipmentInf.ownerType;
        const oldEquipmentIdx: number = equipmentInf.equipmentIdx;

        if (oldOwnerID != null && oldOwnerType != null) {
            let equipmentMap: Record<number, string>;
            equipmentMap = this.getEquipmentMapByOwnerID(oldOwnerType, oldOwnerID, oldEquipmentIdx);

            delete equipmentMap[equipmentType];

            this.setEquipmentMapByOwnerID(oldOwnerType, oldOwnerID, equipmentMap, oldEquipmentIdx);
        }

        let equipmentList = this.getEquipmentList(ownerType, equipmentType);

        equipmentList = equipmentList.filter((v) => {
            return v.uid != uid;
        })

        GameData.BagData.equipment[ownerType][equipmentType] = equipmentList;

        GameData.markChange(GameData.BagData.name);

        const eventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.Equipment);
        eventDispatcher.Emit(CustomEvents.onEquipmentDelete, uid);
    }

    /**提升装备质量 */
    public improveEquipmentQuality(ownerType: Enum_OwnerSubject, equipmentType: EquipmentPlace, uid: string) {
        const equipment = this.getEquipment(ownerType, equipmentType, uid);
        let quality = equipment.quality + 1;

        equipment.quality = MathUtil.clamp(quality, Enum_EquipmentQuality.Bronze, Enum_EquipmentQuality.RedVerdigris)

        GameData.markChange(GameData.BagData.name);

        return true;
    }

    /**根据id 获取对应装备 */
    public getEquipment(ownerType: Enum_OwnerSubject, equipmentType: EquipmentPlace, uid: string) {
        // console.log("get equipment ", this.getEquipmentList(ownerType, equipmentType));

        return this.getEquipmentList(ownerType, equipmentType).find((value) => {
            return value.uid == uid;
        })
    }

    /**根据id 获取对应装备 */
    public updateEquipment(ownerType: Enum_OwnerSubject, equipmentType: EquipmentPlace, uid: string, inf: IEquipmentInf) {
        let nowEquipmentInf = this.getEquipmentList(ownerType, equipmentType).find((value) => {
            return value.uid == uid;
        })

        for (const key in nowEquipmentInf) {
            if (Object.prototype.hasOwnProperty.call(nowEquipmentInf, key)) {
                nowEquipmentInf[key] = inf[key];
            }
        }

        console.log("update finish", nowEquipmentInf);
        GameData.markChange(GameData.BagData.name);
    }

    /**升级对应uid 装备 */
    public upgradeEquipment(ownerType: Enum_OwnerSubject, equipmentType: EquipmentPlace, uid: string) {
        const equipmentInf = this.getEquipment(ownerType, equipmentType, uid)
        if (equipmentInf) {
            let stars = equipmentInf.stars;
            const lv = equipmentInf.lv;
            let nextLv = lv + 1;
            const curStepLv: number = lv - (equipmentInf.stars - 1) * 5;

            //升星
            if (nextLv > 0 && nextLv <= GM.configManager.equipment_max_lv - 5 && curStepLv == 5) {
                stars = ++equipmentInf.stars;

                if (stars % 2 == 0) {
                    equipmentInf.element = equipmentInf.element.map(v => {
                        v += MathUtil.randomInt(5, 11);

                        return v;
                    })
                }

                nextLv = lv;
            }
            else {//升级
                equipmentInf.lv = nextLv;
            }

            let mainValue: number = 0;
            //最后5级，主属性每一级提升 10% 并且 提升一个品质
            if (nextLv > GM.configManager.equipment_max_lv - 5) {
                mainValue = (GM.configManager.equipment_max_lv - 5) * 1 + stars * 5;

                mainValue += (nextLv - (GM.configManager.equipment_max_lv - 5)) * 10;

                equipmentInf.quality++;
            }
            else {
                //基础5%伤害 + 每一级提升2%
                mainValue = nextLv * 1 + stars * 5;

            }

            equipmentInf.mainValue = mainValue;

            console.log("equipmentInf", equipmentInf);


            GameData.markChange(GameData.BagData.name);
        }
    }

    /**获得对应类型对象的某个部位装备 */
    public getObjectEquipment(ownerType: Enum_OwnerSubject, id: number, equipmentType: EquipmentPlace, equipmentIdx: number = 0) {
        let objectData = this.getObjectData(ownerType, id);

        if (objectData) {
            let equipmentMap: Record<number, string>;
            if (ownerType == Enum_OwnerSubject.Wingman) {
                equipmentMap = (objectData as IWingmanData)[`equipment_${equipmentIdx + 1}`]

            }
            else if (ownerType == Enum_OwnerSubject.Plane) {
                equipmentMap = (objectData as IPlaneData).equipment;
            }
            else if (ownerType == Enum_OwnerSubject.Engine) {
                equipmentMap = (objectData as IEngineData).equipment;
            }

            if (equipmentMap) {
                return equipmentMap[equipmentType];
            }
        }

        return null;
    }

    /**把当前uid 的装备修改成装备中*/
    public changeUsingEquipment(ownerType: Enum_OwnerSubject, equipmentType: EquipmentPlace, uid: string, ownerID: number, equipmentIdx: number = 0) {
        //获取当前uid 的装备信息
        let equipmentInf = this.getEquipment(ownerType, equipmentType, uid);

        const oldOwnerID = equipmentInf.ownerID;
        const oldOwnerType = equipmentInf.ownerType;
        const oldEquipmentIdx: number = equipmentInf.equipmentIdx;

        let objectData: IObjectData = this.getObjectData(ownerType, ownerID);
        let equipmentMap: Record<number, string>;
        if (oldOwnerID != null && oldOwnerType != null) {
            objectData = this.getObjectData(oldOwnerType, oldOwnerID);

            equipmentMap = this.getEquipmentMapByOwnerID(oldOwnerType, oldOwnerID, oldEquipmentIdx);

            delete equipmentMap[equipmentType];

            this.setEquipmentMapByOwnerID(oldOwnerType, oldOwnerID, equipmentMap, oldEquipmentIdx);
        }

        objectData = this.getObjectData(ownerType, ownerID);
        equipmentInf.ownerID = ownerID;
        equipmentInf.ownerType = ownerType;

        equipmentMap = this.getEquipmentMapByOwnerID(ownerType, ownerID, equipmentIdx);

        //获取原来的装备信息，顶掉原来的装备
        let oldEquipmentUID: string = equipmentMap[equipmentType];
        equipmentInf = this.getEquipment(ownerType, equipmentType, oldEquipmentUID);
        if (equipmentInf) {
            equipmentInf.ownerID = null;
            equipmentInf.ownerType = null;
        }
        //

        equipmentMap[equipmentType] = uid;
        this.setEquipmentMapByOwnerID(ownerType, ownerID, equipmentMap, equipmentIdx);

        GameData.markChange(GameData.BagData.name);
    }

    /**
     * 获取某个对象的装备映射表
     * @param ownerType 
     * @param ownerID 
     * @param equipmentIdx 装备idx 僚机专用
     */
    public getEquipmentMapByOwnerID(ownerType: Enum_OwnerSubject, ownerID: number, equipmentIdx: number) {
        let objectData: IObjectData = this.getObjectData(ownerType, ownerID);

        if (objectData) {
            let equipmentMap: Record<number, string>;
            if (ownerType == Enum_OwnerSubject.Wingman) {
                let wingmanData = (objectData as IWingmanData);

                if (equipmentIdx == 0) {
                    equipmentMap = wingmanData.equipment_1;
                }
                else if (equipmentIdx == 1) {
                    equipmentMap = wingmanData.equipment_2;
                }

            }
            else if (ownerType == Enum_OwnerSubject.Plane) {
                equipmentMap = (objectData as IPlaneData).equipment;
            }
            else if (ownerType == Enum_OwnerSubject.Engine) {
                equipmentMap = (objectData as IEngineData).equipment;
            }

            return equipmentMap;
        }

        return null;
    }


    /**
     * 获取某个对象的装备映射表
     * @param ownerType 
     * @param ownerID 
     * @param equipmentIdx 装备idx 僚机专用
     */
    public setEquipmentMapByOwnerID(ownerType: Enum_OwnerSubject, ownerID: number, equipmentMap: Record<number, string>, equipmentIdx: number) {
        let objectData: IObjectData = this.getObjectData(ownerType, ownerID);

        if (objectData) {
            if (ownerType == Enum_OwnerSubject.Wingman) {
                let wingmanData = (objectData as IWingmanData);

                if (equipmentIdx == 0) {
                    wingmanData.equipment_1 = equipmentMap;
                }
                else if (equipmentIdx == 1) {
                    wingmanData.equipment_2 = equipmentMap;
                }

            }
            else if (ownerType == Enum_OwnerSubject.Plane) {
                (objectData as IPlaneData).equipment = equipmentMap;
            }
            else if (ownerType == Enum_OwnerSubject.Engine) {
                (objectData as IEngineData).equipment = equipmentMap;
            }

            this.setObjectData(ownerType, ownerID, objectData);

            return true;
        }

        return false;
    }

    /**
     * 获得对象对应部位数据
     * @param ownerType 持有者类型
     * @param ownerID 持有者id
     * @param place 部位位置
     * @param isCalcEquipment 是否算上装备
     * @returns 
     */
    public getObjectPlaceData(ownerType: Enum_OwnerSubject, ownerID: number, place: number, isCalcEquipment: boolean) {
        let result: IPlaceElementDetailInf = {
            mainValue: 0,
            element: [],
            mainValue2: 0,
            element2: [],
            equipmentType: Enum_EquipmentType.Attack,
            customEquipment: undefined
        }

        const inf = GM.configManager.getEquipmentPlaceInf(ownerID, ownerType, place);
        if (inf == null) {
            return result;
        }

        const objectCfg = GM.configManager.getObjectCfgByID(ownerID, ownerType);
        const init_lv: number = objectCfg && objectCfg.init_lv > 0 ? objectCfg.init_lv : 0;
        let objectIsUnlock: boolean = this.getObjectIsUnlock(ownerType, ownerID);
        const objectData = this.getObjectData(ownerType, ownerID);
        /**升级次数 */
        const upgradeTimes: number = objectIsUnlock ? objectData.lv - init_lv : 0;
        /**进阶次数 */
        const advanceTimes: number = objectIsUnlock ? GM.gameDataManager.getObjectAdvanceTimes(ownerType, ownerID) : 0;

        result.element = [...inf.element];
        result.customEquipment = inf.customEquipment;

        /**升级提升参数 */
        let raiseValueInUpgrade: number = 0;
        /**进阶提升参数 */
        let raiseValueInAdvance: number = 0;

        if (inf.equipmentType == Enum_EquipmentType.Attack) {
            raiseValueInUpgrade = inf.customEquipment ? inf.customEquipment.damage_raise_value : 0;
            raiseValueInAdvance = inf.customEquipment ? inf.customEquipment.damage_advanced_value : 0;
        }
        else if (inf.equipmentType == Enum_EquipmentType.Defense) {
            raiseValueInUpgrade = inf.customEquipment ? inf.customEquipment.hp_raise_value : 0;
            raiseValueInAdvance = inf.customEquipment ? inf.customEquipment.hp_advanced_value : 0;
        }
        else if (inf.equipmentType == Enum_EquipmentType.Extra_1) {
            raiseValueInUpgrade = inf.customEquipment ? inf.customEquipment.extra_raise_value : 0;
            raiseValueInAdvance = inf.customEquipment ? inf.customEquipment.extra_advanced_value : 0;
        }

        result.equipmentType = inf.equipmentType;

        let curObjectIsUnlock: boolean = this.getObjectIsUnlock(ownerType, ownerID);

        /**临时进阶次数 */
        let tempAdvanceTimes: number = advanceTimes;
        /**临时升级次数 */
        let tempUpgradeTimes: number = upgradeTimes;

        switch (ownerType) {
            case Enum_OwnerSubject.Plane:
            case Enum_OwnerSubject.Engine:
                {

                    let tempValue: number = inf.mainValue;
                    while (tempAdvanceTimes > 0 && tempUpgradeTimes > 0) {
                        let upgradeTimesInOneStar = GM.configManager.getTotalUpgradeTimesInOneStar(ownerType);
                        tempValue *= Math.pow(raiseValueInUpgrade, upgradeTimesInOneStar);
                        tempValue *= raiseValueInAdvance;

                        tempUpgradeTimes -= upgradeTimesInOneStar;
                        tempAdvanceTimes--;
                    }

                    if (tempUpgradeTimes > 0) {
                        tempValue *= Math.pow(raiseValueInUpgrade, tempUpgradeTimes);
                    }

                    result.mainValue = tempValue;

                    if (curObjectIsUnlock) {
                        const equipmentUID: string = (objectData as IPlaneData).equipment[place];
                        if (equipmentUID && isCalcEquipment) {
                            const equipmentInf = this.getEquipment(ownerType, place, equipmentUID);

                            const equipmentMainValue: number = equipmentInf.mainValue || 0;
                            const equipmentElementValue: number[] = equipmentInf.element || [0, 0, 0, 0];

                            result.mainValue = (1 + equipmentMainValue / 100) * result.mainValue;

                            for (let i = 0; i < equipmentElementValue.length; i++) {
                                const element = equipmentElementValue[i];
                                result.element[i] += element;
                            }
                        }
                    }
                }

                break;
            case Enum_OwnerSubject.Wingman:
                {
                    let tempValue: number = inf.mainValue;
                    while (tempAdvanceTimes > 0 && tempUpgradeTimes > 0) {
                        let upgradeTimesInOneStar = GM.configManager.getTotalUpgradeTimesInOneStar(ownerType);
                        tempValue *= Math.pow(raiseValueInUpgrade, upgradeTimesInOneStar);
                        tempValue *= raiseValueInAdvance;

                        tempUpgradeTimes -= upgradeTimesInOneStar;
                        tempAdvanceTimes--;
                    }

                    if (tempUpgradeTimes > 0) {
                        tempValue *= Math.pow(raiseValueInUpgrade, tempUpgradeTimes);
                    }

                    result.mainValue = result.mainValue2 = tempValue;

                    result.element2 = [...inf.element];

                    if (curObjectIsUnlock) {
                        //注意 僚机是有两套装备的
                        const equipmentUID: string = (objectData as IWingmanData).equipment_1[place];
                        const equipmentUID2: string = (objectData as IWingmanData).equipment_2[place];

                        if (isCalcEquipment) {
                            if (equipmentUID) {
                                const equipmentInf = this.getEquipment(ownerType, place, equipmentUID);

                                const equipmentMainValue: number = equipmentInf.mainValue || 0;
                                const equipmentElementValue: number[] = equipmentInf.element || [0, 0, 0, 0];
                                /////////
                                result.mainValue = (1 + equipmentMainValue / 100) * result.mainValue;

                                for (let i = 0; i < equipmentElementValue.length; i++) {
                                    const element = equipmentElementValue[i];
                                    result.element[i] += element;
                                }
                            }

                            if (equipmentUID2) {
                                const equipmentInf = this.getEquipment(ownerType, place, equipmentUID2);

                                const equipmentMainValue: number = equipmentInf.mainValue || 0;
                                const equipmentElementValue: number[] = equipmentInf.element || [0, 0, 0, 0];
                                /////////
                                result.mainValue2 = (1 + equipmentMainValue / 100) * result.mainValue;

                                for (let i = 0; i < equipmentElementValue.length; i++) {
                                    const element = equipmentElementValue[i];
                                    result.element2[i] += element;
                                }
                            }
                        }
                    }

                }
                break;


            default:
                break;
        }

        return result;
    }

    /**根据套装配置去随机生成装备数据 */
    public createEquipment(set: number): IEquipmentInf {
        /**品质分配表 */
        const table_equipmentQualityAssign = GM.configManager.syncGetConfigByType(ConfigType.Table_EquipmentQualityAssign);

        const table_equipment = GM.configManager.syncGetConfigByType(ConfigType.Table_Equipment);

        const equipmentIDList = Object.keys(table_equipment);

        let data = table_equipmentQualityAssign[set];
        if (!data) {
            return null;
        }

        let equipmentCfgID = MathUtil.randomElementFromArray(equipmentIDList);

        let equipmentData = table_equipment[equipmentCfgID] as TBDATA_Equipment;

        let isAttackPlace: boolean = equipmentData.attack_place_type != null;
        let isDefensePlace = equipmentData.defense_place_type != null;
        let isExtraPlace = false;

        if (equipmentData.subject == Enum_OwnerSubject.Engine && equipmentData.attack_place_type == Enum_EngineEquipmentPlace.DrivingSystem) {
            isAttackPlace = isDefensePlace = false;
            isExtraPlace = true;
        }


        let rateList: number[] = [data.bronze, data.sliver, data.golden];
        let qualityList: Enum_EquipmentQuality[] = [Enum_EquipmentQuality.Bronze, Enum_EquipmentQuality.Sliver, Enum_EquipmentQuality.Golden];
        let damageTypeList: Enum_DamageType[] = [Enum_DamageType.Explode, Enum_DamageType.Impact, Enum_DamageType.Puncture, Enum_DamageType.Vibrate]

        let quality = CalcUtil.drawInJackpot(qualityList, rateList);
        let element: number[] = [0, 0, 0, 0];
        let qualityIDStrList: string[] = ["bronze", "sliver", "golden"];
        let qualityID: string = qualityIDStrList[quality];

        if (isAttackPlace) {
            const table_AttackElementAssign = GM.configManager.syncGetConfigByType(ConfigType.Table_AttackElementAssign);

            /**个数分配范围 */
            const assignRange: number[] = table_AttackElementAssign[qualityID].random_init_count;

            /**分配个数 */
            let assignCnt: number = MathUtil.randomInt(assignRange[0], assignRange[1] + 1);

            let typeList: string[] = [
                "ArmorPenetration",
                "EnhancedAccuracy",
                "CriticalChance",
                "CriticalstrikeMultiple",
            ]

            let randomType: string[] = MathUtil.randomElementFromArrayByCount(typeList, assignCnt);

            for (let i = 0; i < randomType.length; i++) {
                const t = randomType[i];
                const range: number[] = table_AttackElementAssign[qualityID][t];

                let idx: number = typeList.indexOf(t);
                element[idx] = MathUtil.randomInt(range[0], range[1] + 1);
            }


        }
        else if (isDefensePlace) {
            const table_DefenseElementAssign = GM.configManager.syncGetConfigByType(ConfigType.Table_DefenseElementAssign);

            /**个数分配范围 */
            const assignRange: number[] = table_DefenseElementAssign[qualityID].random_init_count;

            /**分配个数 */
            let assignCnt: number = MathUtil.randomInt(assignRange[0], assignRange[1] + 1);

            let typeList: string[] = [
                "DamageReduction",
                "DodgeProbability",
                "BlockChance",
                "BlockDamage",
            ]

            let randomType: string[] = MathUtil.randomElementFromArrayByCount(typeList, assignCnt);

            for (let i = 0; i < randomType.length; i++) {
                const t = randomType[i];
                const range: number[] = table_DefenseElementAssign[qualityID][t];
                let idx: number = typeList.indexOf(t);
                element[idx] = MathUtil.randomInt(range[0], range[1] + 1);
            }
        }
        else if (isExtraPlace) {
            const table_ExtraElementAssign = GM.configManager.syncGetConfigByType(ConfigType.Table_ExtraElementAssign);

            /**个数分配范围 */
            const assignRange: number[] = table_ExtraElementAssign[qualityID].random_init_count;

            /**分配个数 */
            let assignCnt: number = MathUtil.randomInt(assignRange[0], assignRange[1] + 1);

            let typeList: string[] = [
                "CoolTime",
                "skillInsistTime",
                "Overfrequency",
                "OverfrequencyMultiple",
            ]

            let randomType: string[] = MathUtil.randomElementFromArrayByCount(typeList, assignCnt);

            for (let i = 0; i < randomType.length; i++) {
                const t = randomType[i];
                const range: number[] = table_ExtraElementAssign[qualityID][t];
                let idx: number = typeList.indexOf(t);
                if (t == typeList[3]) {//二选一
                    element[idx] = MathUtil.randomElementFromArray(range);
                }
                else {
                    element[idx] = MathUtil.randomInt(range[0], range[1] + 1);
                }
            }
        }

        let randomInf: IEquipmentInf = {
            uid: this.createEquipmentUUID(),
            lv: 0,
            stars: 1,
            quality: quality,
            cfgID: equipmentCfgID,
            mainValue: 5,
            element: element,
            damage_type: MathUtil.randomElementFromArray(damageTypeList),
            ownerType: Enum_OwnerSubject.None,
            ownerID: null,
            equipmentIdx: 0,
            set: set,
        }

        return randomInf;
    }

    /**
     * 根据装备品质随机生成装备
     * @param quality 
     */
    public createEquipmentByQuality(quality: Enum_EquipmentQuality) {
        let set: number = MathUtil.randomInt(1, 4);

        const table_equipment = GM.configManager.syncGetConfigByType(ConfigType.Table_Equipment);

        const equipmentIDList = Object.keys(table_equipment);
        let equipmentCfgID = MathUtil.randomElementFromArray(equipmentIDList);

        let equipmentData = table_equipment[equipmentCfgID] as TBDATA_Equipment;

        let isAttackPlace: boolean = equipmentData.attack_place_type != null;
        let isDefensePlace = equipmentData.defense_place_type != null;
        let isExtraPlace = false;

        if (equipmentData.subject == Enum_OwnerSubject.Engine && equipmentData.attack_place_type == Enum_EngineEquipmentPlace.DrivingSystem) {
            isAttackPlace = isDefensePlace = false;
            isExtraPlace = true;
        }
        let element: number[] = [0, 0, 0, 0];

        let qualityIDStrList: string[] = ["bronze", "sliver", "golden"];
        let qualityID: string = qualityIDStrList[quality];

        if (isAttackPlace) {
            const table_AttackElementAssign = GM.configManager.syncGetConfigByType(ConfigType.Table_AttackElementAssign);

            /**个数分配范围 */
            const assignRange: number[] = table_AttackElementAssign[qualityID].random_init_count;

            /**分配个数 */
            let assignCnt: number = MathUtil.randomInt(assignRange[0], assignRange[1] + 1);

            let typeList: string[] = [
                "ArmorPenetration",
                "EnhancedAccuracy",
                "CriticalChance",
                "CriticalstrikeMultiple",
            ]

            let randomType: string[] = MathUtil.randomElementFromArrayByCount(typeList, assignCnt);

            for (let i = 0; i < randomType.length; i++) {
                const t = randomType[i];
                const range: number[] = table_AttackElementAssign[qualityID][t];

                let idx: number = typeList.indexOf(t);
                element[idx] = MathUtil.randomInt(range[0], range[1] + 1);
            }


        }
        else if (isDefensePlace) {
            const table_DefenseElementAssign = GM.configManager.syncGetConfigByType(ConfigType.Table_DefenseElementAssign);

            /**个数分配范围 */
            const assignRange: number[] = table_DefenseElementAssign[qualityID].random_init_count;

            /**分配个数 */
            let assignCnt: number = MathUtil.randomInt(assignRange[0], assignRange[1] + 1);

            let typeList: string[] = [
                "DamageReduction",
                "DodgeProbability",
                "BlockChance",
                "BlockDamage",
            ]

            let randomType: string[] = MathUtil.randomElementFromArrayByCount(typeList, assignCnt);

            for (let i = 0; i < randomType.length; i++) {
                const t = randomType[i];
                const range: number[] = table_DefenseElementAssign[qualityID][t];
                let idx: number = typeList.indexOf(t);
                element[idx] = MathUtil.randomInt(range[0], range[1] + 1);
            }
        }
        else if (isExtraPlace) {
            const table_ExtraElementAssign = GM.configManager.syncGetConfigByType(ConfigType.Table_ExtraElementAssign);

            /**个数分配范围 */
            const assignRange: number[] = table_ExtraElementAssign[qualityID].random_init_count;

            /**分配个数 */
            let assignCnt: number = MathUtil.randomInt(assignRange[0], assignRange[1] + 1);

            let typeList: string[] = [
                "CoolTime",
                "skillInsistTime",
                "Overfrequency",
                "OverfrequencyMultiple",
            ]

            let randomType: string[] = MathUtil.randomElementFromArrayByCount(typeList, assignCnt);

            for (let i = 0; i < randomType.length; i++) {
                const t = randomType[i];
                const range: number[] = table_ExtraElementAssign[qualityID][t];
                let idx: number = typeList.indexOf(t);
                if (t == typeList[3]) {//二选一
                    element[idx] = MathUtil.randomElementFromArray(range);
                }
                else {
                    element[idx] = MathUtil.randomInt(range[0], range[1] + 1);
                }
            }
        }

        let damageTypeList: Enum_DamageType[] = [Enum_DamageType.Explode, Enum_DamageType.Impact, Enum_DamageType.Puncture, Enum_DamageType.Vibrate]

        let randomInf: IEquipmentInf = {
            uid: this.createEquipmentUUID(),
            lv: 0,
            stars: 1,
            quality: quality,
            cfgID: equipmentCfgID,
            mainValue: 5,
            element: element,
            damage_type: MathUtil.randomElementFromArray(damageTypeList),
            ownerType: Enum_OwnerSubject.None,
            ownerID: null,
            equipmentIdx: 0,
            set: set,
        }

        return randomInf;
    }

    private _tempEquipmentIDGenerator: { lastTimeStamp: number, sequence: number } = {
        lastTimeStamp: 0,
        sequence: 0
    }

    /**创建装备唯一id */
    public createEquipmentUUID(): string {
        let now = Date.now();
        let sequence: number = this._tempEquipmentIDGenerator.sequence;
        if (now == this._tempEquipmentIDGenerator.lastTimeStamp) {
            sequence++;
        }
        else {
            sequence = 0;
        }

        this._tempEquipmentIDGenerator.lastTimeStamp = now;
        this._tempEquipmentIDGenerator.sequence = sequence;

        return `e_${now}_${sequence}`;
    }

    /**
     * 获得对象对应部位数据以指定星级
     * @param ownerType 持有者类型
     * @param ownerID 持有者id
     * @param place 部位位置
     * @param isCalcEquipment 是否算上装备
     * @param stars 指定某个星级的第一档
     * @returns 
     */
    public getObjectPlaceDataWithStars(ownerType: Enum_OwnerSubject, ownerID: number, place: number, isCalcEquipment: boolean, stars: number) {
        let result: IPlaceElementDetailInf = {
            mainValue: 0,
            element: [],
            mainValue2: 0,
            element2: [],
            equipmentType: Enum_EquipmentType.Attack,
            customEquipment: undefined
        }

        const inf = GM.configManager.getEquipmentPlaceInf(ownerID, ownerType, place);
        if (inf == null) {
            return result;
        }

        let upgradeTimesInOneStar = GM.configManager.getTotalUpgradeTimesInOneStar(ownerType);

        const objectCfg = GM.configManager.getObjectCfgByID(ownerID, ownerType);
        /**初始等级 */
        const init_lv: number = objectCfg && objectCfg.init_lv > 0 ? objectCfg.init_lv : 0;

        /**初始化时的星级 */
        const init_stars: number = CalcUtil.getStarsByLv(objectCfg.init_lv, ownerType, true);

        let nowLv: number = upgradeTimesInOneStar * (stars - 1);

        const objectData = this.getObjectData(ownerType, ownerID);

        /**升级次数 */
        const upgradeTimes: number = nowLv - init_lv;
        /**进阶次数 */
        const advanceTimes: number = stars - init_stars;

        console.log("nowLv", nowLv);
        console.log("stars", advanceTimes);

        result.element = [...inf.element];
        result.customEquipment = inf.customEquipment;

        /**升级提升参数 */
        let raiseValueInUpgrade: number = 0;
        /**进阶提升参数 */
        let raiseValueInAdvance: number = 0;

        if (inf.equipmentType == Enum_EquipmentType.Attack) {
            raiseValueInUpgrade = inf.customEquipment ? inf.customEquipment.damage_raise_value : 0;
            raiseValueInAdvance = inf.customEquipment ? inf.customEquipment.damage_advanced_value : 0;
        }
        else if (inf.equipmentType == Enum_EquipmentType.Defense) {
            raiseValueInUpgrade = inf.customEquipment ? inf.customEquipment.hp_raise_value : 0;
            raiseValueInAdvance = inf.customEquipment ? inf.customEquipment.hp_advanced_value : 0;
        }
        else if (inf.equipmentType == Enum_EquipmentType.Extra_1) {
            raiseValueInUpgrade = inf.customEquipment ? inf.customEquipment.extra_raise_value : 0;
            raiseValueInAdvance = inf.customEquipment ? inf.customEquipment.extra_advanced_value : 0;
        }

        result.equipmentType = inf.equipmentType;

        let curObjectIsUnlock: boolean = this.getObjectIsUnlock(ownerType, ownerID);

        /**临时进阶次数 */
        let tempAdvanceTimes: number = advanceTimes;
        /**临时升级次数 */
        let tempUpgradeTimes: number = upgradeTimes;

        switch (ownerType) {
            case Enum_OwnerSubject.Plane:
            case Enum_OwnerSubject.Engine:
                {

                    let tempValue: number = inf.mainValue;
                    while (tempAdvanceTimes > 0 && tempUpgradeTimes > 0) {
                        tempValue *= Math.pow(raiseValueInUpgrade, upgradeTimesInOneStar);
                        tempValue *= raiseValueInAdvance;

                        tempUpgradeTimes -= upgradeTimesInOneStar;
                        tempAdvanceTimes--;
                    }

                    if (tempUpgradeTimes > 0) {
                        tempValue *= Math.pow(raiseValueInUpgrade, tempUpgradeTimes);
                    }

                    result.mainValue = tempValue;

                    if (curObjectIsUnlock) {
                        const equipmentUID: string = (objectData as IPlaneData).equipment[place];
                        if (equipmentUID && isCalcEquipment) {
                            const equipmentInf = this.getEquipment(ownerType, place, equipmentUID);

                            const equipmentMainValue: number = equipmentInf.mainValue || 0;
                            const equipmentElementValue: number[] = equipmentInf.element || [0, 0, 0, 0];

                            result.mainValue = (1 + equipmentMainValue / 100) * result.mainValue;

                            for (let i = 0; i < equipmentElementValue.length; i++) {
                                const element = equipmentElementValue[i];
                                result.element[i] += element;
                            }
                        }
                    }
                }

                break;
            case Enum_OwnerSubject.Wingman:
                {
                    let tempValue: number = inf.mainValue;
                    while (tempAdvanceTimes > 0 && tempUpgradeTimes > 0) {
                        let upgradeTimesInOneStar = GM.configManager.getTotalUpgradeTimesInOneStar(ownerType);
                        tempValue *= Math.pow(raiseValueInUpgrade, upgradeTimesInOneStar);
                        tempValue *= raiseValueInAdvance;

                        tempUpgradeTimes -= upgradeTimesInOneStar;
                        tempAdvanceTimes--;
                    }

                    if (tempUpgradeTimes > 0) {
                        tempValue *= Math.pow(raiseValueInUpgrade, tempUpgradeTimes);
                    }

                    result.mainValue = result.mainValue2 = tempValue;
                    result.element2 = [...inf.element];

                    if (curObjectIsUnlock) {
                        //注意 僚机是有两套装备的
                        const equipmentUID: string = (objectData as IWingmanData).equipment_1[place];
                        const equipmentUID2: string = (objectData as IWingmanData).equipment_2[place];

                        if (isCalcEquipment) {
                            if (equipmentUID) {
                                const equipmentInf = this.getEquipment(ownerType, place, equipmentUID);

                                const equipmentMainValue: number = equipmentInf.mainValue || 0;
                                const equipmentElementValue: number[] = equipmentInf.element || [0, 0, 0, 0];
                                /////////
                                result.mainValue = (1 + equipmentMainValue / 100) * result.mainValue;

                                for (let i = 0; i < equipmentElementValue.length; i++) {
                                    const element = equipmentElementValue[i];
                                    result.element[i] += element;
                                }
                            }

                            if (equipmentUID2) {
                                const equipmentInf = this.getEquipment(ownerType, place, equipmentUID2);

                                const equipmentMainValue: number = equipmentInf.mainValue || 0;
                                const equipmentElementValue: number[] = equipmentInf.element || [0, 0, 0, 0];
                                /////////
                                result.mainValue2 = (1 + equipmentMainValue / 100) * result.mainValue;

                                for (let i = 0; i < equipmentElementValue.length; i++) {
                                    const element = equipmentElementValue[i];
                                    result.element2[i] += element;
                                }
                            }
                        }
                    }

                }
                break;


            default:
                break;
        }

        return result;
    }

    //#endregion
    /*------------------装备模块相关 end------------------ */

    /*------------------科技点相关------------------ */
    //#region
    public addTechnicPoint(technicPointType: Enum_TechnicType, count: number) {
        let curCount: number = this.getTechnicPoint(technicPointType);
        let nextCount: number = curCount + count;
        if (nextCount < 0) {
            return false;
        }

        GameData.BagData.technicPoint[technicPointType] = nextCount;

        console.log("addTechnicPoint ", technicPointType, count);


        GameData.markChange(GameData.BagData.name);

        return true;
    }

    public getTechnicPoint(technicPointType: Enum_TechnicType) {
        return GameData.BagData.technicPoint[technicPointType] || 0;
    }
    //#endregion
    /*------------------科技点相关 end------------------ */

    /*------------------签到模块相关 ------------------ */
    //#region
    /**获得签到天数 */
    public getSignInDays() {
        return GameData.SignInData.signInDays;
    }

    /**记录签到成功 */
    public addSignInDays() {
        let days: number = this.getSignInDays();
        days = ++days;

        if (days > 28) {
            days = 1;
            GameData.SignInData.hasTakeSignInReward = [];
        }

        GameData.SignInData.signInDays = days;

        GameData.markChange(GameData.SignInData.name);
        return days;
    }

    /**设置签到奖励领取状态 */
    public setSignInRewardState(day: number, isTake: boolean) {
        if (isTake && !GameData.SignInData.hasTakeSignInReward.includes(day)) {
            GameData.SignInData.hasTakeSignInReward.push(day);
        }

        if (!isTake) {
            GameData.SignInData.hasTakeSignInReward = GameData.SignInData.hasTakeSignInReward.filter((v) => { return v != day });
        }

        GameData.markChange(GameData.SignInData.name);
    }

    /**获取对应签到天数奖励状态 */
    public getSignInRewardState(days: number): Enum_RewardState {
        const hasTake: boolean = GameData.SignInData.hasTakeSignInReward.includes(days);

        if (days > GameData.SignInData.signInDays) {
            return Enum_RewardState.NotFinished;
        }

        if (hasTake) {
            return Enum_RewardState.HasTaken;
        }

        return Enum_RewardState.NotTake;
    }

    /**当前是否有签到奖励可以领取 */
    public canGetSignInReward() {
        let days = this.getSignInDays();
        for (let i = 1; i <= days; i++) {
            if (this.getSignInRewardState(i) == Enum_RewardState.NotTake) {
                return true;
            }

        }

        return false;
    }

    /**获得首次7日签到天数 */
    public getFirstSevenSignInDays() {
        return GameData.FirstSevenDaySignIn.signInDays;
    }

    /**增加首次7日签到天数  */
    public addFirstSevenSignInDays() {
        let days: number = this.getFirstSevenSignInDays();
        days = ++days;
        GameData.FirstSevenDaySignIn.signInDays = days;

        GameData.markChange(GameData.FirstSevenDaySignIn.name);

        return days;
    }

    /**记录领取首次7日签到奖励 */
    public takeFirstSevenSignInReward(day: number) {
        if (GameData.FirstSevenDaySignIn.hasTakeSignInReward.includes(day)) {
            return;
        }

        GameData.FirstSevenDaySignIn.hasTakeSignInReward.push(day);

        GameData.markChange(GameData.FirstSevenDaySignIn.name);
    }

    /**获取对应签到天数奖励状态 */
    public getFirstSevenSignInState(days: number): Enum_RewardState {
        const hasTake: boolean = GameData.FirstSevenDaySignIn.hasTakeSignInReward.includes(days);

        if (hasTake) {
            return Enum_RewardState.HasTaken;
        }

        return Enum_RewardState.NotTake;
    }


    /**设置当天是否已经完成首次7日签到  */
    public setIsFirstSevenSignIn(v: boolean) {
        GameData.FirstSevenDaySignIn.hasSignIn = v;

        GameData.markChange(GameData.FirstSevenDaySignIn.name);
    }

    /**获得当天是否已经完成首次7日签到  */
    public getTodayHasFinishedFirstSevenSignIn() {
        return GameData.FirstSevenDaySignIn.hasSignIn;
    }

    /**当前是否有七天签到奖励可以领取 */
    public canGetSevenSignInReward() {
        let nowSignInDays: number = this.getFirstSevenSignInDays() + 1;

        return !this.getTodayHasFinishedFirstSevenSignIn() && GM.gameDataManager.getFirstSevenSignInState(nowSignInDays) != Enum_RewardState.HasTaken && nowSignInDays <= 7;
    }
    //#endregion
    /*------------------签到模块相关 end------------------ */

    /*------------------领取奖励相关------------------ */
    //#region
    public takeReward(reward: RewardBase) {
        let result: RewardDisplayData = {
            icon: "",
            count: 0
        }
        result.icon = reward.rewardID.toString();

        if (CalcUtil.isCurrency(reward.rewardID)) {
            this.addCurrency(reward.rewardID, reward.count);
        }
        else if (CalcUtil.isActivityCurrency(reward.rewardID)) {
            this.addActivityCurrency(reward.count);
        }
        else if (CalcUtil.isChip(reward.rewardID)) {
            let id: number = reward.rewardID;
            let iconID: number;
            if (!isNaN(id) && id) {
                if (id == GM.configManager.common_plane_chip_id || id == GM.configManager.common_wingman_chip_id || id ==
                    GM.configManager.common_engine_chip_id) {
                    id = null;
                    iconID = reward.rewardID;
                }
                else {
                    iconID = id = reward.secondaryID;
                }
            }

            this.addChip(id, reward.count, reward.ownerType);

            result.icon = iconID.toString();
        }
        else if (reward.isChip) {
            this.addChip(reward.rewardID, reward.count, reward.ownerType);

        }
        else if (CalcUtil.isTechnicPoint(reward.rewardID)) {
            let id: number = reward.rewardID;
            if (id == 399) {//如果是随机科技点，则随机抽取科技点id
                let technicPointIDList: number[] = [Enum_TechnicType.DamageUp, Enum_TechnicType.HpUp, Enum_TechnicType.LaunchSpeed, Enum_TechnicType.SkillCdDecrease];
                id = MathUtil.randomElementFromArray(technicPointIDList);
            }

            this.addTechnicPoint(id, reward.count);

            result.icon = id.toString();
        }
        else if (reward.rewardID == Enum_Currency.Power) {//体力
            this.addPower(reward.count);
        }
        else if (reward.rewardItemType == Enum_RewardItemType.Equipment) {
            let set: number = reward.otherData.set || MathUtil.randomInt(1, 4);
            let quality = reward.otherData.quality;
            let element = reward.otherData.element || MathUtil.randomElementFromArrayByCount([10, 20, 30, 40], 4);

            let cfgID = reward.rewardID.toString();
            const table = GM.configManager.syncGetConfigByType(ConfigType.Table_Equipment);
            const damageTypeList: Enum_DamageType[] = [
                Enum_DamageType.Explode, Enum_DamageType.Impact, Enum_DamageType.Puncture, Enum_DamageType.Vibrate,
            ];
            //当前装备item
            const equipmentCfg = (table[cfgID] as TBDATA_Equipment);
            let place: Enum_PlaneEquipmentPlace = equipmentCfg.attack_place_type || equipmentCfg.defense_place_type;

            let ownerType = equipmentCfg.subject;

            let damage_type = reward.otherData.damage_type || equipmentCfg.attack_place_type == null ? null : MathUtil.randomElementFromArray(damageTypeList);

            let inf: IEquipmentInf
            if (reward.otherData.equipmentInf) {
                inf = reward.otherData.equipmentInf;
            }
            else {
                inf = {
                    uid: "ee" + Date.now(),
                    lv: 0,
                    stars: 1,
                    quality: quality,
                    cfgID: cfgID,
                    mainValue: 5,
                    element: element,
                    damage_type: damage_type,
                    ownerType: Enum_OwnerSubject.None,
                    ownerID: null,
                    equipmentIdx: 0,
                    set: set,
                }

            }

            this.addEquipment(ownerType, place, inf);
        }
        else if (reward.rewardID == Enum_Currency.TaskRewardPoint) {
            let curPoint: number = this.getTaskPoint();
            curPoint += reward.count;
            this.setTaskPoint(curPoint);
        }
        else if (reward.rewardItemType == Enum_RewardItemType.Object) {//当前领取的是对象（飞机僚机引擎）
            let type = CalcUtil.getObjectType(reward.rewardID);
            let id = reward.rewardID;

            if (type != Enum_OwnerSubject.None) {
                let hasUnlocked: boolean = this.getObjectIsUnlock(type, id);
                if (!hasUnlocked) {
                    this.unlockObject(type, id);
                }
                else {//重复解锁对象
                    if (type == Enum_OwnerSubject.Engine || type == Enum_OwnerSubject.Plane) {
                        reward.count = 300;
                    }
                    else {
                        reward.count = 450;
                    }
                    result.icon = (410 + type).toString();

                    this.addChip(null, reward.count, type);
                }
            }
        }
        else if (reward.rewardItemType == Enum_RewardItemType.ObjectSkillUpgradeProp) {
            this.addUpgradePassiveSkillPropCount(reward.count, reward.rewardID);

            result.icon = `PSUM_${reward.rewardID}_0`;
        }

        result.count = reward.count;
        return result;
    }

    public takeAllReward(reward: RewardBase[]) {
        let result: RewardDisplayData[] = [];
        for (const r of reward) {
            let displayData = this.takeReward(r);
            result.push(displayData);
        }

        return result;
    }

    //#endregion
    /*------------------领取奖励相关 end------------------ */

    /*------------------任务相关 ------------------ */
    //#region
    /**随机获取任务id(与当前进行中的任务的要求完成类型不重复) */
    public randomGetTaskID(): number {
        const table = GM.configManager.syncGetConfigByType(ConfigType.Table_Task);
        let keys = Object.keys(table);

        const existTaskType: Enum_TaskFinishType[] = [];
        for (const curTask of GameData.TaskData.curTaskList) {
            let cfg = table[curTask.id] as TBDATA_Task;
            existTaskType.push(cfg.require_type);
        }

        keys = keys.filter((key) => {
            let cfg = table[key] as TBDATA_Task;
            return !existTaskType.includes(cfg.require_type);
        })

        let id = MathUtil.randomElementFromArray(keys);
        return Number(id);
    }

    /**
     * 设置任务状态
     * @param taskID 
     * @param curCount 
     */
    public setTaskState(taskID: number, curCount: number) {
        const taskRecord = GameData.TaskData.curTaskList.find((task) => {
            return task.id == taskID;
        })

        taskRecord.curCount = curCount;

        LogUtil.Log("task state update", taskID, curCount);

        GameData.markChange(GameData.TaskData.name);
    }

    /**获取当前进行中的任务列表数组 */
    public getAllDoingTaskList(): ReadonlyArray<TaskRecordBase> {
        return GameData.TaskData.curTaskList;
    }

    /**更改某个任务数据 */
    public changeTask(index: number, newTaskID: number) {
        if (GameData.TaskData.curTaskList[index]) {
            GameData.TaskData.curTaskList[index] = {
                id: newTaskID,
                curCount: 0
            }
        }

        const uiEventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.UI);
        uiEventDispatcher.Emit(CustomEvents.onChangeTask);

        GameData.markChange(GameData.TaskData.name);
    }

    /**获取全部任务完成数量 */
    public getTotalFinishTaskCount(): number {
        return GameData.TaskData.totalFinishCount;
    }

    /**设置全部任务完成数量 */
    public setTotalFinishTaskCount(t: number): void {
        GameData.TaskData.totalFinishCount = t;

        GameData.markChange(GameData.TaskData.name);
    }

    /**当前是否有任务奖励可以领取 */
    public canGetTaskReward() {
        const taskList = GameData.TaskData.curTaskList;
        for (let i = 0; i < taskList.length; i++) {
            const id: number = taskList[i].id;
            const count: number = taskList[i].curCount;

            const taskCfg: TBDATA_Task = GM.configManager.getTaskCfgByID(id);

            if (taskCfg.require_count <= count) {
                return true;
            }

        }

        return false;
    }

    /**
     * 获取当前进行中指定类型的任务
     * @param type 类型
     * 1.作战模式
     * 2.护卫模式
     * 3.突袭模式
     * 4.绝密模式
     * 5.轰炸模式
     * 11.消费金币
     * 12.消费砖石
     * 21.开箱子
     * 31.升级战机
     * 32.升级僚机
     * 33.升级引擎
     
     * 91.看广告
     * @returns 
     */
    public getCurDoingTasksByType(type: Enum_TaskFinishType): TaskRecordBase[] {
        return GameData.TaskData.curTaskList.filter((task) => {
            const cfg = GM.configManager.getTaskCfgByID(task.id);
            return cfg.require_type == type;
        })
    }

    /**增加制定类型任务的完成次数 */
    public addTasksFinishCount(type: Enum_TaskFinishType, add: number) {
        const taskList: TaskRecordBase[] = GM.gameDataManager.getCurDoingTasksByType(type);
        taskList.forEach((task) => {
            GM.gameDataManager.setTaskState(task.id, task.curCount + add);
        })

    }

    /**获取任务点 */
    public getTaskPoint(): number {
        return GameData.TaskData.taskRewardPoint;
    }
    /**设置当前任务点 */
    public setTaskPoint(value: number) {
        GameData.TaskData.taskRewardPoint = value;

        GameData.markChange(GameData.TaskData.name);
    }

    //#endregion
    /*------------------任务相关 end------------------ */

    /*------------------升级被动技能相关------------------ */
    /**
     * 获取升级被动技能材料
     * @param series 第几个系列
     * @param type 
     * @returns 
     */
    public getUpgradePassiveSkillPropCount(series: number) {
        return GameData.BagData.upgradePassiveSkillPropCount[series] || 0;
    }

    public setUpgradePassiveSkillPropCount(count: number, series: number) {
        GameData.BagData.upgradePassiveSkillPropCount[series] = count;

        const uiEventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.UI);

        uiEventDispatcher.Emit(CustomEvents.OnUpgradePassiveSkillPropChange, count);

        GameData.markChange(GameData.BagData.name);
    }

    /**
     * 新增升级被动技能材料
     * @param series 第几个系列
     * @param type 
     * @returns 
     */
    public addUpgradePassiveSkillPropCount(add: number, series: number) {
        let now: number = this.getUpgradePassiveSkillPropCount(series);

        let next = now + add;
        if (next < 0) {
            return false;
        }

        console.log("addPassiveSkillProp", add, series);

        this.setUpgradePassiveSkillPropCount(next, series);

        return true;
    }

    /*------------------升级被动技能相关 end------------------ */

    /*------------------军衔相关------------------ */
    public getHonorPoint(): number {
        return GameData.MilitaryData.honorPoint;
    }
    public setHonorPoint(value: number) {
        GameData.MilitaryData.honorPoint = value;
        GameData.markChange(GameData.MilitaryData.name);
    }

    public addHonorPoint(value: number) {
        let nowValue = GameData.MilitaryData.honorPoint;
        let nextValue = value + nowValue;
        if (nextValue < 0) {
            return;
        }

        const table = GM.configManager.syncGetConfigByType(ConfigType.Table_MilitaryRank);

        let tempV: number = nextValue;
        let rank: number = 1;
        for (const key in table) {
            if (Object.prototype.hasOwnProperty.call(table, key)) {
                const element = table[key] as TBDATA_MilitaryRank;

                if (tempV >= element.next_hornor) {
                    rank = Number(key) + 1;
                }
                else {
                    break;
                }
            }
        }

        console.log("addHonorPoint", value);

        const uiEventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.UI);

        this.setHonorPoint(nextValue);
        this.setMilitaryRank(rank);

        uiEventDispatcher.Emit(CustomEvents.OnHonorPointChange, value);
    }

    /**获得军衔等级 */
    public getMilitaryRank(): number {
        // return 10;
        return GameData.MilitaryData.militaryRank;
    }
    /**设置军衔等级 */
    public setMilitaryRank(value: number) {
        if (GameData.MilitaryData.militaryRank != value) {
            const table = GM.configManager.syncGetConfigByType(ConfigType.Table_ViewEntrance);

            for (let i = 1; i <= 3; i++) {
                let troopIdx: number = i;
                let key = 101 + troopIdx;
                let isTroopUnlock: boolean = GM.gameDataManager.getTroopIsUnlock(troopIdx);

                if (!isTroopUnlock && table[key].military_rank <= value) {
                    GM.gameDataManager.unlockTroop(troopIdx);
                }
            }

            const eventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.UI);

            eventDispatcher.Emit(CustomEvents.onMilitaryRankUpdate, value);

            const popupParam: UpgradeMilitaryPopupViewParam = {
                militaryID: value,
                closeCallBack: undefined,
                openCallBack: undefined
            }
            GM.uiManager.OpenUI(UIName.UpgradeMilitaryPopupView, popupParam, Enum_AssetBundle.PopUpView);
        }
        GameData.MilitaryData.militaryRank = value;
        GameData.markChange(GameData.MilitaryData.name);
    }
    /*------------------军衔相关 end------------------ */


    /*------------------促销活动相关------------------ */
    public getDiscountActivity() {
        let listData: { discount: number, cfgID: number, costData: ICostData, validTimeStamp: number }[] = [];

        let table = GM.configManager.syncGetConfigByType(ConfigType.Table_DiscountActivity);

        let purchaseTable = GM.configManager.syncGetConfigByType(ConfigType.Table_Purchase);

        let id = GameData.DiscountActivityData.idx + 101;
        let discountActivityData = table[id] as TBDATA_DiscountActivity;
        let purchaseCfg = purchaseTable[discountActivityData.goodsID[0]] as TBDATA_Purchase;

        //折扣活动
        let d: { discount: number, cfgID: number, costData: ICostData, validTimeStamp: number } = {
            cfgID: id,
            validTimeStamp: GameData.DiscountActivityData.startTimeStamp + DISCOUNT_ACTIVITY_VALID_TIME * 1000,
            discount: purchaseCfg.discount || 0,
            costData: { type: Enum_Currency.Diamond, cnt: purchaseCfg.cost_count }
        }

        listData.push(d);

        //常驻活动
        id = 901;
        d = {
            cfgID: id,
            validTimeStamp: GameData.getLocalDateZeroMillionSeconds() + 24 * 60 * 60 * 1000,
            discount: purchaseCfg.discount || 0,
            costData: { type: Enum_Currency.Diamond, cnt: purchaseCfg.cost_count }
        }
        listData.push(d);

        //看看有没有特殊活动对应的折扣活动
        let activityTable = GM.configManager.syncGetConfigByType(ConfigType.Table_SpecialActivity);
        id = Number(Object.keys(activityTable)[GameData.ActivityData.idx]);

        let activityCfg = activityTable[id] as TBDATA_SpecialActivity;

        if (activityCfg && activityCfg.discountActivityID) {
            d = {
                cfgID: activityCfg.discountActivityID,
                validTimeStamp: GameData.ActivityData.startTimeStamp + SP_ACTIVITY_VALID_TIME * 1000,
                discount: purchaseCfg.discount || 0,
                costData: { type: Enum_Currency.Diamond, cnt: purchaseCfg.cost_count }
            }
        }

        listData.push(d);

        return listData;
    }

    /*------------------促销活动相关 end------------------ */

    /*------------------头像相关------------------ */
    public setAvatarID(id: number) {
        GameData.UserData.avatarID = id;

        GameData.markChange(GameData.UserData.name);

        const uiEventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.UI);
        uiEventDispatcher.Emit(CustomEvents.OnAvatarChange, id);
    }
    public getAvatarID() {
        return GameData.UserData.avatarID;
    }

    /*------------------头像相关 end------------------ */

    /*------------------vip相关------------------ */
    public getRealCurrencyCost() {
        return 150;
    }

    public getVipLevel() {
        return GameData.VipData.level;
    }

    public getVipScore() {
        return GameData.VipData.score;
    }

    public addVipScore(add: number) {
        const vipScoreAddLimite = SDKManager.GetOnlineValue(Enum_OnlineParam.integralvip) || 50;

        if (GameData.VipData.todayAddScore >= vipScoreAddLimite) {
            return;
        }

        let score = this.getVipScore();
        score += add;
        GameData.VipData.score = score;
        GameData.VipData.todayAddScore += add;

        const table = GM.configManager.syncGetConfigByType(ConfigType.Table_Vip);

        const nowVipLevel: number = this.getVipLevel();

        let level: number = 0;
        for (const key in table) {
            if (Object.prototype.hasOwnProperty.call(table, key)) {
                const element = table[key] as TBDATA_Vip;
                if (element.cost > score) {
                    break;
                }

                level = element.level;
                score -= element.cost;
            }
        }

        if (level > nowVipLevel) {
            this.setCanTakeVipDailyReward(true);

            const uiEventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.UI);
            uiEventDispatcher.Emit(CustomEvents.onVipLevelChange, level);

            if (!PlayerData.isGaming) {
                let popupParam: UpgradeVipPopupViewParam = {
                    vipLevel: level,
                    closeCallBack: undefined,
                    openCallBack: undefined
                }
                GM.uiManager.OpenUI(UIName.UpgradeVipPopupView, popupParam, Enum_AssetBundle.PopUpView, Enum_Layer.Pop);
            }
        }
        GameData.VipData.level = level;

        GameData.markChange(GameData.VipData.name);
    }

    /**获取当前vip特权加成 */
    public getVipPrivilegesReward() {
        let result: Map<number, number> = new Map();
        let level = GM.gameDataManager.getVipLevel();
        const table = GM.configManager.syncGetConfigByType(ConfigType.Table_Vip);

        const cfg: TBDATA_Vip = Object.values(table).find((v: TBDATA_Vip) => {
            return v.level == level;
        })

        if (!cfg.privileges_reward) {
            return result;
        }

        result = StringUtil.analyzeVipPrivilegesReward(cfg.privileges_reward);

        return result;
    }

    /**当天是否能领取vip日常奖励 */
    public getCanTakeVipDailyReward() {
        return !GameData.VipData.hasTakenDailyReward;
    }
    /**当天是否能领取vip日常奖励 */
    public setCanTakeVipDailyReward(v: boolean) {
        GameData.VipData.hasTakenDailyReward = !v;
        GameData.markChange(GameData.VipData.name);
    }

    /**获取今天获得的vip 积分 */
    public getTodayVipScoreAdded() {
        return GameData.VipData.todayAddScore || 0;
    }

    /**设置vip 重置模块板块次数 */
    public setVipResetModuleBoardTimes(boardIdx: number, t: number) {
        GameData.VipData.moduleShopModuleResetTimes[boardIdx] = t;
        GameData.markChange(GameData.VipData.name);
    }
    /**获得vip 重置模块板块次数 */
    public getVipResetModuleBoardTimes(boardIdx: number) {
        return GameData.VipData.moduleShopModuleResetTimes[boardIdx] || 0;
    }

    /**
     * 记录vip 已经免费游玩特殊模式的次数
     * @param gameMode 特殊模式
     * @param add
     * @returns 
     */
    public AddVipSpModeFreePlayTimes(gameMode: Enum_GameMode, add: number = 1) {
        let times = this.getVipSpModeFreePlayTimes(gameMode);
        times += add;
        GameData.VipData.spModeFreePlayTimes[gameMode] = times;
    }
    /**获得vip 免费游玩特殊模式的次数 */
    public getVipSpModeFreePlayTimes(gameMode: Enum_GameMode) {
        return GameData.VipData.spModeFreePlayTimes[gameMode] || 0;
    }
    /*------------------vip相关 end------------------ */

    /*------------------观看激励视频相关------------------ */
    /**设置观看增加货币广告视频次数 */
    public setWatchAdCurrencyTimes(t: number) {
        GameData.WatchAdData.addCurrency = t;
        GameData.markChange(GameData.WatchAdData.name);
    }

    /**获取观看增加货币广告视频次数 */
    public getWatchAdCurrencyTimes() {
        return GameData.WatchAdData.addCurrency;
    }

    /**获取观看增加通用碎片广告视频次数 */
    public getWatchAdChipTimes() {
        return GameData.WatchAdData.addChip;
    }
    /**设置观看增加通用碎片广告视频次数 */
    public setWatchAdChipTimes(value) {
        GameData.WatchAdData.addChip = value;
        GameData.markChange(GameData.WatchAdData.name);
    }

    /**获取观看增加补给箱广告视频次数 */
    public getWatchAdBoxTimes() {
        return GameData.WatchAdData.addBox;
    }
    /**设置观看增加补给箱广告视频次数 */
    public setWatchAdBoxTimes(value) {
        GameData.WatchAdData.addBox = value;
        GameData.markChange(GameData.WatchAdData.name);
    }
    /**获取今日观看增加补给箱广告视频次数 */
    public getTodayWatchAdBoxTimes() {
        return GameData.WatchAdData.todayWatchAdBox;
    }
    /**设置今日观看增加补给箱广告视频次数 */
    public setTodayWatchAdBoxTimes(t: number) {
        GameData.WatchAdData.todayWatchAdBox = t;
        GameData.markChange(GameData.WatchAdData.name);
    }

    public getAdBoxIndex(): number {
        return GameData.WatchAdData.adBoxIndex;
    }
    public setAdBoxIndex(value: number) {
        GameData.WatchAdData.adBoxIndex = value;
    }

    /**获取对应类型的飞机僚机引擎观看视频次数 */
    public getObjectWatchAdTimes(objType: Enum_OwnerSubject, id: number) {
        let data: Record<number, number>;
        if (objType == Enum_OwnerSubject.Plane) {
            data = GameData.WatchAdData.unlockPlaneAdTimes;
        }
        else if (objType == Enum_OwnerSubject.Wingman) {
            data = GameData.WatchAdData.unlockWingmanAdTimes;
        }
        else if (objType == Enum_OwnerSubject.Engine) {
            data = GameData.WatchAdData.unlockEngineAdTimes;
        }

        return data[id] || 0;
    }

    /**增加对应类型的飞机僚机引擎观看视频次数 */
    public addObjectWatchAdTimes(objType: Enum_OwnerSubject, id: number, add: number = 1) {
        let data: Record<number, number>;
        if (objType == Enum_OwnerSubject.Plane) {
            data = GameData.WatchAdData.unlockPlaneAdTimes;
        }
        else if (objType == Enum_OwnerSubject.Wingman) {
            data = GameData.WatchAdData.unlockWingmanAdTimes;
        }
        else if (objType == Enum_OwnerSubject.Engine) {
            data = GameData.WatchAdData.unlockEngineAdTimes;
        }

        if (data[id]) {
            data[id] += add;
        }
        else {
            data[id] = add;
        }

        GameData.markChange(GameData.WatchAdData.name);
    }

    /**增加货币补充的观看广告次数 */
    public addExtraCurrencyAdTimes(currency: Enum_Currency, add: number = 1) {
        let data: Record<number, number> = GameData.WatchAdData.extraCurrencyAdTimes;
        let now = data[currency] || 0;
        data[currency] = now + add;

        data = GameData.WatchAdData.totalCurrencyAdTimes;
        now = data[currency] || 0;
        data[currency] = now + add;

        GameData.markChange(GameData.WatchAdData.name);
    }

    /**获取今日货币补充的观看广告次数 */
    public getExtraCurrencyAdTimes(currency: Enum_Currency) {
        return GameData.WatchAdData.extraCurrencyAdTimes[currency] || 0;
    }

    /**获取累计货币补充的观看广告次数 */
    public getTotalCurrencyAdTimes(currency: Enum_Currency) {
        return GameData.WatchAdData.totalCurrencyAdTimes[currency] || 0;
    }

    /**获取累计货币补充的观看广告次数 */
    public getTotalCommonChipAdTimes(id: number) {
        return GameData.WatchAdData.totalCommonChipAdTimes[id] || 0;
    }

    /**增加货币补充的观看广告次数 */
    public addExtraCommonChipAdTimes(id: number, add: number = 1) {
        let data: Record<number, number> = GameData.WatchAdData.extraCommonChipAdTimes;
        let now = data[id] || 0;
        data[id] = now + add;

        data = GameData.WatchAdData.totalCommonChipAdTimes;
        now = data[id] || 0;
        data[id] = now + add;

        GameData.markChange(GameData.WatchAdData.name);
    }
    /**获取货币补充的观看广告次数 */
    public getExtraCommonChipAdTimes(id: number) {
        return GameData.WatchAdData.extraCommonChipAdTimes[id] || 0;
    }

    /**获取当天是否有免费获得buff机会 */
    public getTodayFreePickSustainBuff() {
        return GameData.WatchAdData.todayFreePickSustainBuff;
    }
    /**设置当天是否有免费获得buff机会 */
    public setTodayFreePickSustainBuff(value) {
        GameData.WatchAdData.todayFreePickSustainBuff = value;
        GameData.markChange(GameData.WatchAdData.name);
    }
    /*------------------观看激励视频相关 end------------------ */

    /*------------------新手指引相关------------------ */
    /**获取已经完成指引下标 */
    public getTutorialIndex() {
        return GameData.TutorialData.tutorialIndex;
    }
    /**设置已经完成指引下标 */
    public setTutorialIndex(value: number) {
        console.log("setTutorialIndex", value);
        GameData.TutorialData.tutorialIndex = value;

        GameData.markChange(GameData.TutorialData.name);
    }

    /**获取是否已经完成新手指引 */
    public getIsTutorialFinish() {
        return GameData.TutorialData.isFinish;
    }
    /**设置是否已经完成新手指引 */
    public setIsTutorialFinish(value: boolean) {
        console.log("setIsTutorialFinish", value);
        GameData.TutorialData.isFinish = value;
        GameData.TutorialData.tutorialBackup = null;
        GameData.markChange(GameData.TutorialData.name);
    }

    /**记录指引数据 */
    public saveTutorialData(idx: number) {
        let curPlayingLv = PlayerData.curPlayingLv;
        let uiInf = GM.uiManager.getLayerInf();
        GameData.TutorialData.level = curPlayingLv;

        let bagData = JSON.stringify(GameData.BagData);
        let troopData = JSON.stringify(GameData.PlaneTroopsData);
        let userData = JSON.stringify(GameData.UserData);
        let levelData = JSON.stringify(GameData.LevelData);
        let taskData = JSON.stringify(GameData.TaskData);

        GameData.TutorialData.uiInf = uiInf;
        let backupData: ITutorialBackupdata = {
            bagData: bagData,
            troopData: troopData,
            userData: userData,
            taskData: taskData,
            levelData: levelData
        }
        GameData.TutorialData.tutorialBackup[idx] = backupData;

        console.log("TutorialData", backupData);

        console.log(GameData.TutorialData);

        GameData.markChange(GameData.TutorialData.name);

    }

    /**获取指引数据 */
    public getTutorialData() {
        let result = {
            level: GameData.TutorialData.level,
            uiInf: GameData.TutorialData.uiInf,

        }

        return result;
    }


    /**根据备份，复原新手指引数据 */
    public backupTutorialData(idx: number) {
        let backupData = GameData.TutorialData.tutorialBackup[idx];
        if (!backupData) {
            return;
        }

        if (backupData.bagData) {
            let bagData = JSON.parse(backupData.bagData);
            if (bagData) {
                for (const key in bagData) {
                    if (Object.prototype.hasOwnProperty.call(bagData, key)) {
                        const element = bagData[key];
                        GameData.BagData[key] = element;
                    }
                }

            }

        }

        if (backupData.troopData) {
            let troopData = JSON.parse(backupData.troopData);
            if (troopData) {
                for (const key in troopData) {
                    if (Object.prototype.hasOwnProperty.call(troopData, key)) {
                        const element = troopData[key];
                        GameData.PlaneTroopsData[key] = element;
                    }
                }

            }

        }

        if (backupData.userData) {
            let userData = JSON.parse(backupData.userData);
            if (userData) {
                for (const key in userData) {
                    if (Object.prototype.hasOwnProperty.call(userData, key)) {
                        const element = userData[key];
                        GameData.UserData[key] = element;
                    }
                }

            }

        }

        if (backupData.levelData) {
            let levelData = JSON.parse(backupData.levelData);
            if (levelData) {
                for (const key in levelData) {
                    if (Object.prototype.hasOwnProperty.call(levelData, key)) {
                        const element = levelData[key];
                        GameData.LevelData[key] = element;
                    }
                }

            }

        }
        if (backupData.taskData) {
            let taskData = JSON.parse(backupData.taskData);
            if (taskData) {
                for (const key in taskData) {
                    if (Object.prototype.hasOwnProperty.call(taskData, key)) {
                        const element = taskData[key];
                        GameData.TaskData[key] = element;
                    }
                }

            }

        }

    }

    /**获取某个类型的新手首次提示的触发状态 */
    public getTutorialTriggerTip(type: Enum_TutorialFirstTips): boolean {
        return GameData.TutorialData.triggerTip[type] || false;
    }

    /**设置某个类型的新手首次提示的触发状态 */
    public setTutorialTriggerTip(type: Enum_TutorialFirstTips, isTrigger: boolean) {
        GameData.TutorialData.triggerTip[type] = isTrigger;
        GameData.markChange(GameData.TutorialData.name);
    }
    /*------------------新手指引相关 end------------------ */

    /*------------------模块商店相关------------------ */
    public setModuleBoard(idx: number, data: IModuleBoardData) {
        GameData.ModuleShopData.moduleBoardData[idx] = data;

        GameData.markChange(GameData.ModuleShopData.name);
    }
    public getModuleBoard(idx: number) {
        return GameData.ModuleShopData.moduleBoardData[idx];
    }
    /**重置模块板块 */
    public resetModuleBoard(boardIdx: number) {
        const table = GM.configManager.syncGetConfigByType(ConfigType.Table_Shop);

        let goodsIdList: number[] = [];

        if (boardIdx == 0) {
            let cfgIDList: number[][] = [];
            for (let i = 1; i <= 3; i++) {//3行
                cfgIDList[i] = [];
                for (const key in table) {
                    if (Object.prototype.hasOwnProperty.call(table, key)) {
                        let id: number = Number(key);
                        if (id > i * 100 && id < (i + 1) * 100) {
                            cfgIDList[i].push(id);
                        }
                    }
                }
            }

            for (let i = 1; i <= 3; i++) {
                goodsIdList.push(...MathUtil.randomElementFromArrayByCount(cfgIDList[i], 3));
            }

        }
        else {
            let cfgIDList: number[] = [];
            let type: number = boardIdx == 1 ? 4 : 5;
            for (const key in table) {
                if (Object.prototype.hasOwnProperty.call(table, key)) {
                    let id: number = Number(key);
                    if (id > type * 100 && id < (type + 1) * 100) {
                        cfgIDList.push(id);
                    }
                }
            }

            goodsIdList.push(...MathUtil.randomElementFromArrayByCount(cfgIDList, 3));
        }

        return goodsIdList;
    }

    public getTodayResetModuleBoard(): boolean {
        return GameData.ModuleShopData.hasRefreshedModuleBoardsInTodayZero;
    }
    public setTodayResetModuleBoard(value: boolean) {
        GameData.ModuleShopData.hasRefreshedModuleBoardsInTodayZero = value;

        GameData.markChange(GameData.ModuleShopData.name);
    }

    /**模块商店检测 */
    public moduleShopCheck() {
        let autoUpdate: boolean = false;

        let zeroMillionSeconds = GameData.getLocalDateZeroMillionSeconds();
        for (let i = 0; i < 3; i++) {
            let boardData = this.getModuleBoard(i);

            let resetInterval: number = GM.configManager.getModuleRefreshInterval(i) * 1000;

            //自动刷新
            if (zeroMillionSeconds - boardData.lastResetTimeStamp >= resetInterval) {
                boardData.lastResetTimeStamp = zeroMillionSeconds;
                boardData.idList = this.resetModuleBoard(i);
                //重置次数
                boardData.resetTimes = 3;
                boardData.hasBoughtIdx = [];

                autoUpdate = true;
            }
        }

        return autoUpdate;
    }

    /*------------------模块商店相关 end------------------ */

    /*------------------特殊模式商店相关------------------ */
    public setSpModeShopBoard(mode: Enum_GameMode, idx: number, data: ISpModeShopBoardData) {
        GameData.SpGameModeShopData.modeBoardData[mode][idx] = data;

        GameData.markChange(GameData.SpGameModeShopData.name);
    }
    public getSpModeShopBoard(mode: Enum_GameMode, idx: number) {
        return GameData.SpGameModeShopData.modeBoardData[mode][idx];
    }
    /**重置特殊模式商店板块 */
    public resetSpModeShopBoard(mode: Enum_GameMode, boardIdx: number) {
        const table = GM.configManager.syncGetConfigByType(ConfigType.Table_VirtualCoinShop);

        let goodsIdList: number[] = [];

        let series: number;
        switch (mode) {
            case Enum_GameMode.Barrage:
                series = 1;
                break;
            case Enum_GameMode.Escort:
                series = 2;
                break;
            case Enum_GameMode.Secret:
                series = 3;
                break;
            case Enum_GameMode.Assault:
                series = 4;
                break;

            default:
                break;
        }

        let startId: number = series * 10000 + (boardIdx + 1) * 1000;
        let endId: number = series * 10000 + (boardIdx + 2) * 1000;

        let tempGoodsIDs: number[] = [];

        // let idx: number = 0;

        for (const key in table) {
            if (Object.prototype.hasOwnProperty.call(table, key)) {
                let curID: number = Number(key);

                if (curID >= startId && curID < endId) {
                    if ((curID % 10) % 3 == 0) {//只拿id 尾数是3的
                        tempGoodsIDs.push(curID);
                    }
                }
            }
        }

        let pickCnt: number = boardIdx == 0 ? 3 : 1;
        tempGoodsIDs = MathUtil.randomElementFromArrayByCount(tempGoodsIDs, pickCnt);

        for (let i = 0; i < tempGoodsIDs.length; i++) {
            const element = tempGoodsIDs[i];
            for (let j = 2; j >= 0; j--) {
                goodsIdList.push(element - j);
            }
        }

        return goodsIdList;
    }

    public getTodayResetSpModeShopBoard(): boolean {
        return GameData.SpGameModeShopData.hasRefreshedModuleBoardsInTodayZero;
    }
    public setTodayResetSpModeShopBoard(value: boolean) {
        GameData.SpGameModeShopData.hasRefreshedModuleBoardsInTodayZero = value;

        GameData.markChange(GameData.SpGameModeShopData.name);
    }

    /**特殊模式商店检测 */
    public SpGameModeShopCheck() {
        let autoUpdate: boolean = false;

        let zeroMillionSeconds = GameData.getLocalDateZeroMillionSeconds();

        let spMode: Enum_GameMode[] = [
            Enum_GameMode.Assault,
            Enum_GameMode.Barrage,
            Enum_GameMode.Escort,
            Enum_GameMode.Secret,
        ]
        for (let index = 0; index < spMode.length; index++) {
            const gameMode = spMode[index];

            for (let i = 0; i < 3; i++) {
                let boardData = this.getSpModeShopBoard(gameMode, i);

                let resetInterval: number = GM.configManager.getSpShopBoardRefreshInterval(i) * 1000;

                //自动刷新
                if (zeroMillionSeconds - boardData.lastResetTimeStamp >= resetInterval) {
                    //重置次数
                    boardData.resetTimes = 3;
                    boardData.lastResetTimeStamp = zeroMillionSeconds;
                    boardData.idList = this.resetSpModeShopBoard(gameMode, i);

                    boardData.hasBoughtIdx = [];

                    autoUpdate = true;
                }
            }
        }

        return autoUpdate;

    }

    /*------------------特殊模式商店相关 end------------------ */
    /*------------------特殊模式------------------ */
    /**
     * 获取特殊模式关卡数据
     * @param mode 
     * @returns 
     */
    public getSpGameModeLevelData(mode: Enum_GameMode): number {
        return GameData.SpModeLevelData.recordList[mode];
    }
    /**
      * 设置特殊模式关卡数据
      * @param mode 
      * @returns 
      */
    public setSpGameModeLevelData(mode: Enum_GameMode, value: number) {
        let passLv = this.getSpGameModeLevelData(mode);

        if (passLv < value) {
            GameData.SpModeLevelData.recordList[mode] = value;
            GameData.markChange(GameData.SpModeLevelData.name);
        }
    }

    public getSpGameFreeTimes(mode: Enum_GameMode): number {
        return GameData.SpModeLevelData.freePlayTimes[mode];
    }
    public setSpGameFreeTimes(mode: Enum_GameMode, value: number) {
        GameData.SpModeLevelData.freePlayTimes[mode] = value;

        GameData.markChange(GameData.SpModeLevelData.name);
    }
    /*------------------特殊模式 end------------------ */

    /*------------------特别活动------------------ */
    /**获取特别活动代币 */
    public getActivityCurrency() {
        return GameData.ActivityData.currency || 0;
    }

    /**增加特别活动代币 */
    public addActivityCurrency(add: number) {
        let now = this.getActivityCurrency();
        let next = now + add;
        if (next < 0) {
            return false;
        }

        console.log("addActivityCurrency ", add);

        //更新一下当前特别活动完成的最高阶段
        if (next > 0) {
            let curStep: number = GameData.ActivityData.finish_step;

            let activityID: number = this.getSpecialActivity()[0].cfgID;
            let cfg = GM.configManager.getSpecialActivityRewardCfg(activityID);

            if (cfg) {
                let keys = Object.keys(cfg);
                let isUpdateStep: boolean = false;

                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    const step: number = i + 1;
                    if (next >= cfg[key].cost && curStep < step) {
                        curStep = step;
                        isUpdateStep = true;
                    }

                }

                if (isUpdateStep) {
                    GameData.ActivityData.finish_step = curStep;
                    console.log("now activity step", curStep);
                    let logEventParam = {
                        activity_id: activityID,
                        step: curStep,
                    }
                    SDKManager.LogEvent(LogEvent.SPECIAL_EVENT_SCHEDULE, logEventParam);
                }

                GameData.markChange(GameData.ActivityData.name);
            }
        }

        if (next > 50000) {
            let luckyScrollCnt: number = Math.floor((next - 50000) / 4000);
            let gainTimes: number = GameData.ActivityData.getLuckyScrollTimes || 0;

            if (gainTimes < luckyScrollCnt) {
                this.addLuckyScroll(luckyScrollCnt - gainTimes);
            }
        }

        this.setActivityCurrency(next);

        return true;
    }

    public setActivityCurrency(num: number) {
        GameData.ActivityData.currency = num;

        let eventDispatcherManager = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.Currency);
        eventDispatcherManager.Emit(CustomEvents.OnActivityCurrencyChange);

        GameData.markChange(GameData.ActivityData.name);
    }


    public isActivityCurrencyEnough(cost: number) {
        return this.getActivityCurrency() >= cost;
    }

    /**记录特别活动领奖记录 */
    public setActivityTakeRewardIdx(rewardIdx: number) {
        let activityRewardIdxList = GameData.ActivityData.hasTakeRewardIdx || [];

        if (!activityRewardIdxList.includes(rewardIdx)) {
            activityRewardIdxList.push(rewardIdx);
        }

        GameData.ActivityData.hasTakeRewardIdx = activityRewardIdxList;

        GameData.markChange(GameData.ActivityData.name);
    }


    public hasTakeActivityReward(rewardIdx: number) {
        let activityRewardIdxList = GameData.ActivityData.hasTakeRewardIdx || [];

        return activityRewardIdxList.includes(rewardIdx);
    }

    public addLuckyScroll(add: number) {
        if (add > 0) {
            console.log("addLuckyScroll", add);

            let gainTimes: number = GameData.ActivityData.getLuckyScrollTimes || 0;

            gainTimes += add;
            GameData.ActivityData.getLuckyScrollTimes = gainTimes;
        }

        let next: number = GameData.ActivityData.luckyScroll + add;
        if (next < 0) {
            return false;
        }

        GameData.ActivityData.luckyScroll = next;
    }

    public getLuckScroll() {
        return GameData.ActivityData.luckyScroll || 0;
    }

    /**获取特别活动数据 */
    public getSpecialActivity() {
        let listData: { cfgID: number, validTimeStamp: number }[] = [];

        let table = GM.configManager.syncGetConfigByType(ConfigType.Table_SpecialActivity);
        let id = Number(Object.keys(table)[GameData.ActivityData.idx]);

        let d: { cfgID: number, validTimeStamp: number } = {
            cfgID: id,
            validTimeStamp: GameData.ActivityData.startTimeStamp + SP_ACTIVITY_VALID_TIME * 1000
        }

        listData.push(d);

        return listData;
    }



    /*------------------特别活动 end------------------ */

    public getLocalDateZeroMillionSeconds() {
        return GameData.getLocalDateZeroMillionSeconds();
    }

    /**获取上次更新体力的时间戳 */
    public getUpdatePowerTimeStamp() {
        return GameData.UserData.powerLastUpdateTimeStamp;
    }

    /*------------------里程商店------------------ */
    public setMileageShopBoard(idx: number, data: IMileageShopBoardData) {
        GameData.MileageShopViewData.boardData[idx] = data;

        GameData.markChange(GameData.MileageShopViewData.name);
    }
    public getMileageShopBoard(idx: number) {
        return GameData.MileageShopViewData.boardData[idx];
    }

    public getTodayResetMileageShopBoard(): boolean {
        return GameData.MileageShopViewData.hasRefreshedModuleBoardsInTodayZero;
    }
    public setTodayResetMileageShopBoard(value: boolean) {
        GameData.MileageShopViewData.hasRefreshedModuleBoardsInTodayZero = value;

        GameData.markChange(GameData.MileageShopViewData.name);
    }

    /**重置里程板块 */
    public resetMileageShopBoard(boardIdx: number) {
        const table = GM.configManager.syncGetConfigByType(ConfigType.Table_Equipment);

        let goodsIdList: IEquipmentGoods[] = [];

        let cnt: number = boardIdx == 0 ? 9 : 3;

        let setList: number[] = [];
        let equipmentQuality: Enum_EquipmentQuality;
        let setRange: number[] = [1, 2];
        let random_set: number = MathUtil.randomElementFromArray(setRange);
        if (boardIdx == 0) {
            equipmentQuality = Enum_EquipmentQuality.Bronze;
            for (let i = 0; i < cnt; i++) {
                let row: number = Math.floor(i / 3);
                if (row <= 1) {
                    setList.push(row + 1);
                }
                else {//第三行原本是套装三，目前没开放
                    setList.push(random_set);
                }

            }
        }
        else if (boardIdx == 1) {
            equipmentQuality = Enum_EquipmentQuality.Sliver;
            for (let i = 0; i < cnt; i++) {
                setList.push(random_set);
            }
        }
        else if (boardIdx == 2) {
            equipmentQuality = Enum_EquipmentQuality.Golden;
            for (let i = 0; i < cnt; i++) {
                setList.push(random_set);
            }
        }


        for (let i = 0; i < cnt; i++) {
            let set = setList[i];

            let equipmentInf = GM.gameDataManager.createEquipmentByQuality(equipmentQuality);
            let equipmentData = table[equipmentInf.cfgID] as TBDATA_Equipment;

            let costCnt: number = CalcUtil.calcEquipmentValue(set, equipmentData.subject, equipmentQuality);

            let goods: IEquipmentGoods = {
                cfgID: equipmentInf.cfgID,
                stars: equipmentInf.stars,
                quality: equipmentQuality,
                costIcon: "104_1",
                costData: { type: Enum_Currency.Mileage, cnt: costCnt },
                buyID: 0,
                uid: equipmentInf.uid,
                lv: equipmentInf.lv,
                mainValue: equipmentInf.mainValue,
                element: equipmentInf.element,
                damage_type: equipmentInf.damage_type,
                ownerType: equipmentInf.ownerType,
                ownerID: equipmentInf.ownerID,
                equipmentIdx: equipmentInf.equipmentIdx,
                canBuy: true,
                set: set,
                isNew: equipmentInf.isNew,

            }

            goodsIdList.push(goods);
        }

        return goodsIdList;
    }

    /**里程商店检测 */
    public MileageShopCheck() {
        let autoUpdate: boolean = false;

        let zeroMillionSeconds = GameData.getLocalDateZeroMillionSeconds();
        for (let i = 0; i < 3; i++) {
            let boardData = this.getMileageShopBoard(i);

            let resetInterval: number = GM.configManager.getModuleRefreshInterval(i) * 1000;

            //自动刷新
            if (zeroMillionSeconds - boardData.lastResetTimeStamp >= resetInterval) {
                boardData.lastResetTimeStamp = zeroMillionSeconds;
                boardData.goodsList = this.resetMileageShopBoard(i);
                //重置次数
                boardData.resetTimes = 3;
                boardData.hasBoughtIdx = [];

                autoUpdate = true;
            }
        }

        return autoUpdate;

    }
    /*------------------里程商店 end------------------ */

    /**当前是否能买任何一件货币商品 */
    canBuyAnyCurrencyGoods(): boolean {
        let table = GM.configManager.syncGetConfigByType(ConfigType.Table_Shop);

        for (let i = 0; i < 3; i++) {
            let id: number = i + 1;
            let cfg = table[id] as TBDATA_Shop;
            let isCurrencyEnough: boolean = GM.gameDataManager.isCurrencyEnough(cfg.cost_type, cfg.cost_count);
            if (isCurrencyEnough) {
                return true;
            }


            id = i + 11;
            cfg = table[id] as TBDATA_Shop;
            isCurrencyEnough = GM.gameDataManager.isCurrencyEnough(cfg.cost_type, cfg.cost_count);
            if (isCurrencyEnough) {
                return true;
            }
        }

        return false;
    }


    /*------------------幸运抽奖------------------ */
    getLuckyRaffleFinalRewardState(idx: number) {
        return GameData.LuckyRaffleData.finalRewardState[idx] || Enum_RewardState.NotFinished;
    }

    setLuckyRaffleFinalReward(idx: number, state: Enum_RewardState) {
        GameData.LuckyRaffleData.finalRewardState[idx] = state;
        GameData.markChange(GameData.LuckyRaffleData.name);
    }

    /**记录幸运抽奖次数 */
    addLuckyRaffleDrawTimes(add: number = 1) {
        let totalCnt: number = 0;
        let t = this.getLuckyRaffleTotalDrawTimes();
        totalCnt = GameData.LuckyRaffleData.totalDrawTimes = t + add;
        t = this.getLuckyRaffleTodayDrawTimes();
        GameData.LuckyRaffleData.todayDrawTimes = t + add;

        const table = GM.configManager.syncGetConfigByType(ConfigType.Table_LuckyRaffleFinalReward);
        const keys = Object.keys(table);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const data = table[key] as TBDATA_LuckyRaffleFinalReward;
            const rewardState = this.getLuckyRaffleFinalRewardState(i);
            if (data.draw_count <= totalCnt && rewardState == Enum_RewardState.NotFinished) {
                this.setLuckyRaffleFinalReward(i, Enum_RewardState.NotTake);
            }
        }


        GameData.markChange(GameData.LuckyRaffleData.name);
    }

    /**获取当天幸运抽奖次数 */
    getLuckyRaffleTodayDrawTimes() {
        return GameData.LuckyRaffleData.todayDrawTimes || 0;
    }

    /**获取总共幸运抽奖次数 */
    getLuckyRaffleTotalDrawTimes() {
        return GameData.LuckyRaffleData.totalDrawTimes || 0;
    }

    /**获取上次免费幸运抽奖的时间戳 单位：毫秒*/
    getLuckyRaffleFreeDrawTimeStamp() {
        return GameData.LuckyRaffleData.lastFreeDrawTimeStamp || 0;
    }

    /**设置免费幸运抽奖的时间戳  单位：毫秒*/
    setLuckyRaffleFreeDrawTimeStamp(t: number) {
        GameData.LuckyRaffleData.lastFreeDrawTimeStamp = t;
        GameData.markChange(GameData.LuckyRaffleData.name);
    }
    /**是否能免费抽幸运抽奖 */
    canFreeDrawLuckyRaffle() {
        let lastFreeDrawTimeStamp = GM.gameDataManager.getLuckyRaffleFreeDrawTimeStamp();
        let nowTime = GM.timeStampManager.getDateTimeStamp();
        let elapsedTime = (nowTime - lastFreeDrawTimeStamp) / 1000;
        const freeDrawInterval = GM.configManager.freeDrawInterval_luckyRaffle;

        const todayTotalDrawLimiteTimes = GM.configManager.totalDrawLimiteTimesToday_luckyRaffle;

        const todayDrawCount: number = GM.gameDataManager.getLuckyRaffleTodayDrawTimes();

        let canClickDraw: boolean = todayTotalDrawLimiteTimes > todayDrawCount;

        return canClickDraw && elapsedTime >= freeDrawInterval;
    }
    /*------------------幸运抽奖 end------------------ */
}
