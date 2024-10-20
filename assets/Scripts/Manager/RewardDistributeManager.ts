// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { ReceiveRewardViewParam } from "../../AssetsBundles/PopUpView/Scripts/ReceiveRewardView";
import { CalcUtil } from "../Core/Utils/CalcUtil";
import { GM } from "../Core/Global/GM";
import { StringUtil } from "../Core/Utils/StringUtil";
import { ConfigType, Enum_AssetBundle, Enum_Layer, Enum_PropAllocateType, Enum_RewardItemType, UIName } from "../Def/EnumDef";
import { RewardBase, RewardData, RewardDisplayData } from "../Def/StructDef";
import { Item_RewardInitParam } from "../Module/UI_Item/Item_Reward";
import ManagerBase from "./ManagerBase";
import { BoxOpenViewParam } from "../../AssetsBundles/Shop/Scripts/View/BoxOpenView";
import { TBDATA_ShopBox } from "../TableData/TBDATA_ShopBox";

export class RewardDistributeManager extends ManagerBase {

    /**开始派奖 */
    startDistributeReward(rewardStr: string, otherData?: any, callback?: Function) {
        const rewardStr_list: string[] = StringUtil.splitRewardListStr(rewardStr); //rewardStr.split(",");
        let rewardList: RewardBase[] = [];
        const rewardData_list: RewardData[] = [];
        if (!rewardStr_list) {
            console.error("distribute reward error ！！");

            return;
        }

        for (let index = 0; index < rewardStr_list.length; index++) {
            const element = rewardStr_list[index];

            let curReward: RewardData = StringUtil.convertStringToRewardData(element, otherData);
            let rewardInf = CalcUtil.calcReward(curReward);
            rewardData_list.push(curReward);

            for (let i = 0; i < rewardInf.length; i++) {
                const rewardParam: RewardBase = rewardInf[i];
                rewardList.push(rewardParam);
            }

        }

        let rewardDisplayData: RewardDisplayData[] = GM.gameDataManager.takeAllReward(rewardList);
        const reward_list: Item_RewardInitParam[] = [];

        for (let i = 0; i < rewardList.length; i++) {
            const element = rewardList[i];

            let item: Item_RewardInitParam = {
                rewardIcon: rewardDisplayData[i].icon,
                rewardID: element.rewardID,
                count: element.count,
                ownerType: element.ownerType,
                isChip: element.isChip,
                rewardItemType: element.rewardItemType,
                otherData: element.otherData,
                secondaryID: element.secondaryID,
            }

            reward_list.push(item);
        }

        //显示完奖励汇总后，如果当前有箱子奖励，则触发开箱子
        /**箱子奖励参数 */
        let boxRewardData: { reward: RewardData[], boxType: number, id: string }[] = [];

        let boxTable = GM.configManager.syncGetConfigByType(ConfigType.Table_ShopBox);

        for (let index = 0; index < rewardData_list.length; index++) {
            let curReward: RewardData = rewardData_list[index];
            let rewardInf = CalcUtil.calcReward(curReward);
            for (let i = 0; i < rewardInf.length; i++) {
                if (rewardInf[i].rewardItemType == Enum_RewardItemType.Box) {
                    let boxID: string = `box${rewardInf[i].rewardID}`;
                    const boxCfg = boxTable[boxID] as TBDATA_ShopBox;

                    let dataList = StringUtil.splitRewardListStr(boxCfg.reward_list);

                    let tempTime = 0;
                    while (rewardInf[i].count > tempTime) {
                        let rewardData: RewardData[] = [];
                        for (const str of dataList) {
                            let d = StringUtil.convertStringToRewardData(str);
                            rewardData.push(d);
                        }

                        let d: { reward: RewardData[], boxType: number, id: string } = {
                            reward: rewardData,
                            boxType: boxCfg.quality,
                            id: boxID,
                        }

                        boxRewardData.push(d);
                        tempTime++;
                    }
                }
            }
        }

        let openBoxCall = (index: number, afterOpenAllBoxCall: Function) => {
            if (index >= boxRewardData.length) {
                if (afterOpenAllBoxCall) {
                    afterOpenAllBoxCall();
                }

                return;
            }

            const boxOpenViewParam: BoxOpenViewParam = {
                reward: boxRewardData[index].reward,
                closeCallBack: openBoxCall.bind(this, index + 1, afterOpenAllBoxCall),
                openCallBack: undefined,
                boxType: boxRewardData[index].boxType,
                boxID: boxRewardData[index].id,
            }

            GM.uiManager.OpenUI(UIName.BoxOpenView, boxOpenViewParam, Enum_AssetBundle.Shop);
        }


        const receiveRewardParam: ReceiveRewardViewParam = {
            rewardList: reward_list,
            closeCallBack: openBoxCall.bind(this, 0, callback),
            openCallBack: undefined
        }

        GM.uiManager.OpenUI(UIName.ReceiveRewardView, receiveRewardParam, Enum_AssetBundle.PopUpView, Enum_Layer.Pop);
    }

    /**开始派奖 */
    startDistributeReward2(rewardID: string, rewardCount: number, otherData?: any, callback?: Function) {
        let rewardStr: string = `${rewardID}_0_[${rewardCount}]`;
        this.startDistributeReward(rewardStr, otherData, callback);
    }

    /**派奖，但是不显示弹窗 */
    startDistributeRewardWithNoPop(rewardStr: string, otherData?: any) {
        const rewardStr_list: string[] = StringUtil.splitRewardListStr(rewardStr);
        let rewardList: RewardBase[] = [];
        const rewardData_list: RewardData[] = [];

        for (let index = 0; index < rewardStr_list.length; index++) {
            const element = rewardStr_list[index];


            let curReward: RewardData = StringUtil.convertStringToRewardData(element, otherData);
            let rewardInf = CalcUtil.calcReward(curReward);
            rewardData_list.push(curReward);

            for (let i = 0; i < rewardInf.length; i++) {
                const rewardParam: RewardBase = rewardInf[i];
                rewardList.push(rewardParam);
            }

        }

        let rewardDisplayData: RewardDisplayData[] = GM.gameDataManager.takeAllReward(rewardList);

        return { rewardList: rewardList, rewardDisplayData: rewardDisplayData };
    }
}
