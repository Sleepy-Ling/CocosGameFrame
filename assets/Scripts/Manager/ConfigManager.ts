
import { TBDATA_Special_task_goal } from "../../AssetsBundles/Activity/Scripts/TableData/TBDATA_Special_task_goal";
import { GM } from "../Core/Global/GM";
import { CalcUtil } from "../Core/Utils/CalcUtil";
import { MathUtil } from "../Core/Utils/MathUtil";
import { StringUtil } from "../Core/Utils/StringUtil";
import { Util } from "../Core/Utils/Util";
import { ConfigType, Enum_AssetBundle, Enum_Difficulty, Enum_GameMode, Enum_ColliderType, Enum_PlaneBuffType, Enum_OwnerSubject, Enum_Language, Enum_Chip, Enum_DamageType, Enum_EquipmentType, Enum_PlaneEquipmentPlace, Enum_WingmanEquipmentPlace, Enum_EngineEquipmentPlace, Enum_EquipmentQuality, Enum_Currency, Enum_RewardItemType, AudioType, Enum_GameObject, Enum_MoveDir, Enum_TechnicType, Enum_OnlineParam, Enum_SustainableBuffQuality } from "../Def/EnumDef";

import { EquipmentPlace, ICombineInf, ICostData, RewardData, TBDATA_BaseObject, TBDATA_BasePassiveSkillUpgradeCost, TBDATA_BaseUpgradeCost } from "../Def/StructDef";
import { SDKManager } from "../SDK/SDKManager";
import { TBDATA_CustomEquipment } from "../TableData/TBDATA_CustomEquipment";
import { TBDATA_Enemy } from "../TableData/TBDATA_Enemy";
import { TBDATA_Engine } from "../TableData/TBDATA_Engine";
import { TBDATA_Fighting_Skill } from "../TableData/TBDATA_Fighting_Skill";
import { TBDATA_LevelFirstPassReward } from "../TableData/TBDATA_LevelFirstPassReward";
import { TBDATA_Plane } from "../TableData/TBDATA_Plane";
import { TBDATA_Reward } from "../TableData/TBDATA_Reward";

import { TBDATA_Skill } from "../TableData/TBDATA_Skill";
import { TBDATA_SpecialActivity } from "../TableData/TBDATA_SpecialActivity";
import { TBDATA_SustainableBuff } from "../TableData/TBDATA_SustainableBuff";
import { TBDATA_Task } from "../TableData/TBDATA_Task";
import { TBDATA_Wingman } from "../TableData/TBDATA_Wingman";
import ManagerBase from "./ManagerBase";

/**
 * 配置管理者
 * @description 读取配置专用
 */
export default class ConfigManager extends ManagerBase {
    configDic: { [key: string]: object } = {}
    ParseData(type: ConfigType | string, json: any) {
        this.configDic[type] = json;

        console.log(type, json);
    }

    syncGetConfigByType(type: ConfigType | string) {
        return this.configDic[type];
    }


    async GetConfigByType(type: ConfigType | string, assetBundle: Enum_AssetBundle = Enum_AssetBundle.Config) {
        if (this.configDic[type]) {
            return Promise.resolve(this.configDic[type]);
        }

        let jsonAsset = await Util.Res.LoadAssetRes<cc.JsonAsset>(assetBundle, type);
        this.ParseData(type, jsonAsset.json);

        return Promise.resolve(jsonAsset.json);
    }

    /**首次通关结算奖励 */
    GetLevelFirstPassRewardCfg(lv: number, difficulty: Enum_Difficulty): TBDATA_LevelFirstPassReward {
        const cfg = this.configDic[ConfigType.Table_LevelFirstPassReward];
        return cfg[`${lv}_${difficulty}`];
    }

    /**获取对应模式的关卡配置 */
    GetLevelConfig(lv: number, type: Enum_GameMode = Enum_GameMode.Campaign): Readonly<Object> {
        //test
        lv = 1;

        let configName: string;

        if (!this.configDic[configName]) {
            console.error("GetLevelConfig error ==> ", "lv", lv);
            return null;
        }

        return this.configDic[configName] as Readonly<Object>;
    }

    /**获取敌人配置 */
    GetEnemyConfig(id: string) {
        let configName: string = ConfigType.Table_Enemy;
        if (!this.configDic[configName]) {
            console.error("GetEnemyConfig error ==> ", id);
            return null;
        }

        return this.configDic[configName][id] as Readonly<TBDATA_Enemy>;
    }

    /**获取boss 配置 */
    GetBossActionConfig(id: string) {
        let configName: string = `Table_${id}_Action`;
        if (!this.configDic[configName]) {
            console.error("GetBossActionConfig error ==> ", id);
            return null;
        }

        return this.configDic[configName] as Readonly<Object>;
    }

    GetBossBatteryConfig(bossID: string) {
        let configName: string = `Table_${bossID}_Battery`;
        if (!this.configDic[configName]) {
            console.error("GetBossBatteryConfig error ==> ", bossID);
            return null;
        }

        return this.configDic[configName] as Readonly<Object>;
    }

    /**获取游戏中全局事件配置 */
    GetGlobalGamingEventCfg(id: string): Readonly<Object> {
        // let configName: string = `Table_Boss${bossID}_Battery`;
        // Table_GlobalGamingEvent

        return this.configDic[ConfigType.Table_GlobalGamingEvent][id];
    }

    readonly air_wall_normal_l: cc.Vec2 = cc.v2(1, 0);
    readonly air_wall_normal_r: cc.Vec2 = cc.v2(-1, 0);
    readonly air_wall_normal_u: cc.Vec2 = cc.v2(0, -1);
    readonly air_wall_normal_d: cc.Vec2 = cc.v2(0, 1);

    /**获取对应空气墙的法线方向 */
    getAirWallNormalVec(type: Enum_ColliderType.AirWall_Reflect_LEFT | Enum_ColliderType.AirWall_Reflect_RIGHT |
        Enum_ColliderType.AirWall_UP | Enum_ColliderType.AirWall_DOWN) {

        switch (type) {
            case Enum_ColliderType.AirWall_Reflect_LEFT:
                return this.air_wall_normal_l;
                break;
            case Enum_ColliderType.AirWall_Reflect_RIGHT:
                return this.air_wall_normal_r;
                break;
            case Enum_ColliderType.AirWall_UP:
                return this.air_wall_normal_u;
                break;
            case Enum_ColliderType.AirWall_DOWN:
                return this.air_wall_normal_d;
                break;
        }
    }

    /**buff id 映射表 */
    buffDic: { [key: string]: Enum_PlaneBuffType } = {
        "ToolBuff_101": Enum_PlaneBuffType.PowerUp_Prop,
        "ToolBuff_102": Enum_PlaneBuffType.MagneticForceUp,
        "ToolBuff_103": Enum_PlaneBuffType.ShieldDefense,
    }

