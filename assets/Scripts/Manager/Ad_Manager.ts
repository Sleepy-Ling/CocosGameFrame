import { Ad_DoubleRewardViewParam } from "../../AssetsBundles/PopUpView/Scripts/Ad_DoubleRewardView";
import { GM } from "../Core/Global/GM";
import { MathUtil } from "../Core/Utils/MathUtil";
import { Enum_Currency, UIName, Enum_AssetBundle, Enum_Layer, ConfigType } from "../Def/EnumDef";
import { TBDATA_Ad_ExtraCurrency } from "../TableData/TBDATA_Ad_ExtraCurrency";
import ManagerBase from "./ManagerBase";

/**广告相关的管理器 */
export default class Ad_Manager extends ManagerBase {
    private _addCurrencyCfg: Record<Enum_Currency, number> = {
        [Enum_Currency.Gold]: 6000,
        [Enum_Currency.Diamond]: 20,
        [Enum_Currency.Spanner]: 500,
        [Enum_Currency.Mileage]: 0,
        [Enum_Currency.DrawCoin_1]: 0,
        [Enum_Currency.DrawCoin_2]: 0,
        [Enum_Currency.DrawCoin_3]: 0,
        [Enum_Currency.BombCoin]: 0,
        [Enum_Currency.GuardCoin]: 0,
        [Enum_Currency.SecretCoin]: 0,
        [Enum_Currency.RaidCoin]: 0,
        [Enum_Currency.Honor]: 0,
        [Enum_Currency.Power]: 0,
        [Enum_Currency.TaskRewardPoint]: 0
    }

    private _addCommonChipCfg: Record<number, number> = {
        [GM.configManager.common_plane_chip_id]: 50,
        [GM.configManager.common_wingman_chip_id]: 50,
        [GM.configManager.common_engine_chip_id]: 50
    }
    /**
     * 弹出货币补充弹窗
     * @param currency 补充的货币类型
     * @returns true：弹出成功 false：不满足条件或者观看次数超出上限
     */
    public popupExtraCurrency(currency: Enum_Currency, takeCallback?: Function) {
        const table = GM.configManager.syncGetConfigByType(ConfigType.Table_Ad_ExtraCurrency)

        if (table[currency]) {
            let cfg: TBDATA_Ad_ExtraCurrency = table[currency];

            let limiteTimes: number = GM.configManager.getLimiteTimesWatchingAdToGetExtraCurrency();
            let nowWatchAdTimes: number = GM.gameDataManager.getExtraCurrencyAdTimes(currency);

            const totalWatchAdTimes: number = GM.gameDataManager.getTotalCurrencyAdTimes(currency);

            let add = cfg.init_count + cfg.increase_count * totalWatchAdTimes;
            add = MathUtil.clamp(add, 0, cfg.max_count);

            let watchAdLeftTimes: number = Math.max(0, limiteTimes - nowWatchAdTimes);

            if (watchAdLeftTimes > 0) {
                let param: Ad_DoubleRewardViewParam = {
                    id: currency,
                    count: add,
                    watchAdLeftTimes: watchAdLeftTimes,
                    closeCallBack: undefined,
                    openCallBack: undefined,
                    takeCallback: takeCallback
                }

                GM.uiManager.OpenUI(UIName.Ad_DoubleRewardView, param, Enum_AssetBundle.PopUpView, Enum_Layer.Pop);

                return true;
            }

            return false;
        }

        return false;
    }

    /**
    * 弹出额外碎片补充弹窗
    * @param id 通用碎片id
    * @returns true：弹出成功 false：不满足条件或者观看次数超出上限
    */
    public popupExtraCommonChip(id: number, takeCallback?: Function) {
        const table = GM.configManager.syncGetConfigByType(ConfigType.Table_Ad_ExtraCurrency)

        if (table[id]) {
            let cfg: TBDATA_Ad_ExtraCurrency = table[id];

            let limiteTimes: number = GM.configManager.getLimiteTimesWatchingAdToGetExtraCommonChip();
            let nowWatchAdTimes: number = GM.gameDataManager.getExtraCommonChipAdTimes(id);

            const totalWatchAdTimes: number = GM.gameDataManager.getTotalCommonChipAdTimes(id);

            let add = cfg.init_count + cfg.increase_count * totalWatchAdTimes;
            add = MathUtil.clamp(add, 0, cfg.max_count);

            let watchAdLeftTimes: number = Math.max(0, limiteTimes - nowWatchAdTimes);

            if (watchAdLeftTimes > 0) {
                let param: Ad_DoubleRewardViewParam = {
                    id: id,
                    count: add,
                    watchAdLeftTimes: watchAdLeftTimes,
                    closeCallBack: undefined,
                    openCallBack: undefined,
                    takeCallback: takeCallback
                }

                GM.uiManager.OpenUI(UIName.Ad_CommonChipView, param, Enum_AssetBundle.PopUpView, Enum_Layer.Pop);

                return true;


            }

            return false;

        }

        return false;

    }

    /**是否能通过广告获取额外的货币 */
    public canGetAdExtraCurrency(currency: Enum_Currency) {
        let limiteTimes: number = GM.configManager.getLimiteTimesWatchingAdToGetExtraCurrency();
        let nowWatchAdTimes: number = GM.gameDataManager.getExtraCurrencyAdTimes(currency);

        let watchAdLeftTimes: number = Math.max(0, limiteTimes - nowWatchAdTimes);

        return watchAdLeftTimes > 0;
    }

    /**是否能通过广告获取额外的通用碎片 */
    public canGetAdExtraCommonChip(id: number) {
        let limiteTimes: number = GM.configManager.getLimiteTimesWatchingAdToGetExtraCommonChip();
        let nowWatchAdTimes: number = GM.gameDataManager.getExtraCommonChipAdTimes(id);

        let watchAdLeftTimes: number = Math.max(0, limiteTimes - nowWatchAdTimes);

        return watchAdLeftTimes > 0;
    }

}
