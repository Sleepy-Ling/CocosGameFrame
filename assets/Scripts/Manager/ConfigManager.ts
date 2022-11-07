import { ConfigType } from "../Def/EnumDef";
import ManagerBase from "./ManagerBase";

const { ccclass, property } = cc._decorator;

@ccclass
class _ConfigManager extends ManagerBase {
    configDic: { [key: string]: object } = {}
    ParseData(type: ConfigType, json: any) {
        this.configDic[type] = json;
    }

}

/**
 * 配置管理者
 * @description 读取配置专用
 */
export const ConfigManager = new _ConfigManager();