    /**buff 时长 映射表 */
    buffTimeDic: { [key: number]: number } = {
        [Enum_PlaneBuffType.PowerUp_Prop]: 5,
        [Enum_PlaneBuffType.MagneticForceUp]: 5,
        [Enum_PlaneBuffType.ShieldDefense]: 5,
    }

    /**buff 时长 映射表 */
    buffDic2: { [key: number]: { validTime: number, effectName: string } } = {
        [Enum_PlaneBuffType.PowerUp_Prop]: { validTime: 5, effectName: "" },
        [Enum_PlaneBuffType.MagneticForceUp]: { validTime: 5, effectName: "" },
        [Enum_PlaneBuffType.ShieldDefense]: { validTime: 5, effectName: "Effect_DefenseShield" },
    }

    /**体力上限 */
    readonly power_max: number = 100;
    /**梯队个数 */
    readonly troop_count_max: number = 4;
    /**更新体力时间间隔 */
    readonly update_power_interval: number = 3 * 60;

    /**每个难度的杀敌数 */
    readonly CountOfKillingEnemy: { [key: number]: number } = {
        [Enum_Difficulty.Primary]: 50,
        [Enum_Difficulty.Junior]: 70,
        [Enum_Difficulty.Senior]: 90,
    }

    readonly MAX_LV: number = 100;

    readonly OBJECT_MAX_LV: Readonly<{ [key: number]: number }> = {
        [Enum_OwnerSubject.Plane]: 100,
        [Enum_OwnerSubject.Wingman]: 50,
        [Enum_OwnerSubject.Engine]: 30,
    }

    /**一个星级里面总升级次数 */
    readonly totalUpgradeTimesInOneStar: Readonly<{ [key: number]: number }> = {
        [Enum_OwnerSubject.Plane]: 10,
        [Enum_OwnerSubject.Wingman]: 5,
        [Enum_OwnerSubject.Engine]: 3,
    }

    /**被动技能数量 */
    readonly passiveSkillCount: Readonly<{ [key: number]: number }> = {
        [Enum_OwnerSubject.Plane]: 4,
        [Enum_OwnerSubject.Wingman]: 2,
        [Enum_OwnerSubject.Engine]: 2,
    }

    /**科技点提升值 */
    readonly techni_improve_value: number = 0.25;

    /**通用飞机碎片 */
    readonly common_plane_chip_id: number = 411;
    /**通用僚机碎片 */
    readonly common_wingman_chip_id: number = 412;
    /**通用引擎碎片 */
    readonly common_engine_chip_id: number = 413;

    /**随机技能点 */
    readonly random_technic_point_id: number = 399;

    /**一个系列里面有多少个关卡 */
    readonly lv_count_in_one_season: number = 10;

    /**当前有多少个系列 */
    readonly max_count_seasons: number = 5;
    /**最大复活次数 */
    readonly reborn_max_times: number = 3;
    /**最大广告恢复全部血量次数 */
    readonly recovery_max_times: number = 3;

    /**一天最多开奖次数 */
    readonly totalDrawLimiteTimesToday_luckyRaffle: number = 20;
    /**免费开奖时间间隔 单位：秒 */
    readonly freeDrawInterval_luckyRaffle: number = 3 * 60;

    /**通过id 获得对应buff 类型 */
    GetBuffByID(id: string) {
        let result: Enum_PlaneBuffType = Enum_PlaneBuffType.None;
        if (this.buffDic[id]) {
            result = this.buffDic[id];
        }

        return result;
    }

    /**通过buff 类型 获得对应id */
    GetBuffIDByBuffType(type: Enum_PlaneBuffType) {
        const keys = Object.keys(this.buffDic);
        for (const key of keys) {
            if (this.buffDic[key] == type) {
                return key;
            }
        }

        return null;
    }

    GetBuffTimeByType(type: Enum_PlaneBuffType) {
        return this.buffTimeDic[type] || 1;
    }

    GetBuffEffectName(type: Enum_PlaneBuffType): string {
        return this.buffDic2[type].effectName || "";
    }

    /**可视化buff */
    readonly visibleBuff: ReadonlyArray<Enum_PlaneBuffType> = [
        Enum_PlaneBuffType.PowerUp_Prop,
        Enum_PlaneBuffType.MagneticForceUp,
        Enum_PlaneBuffType.ShieldDefense,
    ]
    /**该buff是否可视 */
    isBuffVisible(type: Enum_PlaneBuffType) {
        return this.visibleBuff.includes(type);
    }

    /**根据品质去获取对应的无限期buff数据  */
    GetSustainBuffIDByQuality(quality: Enum_SustainableBuffQuality): ReadonlyArray<number> {
        let result: Array<number> = [];
        let table = this.syncGetConfigByType(ConfigType.Table_SustainableBuff);
        for (const key in table) {
            if (Object.prototype.hasOwnProperty.call(table, key)) {
                const element = table[key] as TBDATA_SustainableBuff;
                if (element.quality == quality) {
                    result.push(Number(key));
                }
            }
        }

        return result;
    }
    /**获取无限期buff 数据 */
    GetSustainBuffByID(id: number): Readonly<TBDATA_SustainableBuff> {
        let table = this.syncGetConfigByType(ConfigType.Table_SustainableBuff);
        return table[id];
    }
    /**获取无限期buff 品质几率 */
    GetSustainBuffQualityRate() {
        let result: Record<Enum_SustainableBuffQuality, number> = {
            [Enum_SustainableBuffQuality.Grey]: 0.15,
            [Enum_SustainableBuffQuality.Green]: 0.2,
            [Enum_SustainableBuffQuality.Blue]: 0.35,
            [Enum_SustainableBuffQuality.Purple]: 0.2,
            [Enum_SustainableBuffQuality.Gold]: 0.1
        }

        return result;
    }

    /**获取无限期buff 品质流光颜色 */
    GetSustainBuffFlowingLightColor(quality: Enum_SustainableBuffQuality) {
        let cfg = {
            [Enum_SustainableBuffQuality.Grey]: "",
            [Enum_SustainableBuffQuality.Green]: "#65FF93",
            [Enum_SustainableBuffQuality.Blue]: "#65B8FF",
            [Enum_SustainableBuffQuality.Purple]: "#E965FF",
            [Enum_SustainableBuffQuality.Gold]: "#FFF065"
        }

        return cfg[quality];
    }

    GetLangStrByID(ID: number, lang: Enum_Language, ...param: string[]) {
        let cfg = this.configDic[ConfigType.Table_Language];
        if (cfg[ID] == null || cfg[ID][lang] == null) {
            console.log("language  id  null  :", ID, "  cfg", cfg);
            return "";
        }

        let exp = /\{\w+\}/g
        let str: string = cfg[ID][lang];

        return StringUtil.formatStrWithRegExp(str, param, exp);
    }

    public getAttackObjectTypeList() {
        let type: Enum_GameObject[] = [Enum_GameObject.Plane, Enum_GameObject.PlaneWithBuff, Enum_GameObject.Battery, Enum_GameObject.BatteryGroup, Enum_GameObject.Missile, Enum_GameObject.AttackObject];

        return type;
    }

    /**获得对应id的子弹击中效果名 */
    public getBulletHitEffectName(id: string) {
        return "Effect_Hit";
    }

    /**
     * 获得对应id的飞机爆炸效果名
     * @param nodeName 节点名
     * @returns 
     */
    public getEnemyExplodeEffectName(nodeName: string) {
        let cfg: TBDATA_Enemy = this.GetEnemyConfig(nodeName);
        if (cfg && cfg.explode_effect_name) {
            return cfg.explode_effect_name;
        }

        return "Effect_Explode";
    }

    /**获取对应id的飞机爆炸音效 */
    public getEnemyExploadSoundEffect(nodeName: string) {
        let cfg: TBDATA_Enemy = this.GetEnemyConfig(nodeName);
        if (cfg && cfg.explode_sound) {
            return cfg.explode_sound;
        }

        return AudioType.SmallExplode;
    }

    /**获取敌机血条宽高 */
    public getEnemyHpWidthHeight(nodeName: string) {
        let cfg: TBDATA_Enemy = this.GetEnemyConfig(nodeName);
        if (cfg) {
            return { width: cfg.hp_strip_width || 100, height: cfg.hp_strip_height || 50 };
        }


        return { width: 100, height: 50 };
    }

    /**获取发射声音 */
    public getEnemyLaunchSound(nodeName: string) {
        let cfg: TBDATA_Enemy = this.GetEnemyConfig(nodeName);
        if (cfg) {
            return cfg.launch_sound;
        }
    }

    /**获取飞机配置 */
    public getPlaneCfgByID(id: number): Readonly<TBDATA_Plane> {
        const planeCfg = this.configDic[ConfigType.Table_Plane][id] as TBDATA_Plane;

        return planeCfg;
    }

    public getWingmanCfgByID(id: number): Readonly<TBDATA_Wingman> {
        const wingmanCfg = this.configDic[ConfigType.Table_Wingman][id] as TBDATA_Wingman;

        return wingmanCfg;
    }

    public getEngineCfgByID(id: number): Readonly<TBDATA_Engine> {
        const engineCfg = this.configDic[ConfigType.Table_Engine][id] as TBDATA_Engine;

        return engineCfg;
    }

    /**
     * 获得某个系列中 飞机/僚机/引擎的总个数
     * @param ownerType 
     * @param series 
     */
    public getObjectCountInOneSeries(ownerType: Enum_OwnerSubject, series: number) {
        let obj: Object;
        switch (ownerType) {
            case Enum_OwnerSubject.Plane:
                obj = this.configDic[ConfigType.Table_Plane];
                break;
            case Enum_OwnerSubject.Wingman:
                obj = this.configDic[ConfigType.Table_Wingman];
                break;
            case Enum_OwnerSubject.Engine:
                obj = this.configDic[ConfigType.Table_Engine];
                break;
            default:
                return;
        }

        let count: number = 0;
        if (obj) {
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    let id = Number(key);
                    if (id >= ownerType * 10000 + series * 1000 && id < ownerType * 10000 + (series + 1) * 1000) {
                        count++;
                    }
                }
            }

        }

        return count;
    }

    public getObjectCfgByID(id: number, type: Enum_OwnerSubject): Readonly<TBDATA_BaseObject> {
        switch (type) {
            case Enum_OwnerSubject.Plane:
                return this.getPlaneCfgByID(id);
            case Enum_OwnerSubject.Wingman:
                return this.getWingmanCfgByID(id);
            case Enum_OwnerSubject.Engine:
                return this.getEngineCfgByID(id);
            default:
                return;
        }
    }

    /**根据持有者类型，获得通用碎片id */
    public getCommonChipTypeByOwnerType(type: Enum_OwnerSubject) {
        switch (type) {
            case Enum_OwnerSubject.Plane:
                return Enum_Chip.common_plane;
            case Enum_OwnerSubject.Wingman:
                return Enum_Chip.common_wingman;
            case Enum_OwnerSubject.Engine:
                return Enum_Chip.common_engine;
            default:
                break;
        }
    }

    /**获取自定义装备配置 */
    public getCustomEquipmentCfgByID(id: string): Readonly<TBDATA_CustomEquipment> {
        const cfg = this.configDic[ConfigType.Table_CustomEquipment][id] as TBDATA_CustomEquipment;

        return cfg;
    }

    public getPlaneInOneSeries(series: number) {
        let idMinRange: number = series * 1000;
        let idMaxRange: number = (series + 1) * 1000;

        const obj = this.configDic[ConfigType.Table_Plane];
        const keys = Object.keys(obj);

        const resultPlaneCfg: TBDATA_Plane[] = [];
        for (const key of keys) {
            const id = Number(key);
            if (id > idMinRange && id < idMaxRange) {
                resultPlaneCfg.push(obj[key]);
            }
        }

        return resultPlaneCfg;
    }

    /**获取对象升级次数（基于一颗星） */
    public getTotalUpgradeTimesInOneStar(type: Enum_OwnerSubject) {
        return this.totalUpgradeTimesInOneStar[type];
    }

    /**获得升级消费配置 */
    public getUpgradeCostCfg(type: Enum_OwnerSubject): Readonly<TBDATA_BaseUpgradeCost> {
        switch (type) {
            case Enum_OwnerSubject.Plane:
                return this.configDic[ConfigType.Table_PlaneUpgradeCost] as TBDATA_BaseUpgradeCost;
                break;
            case Enum_OwnerSubject.Wingman:
                return this.configDic[ConfigType.Table_WingmanUpgradeCost] as TBDATA_BaseUpgradeCost;

                break;
            case Enum_OwnerSubject.Engine:
                return this.configDic[ConfigType.Table_EngineUpgradeCost] as TBDATA_BaseUpgradeCost;
                break;
        }
    }

    /**获取被动技能升级消费配置 */
    public getPassiveUpgradeCostCfg(type: Enum_OwnerSubject): Readonly<Object> {
        switch (type) {
            case Enum_OwnerSubject.Plane:
                return this.configDic[ConfigType.Table_PlaneUpgradePassiveSkill];
                break;
            case Enum_OwnerSubject.Wingman:
                return this.configDic[ConfigType.Table_WingmanUpgradePassiveSkill];

                break;
            case Enum_OwnerSubject.Engine:
                return this.configDic[ConfigType.Table_EngineUpgradePassiveSkill];
                break;
        }
    }

    /**获取被动技能升级消费阶段数 */
    public getPassiveUpgradeCostStepCount(type: Enum_OwnerSubject): number {
        return Object.keys(this.getPassiveUpgradeCostCfg(type)).length;
    }

    /**获取被动技能在一个阶段中升级的次数 */
    public getPassiveUpgradeTimesInOneStep(type: Enum_OwnerSubject) {
        return 5;
    }

    /**
     * 获得进阶的碎片消耗数
     * @param type 类型
     * @param advanceStep 进阶数
     */
    public getObjectAdvanceCost(type: Enum_OwnerSubject, advanceStep: number) {
        const advanceCostArr: number[] = [0, 40, 80, 120, 200, 300, 400, 600, 800, 1000];
        advanceStep = MathUtil.clamp(advanceStep, 0, advanceCostArr.length - 1);
        return advanceCostArr[advanceStep];
    }


    public getObjectAssetInf(type: Enum_OwnerSubject, id: number) {
        let assetBundle: Enum_AssetBundle;
        let assetName: string;
        let anim_displayIdle: string;
        let anim_displayIdleLoop: string;
        let cfg: TBDATA_BaseObject;
        switch (type) {
            case Enum_OwnerSubject.Plane:
                cfg = this.getPlaneCfgByID(id) as TBDATA_Plane;
                assetBundle = Enum_AssetBundle.Plane;
                assetName = `Plane_${id}`;
                anim_displayIdle = cfg?.anim_display_idle_name;
                anim_displayIdleLoop = cfg?.anim_loop_display_idle_name;
                break;
            case Enum_OwnerSubject.Wingman:
                cfg = this.getWingmanCfgByID(id) as TBDATA_Wingman;
                assetBundle = Enum_AssetBundle.Wingman;


                assetName = cfg?.has_LR ? `Wingman_${id}_L` : `Wingman_${id}`;
                anim_displayIdle = cfg?.anim_display_idle_name;
                anim_displayIdleLoop = cfg?.anim_loop_display_idle_name;
                break;
            case Enum_OwnerSubject.Engine:
                cfg = this.getEngineCfgByID(id) as TBDATA_Engine;
                assetBundle = Enum_AssetBundle.Engine;
                assetName = `Engine_${id}`;
                anim_displayIdle = cfg?.anim_display_idle_name;
                anim_displayIdleLoop = cfg?.anim_loop_display_idle_name;
                break;
        }

        return { assetBundle: assetBundle, assetName: assetName, anim_displayIdle: anim_displayIdle };
    }

    /**
     * 获取合成路线
     * @param ownerType 对象类型
     * @param preCombineId 某个前置合成id
     * @param resultId 合成后的结果id
     * @returns 
     */
    public getCombineInf(ownerType: Enum_OwnerSubject, preCombineId?: number, resultId?: number): Readonly<ICombineInf> {
        let tableName: string;
        switch (ownerType) {
            case Enum_OwnerSubject.Plane:
                tableName = "Table_PlaneCombine";
                break;
            case Enum_OwnerSubject.Wingman:
                tableName = "Table_WingmanCombine";

                break;
            case Enum_OwnerSubject.Engine:
                tableName = "Table_EngineCombine";
                break;
        }

        let table = this.syncGetConfigByType(tableName);

        for (const key in table) {
            if (Object.prototype.hasOwnProperty.call(table, key)) {
                const element = table[key] as ICombineInf;
                if (preCombineId != null) {
                    if (element.preCompose.includes(preCombineId)) {
                        return element;
                    }
                }

                if (resultId != null && element.result == resultId) {
                    return element;
                }

            }
        }

        return null;
    }

    /**获取伤害类型文本 */
    public getDamageTypeStr(type: Enum_DamageType) {
        if (type == Enum_DamageType.Explode) {
            return "爆炸伤害";
        }
        else if (type == Enum_DamageType.Puncture) {
            return "穿刺伤害";
        }
        else if (type == Enum_DamageType.Vibrate) {
            return "震荡伤害";
        }
        else if (type == Enum_DamageType.Impact) {
            return "冲击伤害";
        }

    }

    /**获得装备套装描述文本 */
    public getEquipmentSuitStr(ownerType: Enum_OwnerSubject, place: number) {
        if (ownerType == Enum_OwnerSubject.Plane) {
            if (place == Enum_PlaneEquipmentPlace.SpecialFirearm ||
                place == Enum_PlaneEquipmentPlace.MainFirearm ||
                place == Enum_PlaneEquipmentPlace.SideFirearm ||
                place == Enum_PlaneEquipmentPlace.ReserveFirearm) {
                return "4枪械";
            }
            else {
                return "3护甲"
            }

        }
        else if (ownerType == Enum_OwnerSubject.Wingman) {
            if (place == Enum_WingmanEquipmentPlace.MainFirearm) {
                return "2枪械";
            }
            else {
                return "2护甲"
            }
        }
        else if (ownerType == Enum_OwnerSubject.Engine) {
            return "1系统1护甲";
        }

    }


    /**获得品质字符串 */
    public getQualityStr(quality: Enum_EquipmentQuality) {
        const qualityList: string[] = ["青铜", "白银", "黄金", "青色鎏金", "蓝色鎏金", "紫色鎏金", "深紫色鎏金", "红色鎏金"]
        return qualityList[quality];
    }

    /**获取装备四维属性文本 */
    public getEquipmentElementStr(type: Enum_EquipmentType) {
        if (type == Enum_EquipmentType.Attack) {
            return ["护甲穿刺", "强化准确度", "暴击率", "暴击倍数"];
        }
        else if (type == Enum_EquipmentType.Defense) {
            return ["伤害减免", "闪避几率", "格挡率", "格挡伤害"];
        }
        else if (type == Enum_EquipmentType.Extra_1) {
            return ["冷却时间", "持续时间", "超频率", "超频倍数"];
        }
        else if (type == Enum_EquipmentType.Extra_2) {
            return ["效果1", "效果2", "效果3", "效果3"];
        }
    }

    /**获取装备主要属性文本 */
    public getEquipmentMainValueStr(type: Enum_EquipmentType, extraType?: number) {
        if (type == Enum_EquipmentType.Attack) {
            return "伤害/秒";
        }
        else if (type == Enum_EquipmentType.Defense) {
            return "血量";
        }
        else if (type == Enum_EquipmentType.Extra_1) {
            return "额外";
        }
        else if (type == Enum_EquipmentType.Extra_2) {
            return "效果";
        }
    }

    /**获取装备主要属性icon 命名 */
    public getEquipmentMainValueIconName(type: Enum_EquipmentType, extraType?: number) {
        if (type == Enum_EquipmentType.Attack) {
            return "atk_damage";
        }
        else if (type == Enum_EquipmentType.Defense) {
            return "def_hp";
        }
        else if (type == Enum_EquipmentType.Extra_1) {
            return "extra_1";
        }
        else if (type == Enum_EquipmentType.Extra_2) {
            return "extra_2";
        }
    }

    /**获取装备4个元素 前缀 */
    public getEquipmentElementPrefix(type: Enum_EquipmentType) {
        if (type == Enum_EquipmentType.Attack) {
            return "atk";
        }
        else if (type == Enum_EquipmentType.Defense) {
            return "def";
        }
        else if (type == Enum_EquipmentType.Extra_1) {
            return "extraElement";
        }
    }

    public getEquipmentPlaceName(ownerType: Enum_OwnerSubject, place: EquipmentPlace) {
        if (ownerType == Enum_OwnerSubject.Plane) {
            switch (place) {
                case Enum_PlaneEquipmentPlace.SpecialFirearm:
                    return "特殊枪械";
                case Enum_PlaneEquipmentPlace.MainFirearm:
                    return "主枪械";
                case Enum_PlaneEquipmentPlace.SideFirearm:
                    return "侧边枪械";
                case Enum_PlaneEquipmentPlace.ReserveFirearm:
                    return "备用枪械";
                case Enum_PlaneEquipmentPlace.FrontWingArmor:
                    return "前翼护甲";
                case Enum_PlaneEquipmentPlace.BodyArmor:
                    return "机身护甲";
                case Enum_PlaneEquipmentPlace.RearWingArmor:
                    return "后翼护甲";
            }
        }
        else if (ownerType == Enum_OwnerSubject.Wingman) {
            switch (place) {
                case Enum_WingmanEquipmentPlace.BodyArmor:
                    return "机身护甲";
                case Enum_WingmanEquipmentPlace.MainFirearm:
                    return "主枪械";
            }
        }
        else if (ownerType == Enum_OwnerSubject.Engine) {
            switch (place) {
                case Enum_EngineEquipmentPlace.OverloadSystem:
                    return "过载系统";
                case Enum_EngineEquipmentPlace.DrivingSystem:
                    return "推进系统";
                case Enum_EngineEquipmentPlace.BodyArmor:
                    return "机身护甲";
            }
        }
        return "";
    }

    /**获取对象类型名称 */
    public getObjectTypeName(ownerType: Enum_OwnerSubject) {
        switch (ownerType) {
            case Enum_OwnerSubject.Plane:
                return "战机";
            case Enum_OwnerSubject.Wingman:
                return "僚机";
            case Enum_OwnerSubject.Engine:
                return "设备";

        }
    }

    /**获得技能数值描述模板 */
    public getPassiveSkillValueFormatStr() {
        let result: string = "<color=#14FF00>{0}</color><color=#00CCFF>{1}</color>";
        return result;
    }

    /**获得装备数值描述模板 */
    public getEquipmentValueFormatStr() {
        let result: string = "<color=#ffffff>{0}</c><color=#14FF00>{1}</color><color=#00CCFF>{2}</color>";
        return result;
    }

    /**获得装备数值描述模板 (没有绿色描述）*/
    public getEquipmentValueFormatStrWithoutGreen() {
        let result: string = "<color=#ffffff>{0}</c><color=#00CCFF>{2}</color>";
        return result;
    }

    public getPassiveSkillCfg(skillID: number) {
        let table = this.syncGetConfigByType(ConfigType.Table_Skill);
        if (table) {
            let skillCfg = table[skillID] as TBDATA_Skill;

            return skillCfg;
        }

    }

    public getPassiveSkillCount(ownerType: Enum_OwnerSubject) {
        return this.passiveSkillCount[ownerType];
    }

    /**获取装备部位配置 */
    public getEquipmentPlaceInf(ownerID: number, ownerType: Enum_OwnerSubject, place: EquipmentPlace) {
        let result: {
            equipmentType: Enum_EquipmentType, element: number[], mainValue: number,
            customEquipment: Readonly<TBDATA_CustomEquipment>
        }
            = {
            equipmentType: Enum_EquipmentType.Attack,
            element: [],
            mainValue: 0,
            customEquipment: undefined
        }

        if (ownerType == Enum_OwnerSubject.Plane) {
            const objectCfg: TBDATA_Plane = this.getPlaneCfgByID(ownerID) as TBDATA_Plane;
            const equipmentID: string = objectCfg[`equipment_${place}`]

            const table_CustomEquipment = this.syncGetConfigByType(ConfigType.Table_CustomEquipment);
            const customEquipment = table_CustomEquipment[equipmentID] as TBDATA_CustomEquipment;

            if (place > Enum_PlaneEquipmentPlace.ReserveFirearm) {
                result.equipmentType = Enum_EquipmentType.Defense;
                result.mainValue = customEquipment.hp;
                result.element = customEquipment.defense_element;
            }
            else {
                result.equipmentType = Enum_EquipmentType.Attack;
                result.mainValue = customEquipment.damage;
                result.element = customEquipment.attack_element;
            }

            result.customEquipment = customEquipment;
        }
        else if (ownerType == Enum_OwnerSubject.Wingman) {
            const objectCfg: TBDATA_Wingman = this.getWingmanCfgByID(ownerID) as TBDATA_Wingman;
            const equipmentID: string = objectCfg[`equipment_${place}`]

            const table_CustomEquipment = this.syncGetConfigByType(ConfigType.Table_CustomEquipment);
            const customEquipment = table_CustomEquipment[equipmentID] as TBDATA_CustomEquipment;

            if (place == Enum_WingmanEquipmentPlace.BodyArmor) {
                result.equipmentType = Enum_EquipmentType.Defense;
                result.mainValue = customEquipment.hp;
                result.element = customEquipment.defense_element;
            }
            else {
                result.equipmentType = Enum_EquipmentType.Attack;
                result.mainValue = customEquipment.damage;
                result.element = customEquipment.attack_element;
            }

            result.customEquipment = customEquipment;
        }
        else if (ownerType == Enum_OwnerSubject.Engine) {
            const objectCfg: TBDATA_Engine = this.getEngineCfgByID(ownerID) as TBDATA_Engine;
            const equipmentID: string = objectCfg[`equipment_${place}`]

            const table_CustomEquipment = this.syncGetConfigByType(ConfigType.Table_CustomEquipment);
            const customEquipment = table_CustomEquipment[equipmentID] as TBDATA_CustomEquipment;

            if (place == Enum_EngineEquipmentPlace.BodyArmor) {
                result.equipmentType = Enum_EquipmentType.Defense;
                result.mainValue = customEquipment ? customEquipment.hp : 0;
                result.element = customEquipment ? customEquipment.defense_element : [0, 0, 0, 0];
            }
            else if (place == Enum_EngineEquipmentPlace.OverloadSystem) {
                result.equipmentType = Enum_EquipmentType.Attack;
                result.mainValue = customEquipment ? customEquipment.damage : 0;
                result.element = customEquipment ? customEquipment.attack_element : [0, 0, 0, 0];
            }
            else {
                result.equipmentType = Enum_EquipmentType.Extra_1;
                result.mainValue = customEquipment ? customEquipment.extra_value : 0;
                result.element = customEquipment ? customEquipment.restore_element : [0, 0, 0, 0];
            }

            result.customEquipment = customEquipment;
        }

        return result;
    }

    /**获得对象全部部位类型 进攻和防御 */
    public getCommonPlaceType(ownerType: Enum_OwnerSubject) {
        let result: number[] = [];

        result.push(...this.getAttackPlaceType(ownerType));
        result.push(...this.getDefensePlaceType(ownerType));

        return result;
    }

    /**根据对象类型获取对应进攻类型 */
    public getAttackPlaceType(ownerType: Enum_OwnerSubject) {
        let result: number[] = [];

        switch (ownerType) {
            case Enum_OwnerSubject.Plane:
                result.push(Enum_PlaneEquipmentPlace.SpecialFirearm, Enum_PlaneEquipmentPlace.MainFirearm, Enum_PlaneEquipmentPlace.SideFirearm, Enum_PlaneEquipmentPlace.ReserveFirearm);
                break;
            case Enum_OwnerSubject.Wingman://因为僚机算两个，所以有两个主枪械
                result.push(Enum_WingmanEquipmentPlace.MainFirearm, Enum_WingmanEquipmentPlace.MainFirearm);
                break;
            case Enum_OwnerSubject.Engine:
                result.push(Enum_EngineEquipmentPlace.OverloadSystem, Enum_EngineEquipmentPlace.DrivingSystem);
                break;
        }

        return result;
    }

    /**根据对象类型获取对应防守类型 */
    public getDefensePlaceType(ownerType: Enum_OwnerSubject) {
        let result: number[] = [];

        switch (ownerType) {
            case Enum_OwnerSubject.Plane:
                result.push(Enum_PlaneEquipmentPlace.FrontWingArmor, Enum_PlaneEquipmentPlace.BodyArmor, Enum_PlaneEquipmentPlace.RearWingArmor);
                break;
            case Enum_OwnerSubject.Wingman://因为僚机算两个，所以有两个机身护甲
                result.push(Enum_WingmanEquipmentPlace.BodyArmor, Enum_WingmanEquipmentPlace.BodyArmor);
                break;
            case Enum_OwnerSubject.Engine:
                result.push(Enum_EngineEquipmentPlace.BodyArmor);
                break;
        }

        return result;
    }

    /**获得装备部位的类型 */
    public getEquipmentPlaceType(ownerType: Enum_OwnerSubject, place: number) {
        let equipmentType: number = Enum_EquipmentType.Attack;
        if (ownerType == Enum_OwnerSubject.Plane) {

            equipmentType = place > Enum_PlaneEquipmentPlace.ReserveFirearm ? Enum_EquipmentType.Defense : Enum_EquipmentType.Attack;
        }
        else if (ownerType == Enum_OwnerSubject.Wingman) {
            equipmentType = place == Enum_WingmanEquipmentPlace.BodyArmor ? Enum_EquipmentType.Defense : Enum_EquipmentType.Attack;
        }
        else if (ownerType == Enum_OwnerSubject.Engine) {
            if (place == Enum_EngineEquipmentPlace.BodyArmor) {
                equipmentType = Enum_EquipmentType.Defense;

            }
            else if (place == Enum_EngineEquipmentPlace.OverloadSystem) {
                equipmentType = Enum_EquipmentType.Attack;
            }
            else {
                equipmentType = Enum_EquipmentType.Extra_1;

            }
        }

        return equipmentType;
    }

    /**根据奖励id 获取对应奖励配置 */
    public getRewardCfgByID(id: number): Readonly<TBDATA_Reward> {
        if (!this.configDic[ConfigType.Table_Reward]) {
            return null;
        }

        return this.configDic[ConfigType.Table_Reward][id] as Readonly<TBDATA_Reward>;
    }

    /**根据任务id 获取对应任务配置 */
    public getTaskCfgByID(id: number): Readonly<TBDATA_Task> {
        if (!this.configDic[ConfigType.Table_Task]) {
            return null;
        }

        return this.configDic[ConfigType.Table_Task][id] as Readonly<TBDATA_Task>;
    }

    /**根据战斗技能id 获取对应战斗技能配置表 */
    public getFightingSkillCfgByID(id: number): Readonly<TBDATA_Fighting_Skill> {
        return this.configDic[ConfigType.Table_Fighting_Skill][id] as Readonly<TBDATA_Fighting_Skill>;

    }

    /**根据游戏模式获取游戏分包名 */
    public getGameModeAssetsBundleName(gameMode: Enum_GameMode) {
        switch (gameMode) {
            case Enum_GameMode.Assault:
                return Enum_AssetBundle.AssaultMode;
            case Enum_GameMode.Barrage:
                return Enum_AssetBundle.BarrageMode;
            case Enum_GameMode.Escort:
                return Enum_AssetBundle.EscortMode;
            case Enum_GameMode.Secret:
                return Enum_AssetBundle.SecretMode;
            case Enum_GameMode.Campaign:
                return Enum_AssetBundle.CampaignMode;
            case Enum_GameMode.TryOut:
                return Enum_AssetBundle.CampaignMode;
            default:
                return Enum_AssetBundle.CampaignMode;
        }
    }

    /**获取游戏模式难度配置 */
    public getGameModeConfig(gameMode: Enum_GameMode) {
        const assetBundleName: string = this.getGameModeAssetsBundleName(gameMode);

        return Util.Res.LoadAssetRes<cc.JsonAsset>(assetBundleName, `Config/Table_${assetBundleName}`);
    }

    /**获取当前游戏模式下有多少个难度 */
    public getDifficultyCntInGameMode(gameMode: Enum_GameMode) {
        return 12;
    }


    /**获得游戏特殊模式下的代币 */
    public getCurrencyTypeByGameMode(gameMode: Enum_GameMode) {
        let currency: Enum_Currency;

        switch (gameMode) {
            case Enum_GameMode.Assault:
                currency = Enum_Currency.RaidCoin;
                break;
            case Enum_GameMode.Barrage:
                currency = Enum_Currency.BombCoin;
                break;
            case Enum_GameMode.Escort:
                currency = Enum_Currency.GuardCoin;
                break;
            case Enum_GameMode.Secret:
                currency = Enum_Currency.SecretCoin;
                break;
        }

        return currency;
    }

    /**获得游戏模式的标题 */
    public getGameModeTitle(gameMode: Enum_GameMode) {
        switch (gameMode) {
            case Enum_GameMode.Assault:
                return "突袭";
            case Enum_GameMode.Barrage:
                return "轰炸";
            case Enum_GameMode.Escort:
                return "护卫";
            case Enum_GameMode.Secret:
                return "绝密";
        }
    }

    /**获取游戏模式的目标标题 */
    public getGameModeGoalTitle(gameMode: Enum_GameMode) {
        switch (gameMode) {
            case Enum_GameMode.Assault:
                return "潜水艇生命值";
            case Enum_GameMode.Barrage:
                return "摧毁的建筑";
            case Enum_GameMode.Escort:
                return "补给飞机的生命值";
            case Enum_GameMode.Secret:
                return "失窃情报";
        }
    }

    /**获取游戏模式的目标内容 */
    public getGameModeGoalContent(gameMode: Enum_GameMode) {
        switch (gameMode) {
            case Enum_GameMode.Assault:
                return "尽可能集中火力攻击敌方VIP潜水艇";
            case Enum_GameMode.Barrage:
                return "尽可能多地摧毁地方建筑";
            case Enum_GameMode.Escort:
                return "为补给飞机护航安全转移到我们的基地";
            case Enum_GameMode.Secret:
                return "避开地方雷达兵窃取他们的情报";
        }
    }

    /**根据持有者类型获得对应目录名称 */
    public getOwnerTypeDirName(ownerType: Enum_OwnerSubject) {
        let dir: string = "";
        if (ownerType == Enum_OwnerSubject.Plane) {
            dir = "Plane";
        }
        else if (ownerType == Enum_OwnerSubject.Wingman) {
            dir = "Wingman";
        }
        else if (ownerType == Enum_OwnerSubject.Engine) {
            dir = "Engine";
        }

        return dir;
    }

    /**装备最大等级 */
    public readonly equipment_max_lv: number = 55;
    /**根据当前装备的等级和星级数获得升级消耗 */
    public getUpgradeEquipmentCost(lv: number, stars: number) {
        let costType: Enum_Currency;
        let cost: number = 0;

        const curStepLv: number = lv - (stars - 1) * 5;

        if (lv >= 50 && stars >= 10) {//满星阶段
            costType = Enum_Currency.Mileage;
            cost = 500 + 125 * (lv % 5);
        }
        else if (lv > 0 && curStepLv == 5) {//当前需要加星
            costType = Enum_Currency.Diamond;
            cost = Math.floor(25 + 12.5 * stars);
        }
        else {
            costType = Enum_Currency.Spanner;
            let a1: number = 33;
            let tempStars: number = 1;
            while (tempStars < stars) {
                a1 = a1 + stars * 5;

                tempStars++;
            }

            cost = a1 + stars * (lv % 5);
        }

        return { costType: costType, cost: cost };

    }

    /**获得装备星级数上限 */
    public getEquipmentTotalStarsLimite(quality: Enum_EquipmentQuality) {
        if (quality == Enum_EquipmentQuality.Bronze) {
            return 6;
        }
        else if (quality == Enum_EquipmentQuality.Sliver) {
            return 8;

        }

        return 10;
    }

    /**获得装备品质对应的星星贴图名 */
    public getEquipmentQualityStar(quality: Enum_EquipmentQuality) {
        if (quality <= Enum_EquipmentQuality.Golden) {
            return "star_" + quality;
        }

        else if (quality < Enum_EquipmentQuality.RedVerdigris) {
            return "star_3";
        }

        return "star_4";
    }

    /**获得商店页类型 */
    public getShopPageClassification(idx: number) {
        let list: string[] = ["促销", "箱子", "模块", "装置", "货币"];

        return list[idx];
    }

    /*===================升级被动技能 ===================*/
    /**飞机升级被动技能动画名前缀 */
    public readonly plane_skeleton_animName_upgradeSkill_prefix: ReadonlyArray<string> = [
        "Fan", "Nose", "Side", "Top", "Wing"
    ]
    /**僚机升级被动技能动画名前缀 */
    public readonly wingman_skeleton_animName_upgradeSkill: ReadonlyArray<string> = [
        "Fan", "Nose", "Side", "Top", "Wing"
    ]
    /**引擎升级被动技能动画名前缀 */
    public readonly engine_skeleton_animName_upgradeSkill: ReadonlyArray<string> = [
        "Fan", "Nose", "Side", "Top", "Wing"
    ]

    /*===================升级被动技能 end===================*/


    /*===================突袭模式 ===================*/
    /**突袭模式 游戏时长 */
    public readonly gaming_time_in_assault: number = 3 * 60;


    /*===================突袭模式 end ===================*/

    /*===================轰炸模式 ===================*/
    /**轰炸模式 占领时长 */
    public readonly stay_time_in_barrage: number = 3;


    /*===================轰炸模式 end ===================*/

    /*===================护航模式 ===================*/
    /**护航模式 被护航的飞机预制体名 */
    public readonly Name_BeEscortPlane: string = "BeEscortPlane";


    /*===================护航模式 end ===================*/

    /*===================绝密模式 ===================*/
    /**绝密模式 触发探测到的时间 */
    public readonly detect_out_time: number = 2;

    /**绝密模式 扇形角度变化速度 */
    public readonly fan_angle_change_speed: number = 2.5;

    /**绝密模式 停留基地所需要的时间 */
    public readonly stay_secret_base_time: number = 1.5;

    /*===================绝密模式 end ===================*/


    /**百分百命中无视护甲进攻参数 */
    public readonly oneHundredPercentHitAndIgnoreArmorAttackElement: ReadonlyArray<number> = [100, 100, 0, 0];


    /*===================广告 ===================*/
    /**观看模块广告次数限制 */
    public readonly chipLimiteTimes: number = 50;
    /**观看货币广告次数限制 */
    public readonly currencyLimiteTimes: number = 50;
    /**观看箱子广告次数限制 */
    public readonly boxLimiteTimes: number = 10;
    /**观看货币广告/观看模块广告 的双倍奖励次数 */
    public readonly doubleAdRewardTimes: number = 3;

    /**获取观看模块广告次数限制 */
    public getADChipLimiteTimes() {
        let result: number = this.chipLimiteTimes;
        let onlineValue: string = SDKManager.GetOnlineValue(Enum_OnlineParam.ShopModLimit);
        if (onlineValue) {
            result = Number(onlineValue);
        }
        return result;
    }

    /**观看货币广告次数限制 */
    public getADCurrencyLimiteTimes() {
        let result: number = this.currencyLimiteTimes;
        let onlineValue: string = SDKManager.GetOnlineValue(Enum_OnlineParam.ShopDiaLimit);
        if (onlineValue) {
            result = Number(onlineValue);
        }
        return result;
    }

    /**广告钻石单次获取量随机范围 */
    public getADDiamondRange() {
        let onlineValue: string = SDKManager.GetOnlineValue(Enum_OnlineParam.ShopDiaReward);
        if (onlineValue) {
            let range: number[] = onlineValue.split(",").map((v) => Number(v));
            return range;
        }

        return [10, 20];
    }

    /**广告奖励的金币范围 */
    public getADGoldRange() {
        return [1500, 3000];
    }

    /**通过观看视频获取额外货币奖励的最大次数限制 */
    public getLimiteTimesWatchingAdToGetExtraCurrency() {
        return 5;
    }

    /**通过观看视频获取额外通用碎片奖励的最大次数限制 */
    public getLimiteTimesWatchingAdToGetExtraCommonChip() {
        return 5;
    }

    /*===================广告 end ===================*/

    /*===================模块商店 ===================*/
    public getModuleRefreshCostData(boardIdx: number) {
        let costCount: number[] = [100, 500, 2000];
        let costData: ICostData = {
            type: Enum_Currency.Mileage,
            cnt: costCount[boardIdx]
        }

        return costData;
    }

    /**
     * 获取板块刷新时间间隔 单位：秒
     * @param boardIdx 
     * @returns 
     */
    public getModuleRefreshInterval(boardIdx: number) {
        let h: number[] = [24, 72, 168];

        return h[boardIdx] * 60 * 60;

    }

    /**
     * 获取特殊商店板块刷新时间间隔 单位：秒
     * @param boardIdx 
     * @returns 
     */
    public getSpShopBoardRefreshInterval(boardIdx: number) {
        let h: number[] = [24, 72, 168];

        return h[boardIdx] * 60 * 60;

    }


    /**
     * 获取里程板块刷新时间间隔 单位：秒
     * @param boardIdx 
     * @returns 
     */
    public getMileageRefreshInterval(boardIdx: number) {
        let h: number[] = [24, 72, 168];

        return h[boardIdx] * 60 * 60;

    }
    /*===================模块商店end ===================*/

    /*===================特殊商店 ===================*/
    public getSpModeShopRefreshCostData(boardIdx: number, gameMode: Enum_GameMode) {
        let currencyType: Enum_Currency = this.getCurrencyTypeByGameMode(gameMode);

        let costCount: number[] = [100, 500, 2000];
        let costData: ICostData = {
            type: currencyType,
            cnt: costCount[boardIdx]
        }

        return costData;
    }
    /*===================特殊商店 ===================*/

    /**获取普通关卡游玩消耗 */
    public getNormalLevelPlayCost(difficulty: number) {
        let costData: ICostData = {
            type: Enum_Currency.Power,
            cnt: 0
        }

        let costList: number[] = [5, 6, 7];

        costData.cnt = costList[difficulty - 1] || 5;
        return costData;
    }

    /**
     * 获取复活消耗
     * @param rebornTimes 复活次数
     */
    public getRebornCost(rebornTimes: number) {
        let costCnt: number[] = [10, 20, 30];
        let costData: ICostData = {
            type: Enum_Currency.Diamond,
            cnt: costCnt[rebornTimes]
        }

        return costData;
    }

    /**获取难度系数 */
    public getDifficulyFactor(difficulty: Enum_Difficulty) {
        let f: number[] = [0, 1, 1.5, 2];
        return f[difficulty];
    }

    /**
     * 当完成特别活动开箱子要求时，根据箱子id ，去获取指定奖励个数
     * @param boxID 
     */
    public getSpecialActivityGoalRewardByBoxID(boxID: string) {
        let taskGoalTable = this.syncGetConfigByType(ConfigType.Table_Special_task_goal);

        for (const key in taskGoalTable) {
            if (Object.prototype.hasOwnProperty.call(taskGoalTable, key)) {
                const element = taskGoalTable[key] as TBDATA_Special_task_goal;

                if (element && element.goal && element.goal.match(boxID)) {//简单匹配
                    return element.reward_1;
                }
            }
        }

    }

    public getSpecialActivityRewardCfg(activityID: number) {
        let table = this.syncGetConfigByType(ConfigType.Table_SpecialActivity);
        let cfg = table[activityID] as TBDATA_SpecialActivity;
        let tableName = `Table_${cfg.reward}`;

        return this.syncGetConfigByType(tableName);
    }

    public getTechnicTitle(type: Enum_TechnicType) {
        switch (type) {
            case Enum_TechnicType.DamageUp:
                return "飞机伤害";
            case Enum_TechnicType.HpUp:
                return "生命值";
            case Enum_TechnicType.SkillCdDecrease:
                return "技能缩减";
            case Enum_TechnicType.LaunchSpeed:
                return "发射速度";
        }
    }

    public getMileageRefreshCostData(boardIdx: number) {
        let costCount: number[] = [100, 500, 2000];
        let costData: ICostData = {
            type: Enum_Currency.Mileage,
            cnt: costCount[boardIdx]
        }

        return costData;
    }

    /**
     * 获得对应套装的老虎机开奖概率和对应的key值
     * @param set 套装
     */
    public getSlotMachineRate(set: number) {
        let result: { key: string[], rate: number[] } = {
            key: [],
            rate: []
        }
        let table = this.syncGetConfigByType(ConfigType.Table_SlotMachine);
        let keys = Object.keys(table);
        let range: number[] = [];
        if (set == 1) {
            range[0] = 0;
            range[1] = 100;
        }
        else if (set == 2) {
            range[0] = 100;
            range[1] = 999;
        }
        else if (set == 3) {
            range[0] = 1000;
            range[1] = 2000;
        }

        for (let i = 0; i < keys.length; i++) {
            const element = Number(keys[i]);

            if (element > range[0] && element < range[1]) {
                result.key.push(keys[i]);
                result.rate.push(table[keys[i]].rate);

            }

        }

        return result;
    }

    /**获取能掉落活动代币的对象类型 */
    public getDropActivityCurrencyObjType() {
        let result: Enum_GameObject[] = [
            Enum_GameObject.Plane,
            Enum_GameObject.PlaneWithBuff,
            Enum_GameObject.Battery,
            Enum_GameObject.Missile,
            Enum_GameObject.DestroyableGameObject,
        ]

        return result;
    }

    /**获取活动代币掉落个数范围 */
    public getDropActivityCurrencyRange() {
        let result: number[] = [1, 1];
        return result;
    }
}
