import { GM } from "../Core/Global/GM";
import { Util } from "../Core/Utils/Util";
import { VIEW_DIR } from "../Def/ConstDef";
import { Enum_AssetBundle, ConfigType, UIName, Enum_Layer, Enum_EventType } from "../Def/EnumDef";
import { CustomEvents } from "../Event/CustomEvents";
import ConfigManager from "./ConfigManager";
import ManagerBase from "./ManagerBase";
import UIManager from "./UIManager";

/**预加载管理者 */
export default class PreLoadManager extends ManagerBase {
    private _loadTotal: number = 0;
    private _curLoadCount: number = 0;

    public get curLoadCount(): number {
        return this._curLoadCount
    }
    public set curLoadCount(num: number) {
        this._curLoadCount = num

    }

    private _PreloadBundle: Enum_AssetBundle[] = [
        Enum_AssetBundle.Font,
    ]

    private _preloadView: Array<{ bundle: Enum_AssetBundle, viewName: UIName }> = [
 
    ]

    init(...inf: unknown[]): boolean {
        this._curLoadCount = 0;

        this.curLoadCount += this._preloadView.length;

        return super.init(inf);
    }

    async BeginLoad(): Promise<void> {
        await GM.uiManager.OpenUI(UIName.LoadingView, null, null, Enum_Layer.Loading);

        const uiEventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.UI);

        let promiseList: Promise<any>[] = [];
        this.curLoadCount = 0;
        this._loadTotal = 0;

        let assetNameList: Array<{ bundle: string, name: string }> = [];
        for (let i = 0; i < this._PreloadBundle.length; i++) {
            const element = this._PreloadBundle[i];
            let p = Util.Res.LoadAssetBundle(element).then((bundle) => {
                console.log("finish loading bundle", bundle.name);

                const assetInf = bundle["_config"]["paths"]["_map"];

                for (const key in assetInf) {
                    assetNameList.push({ bundle: element, name: key });
                }
            });
            promiseList.push(p);
        }

        await Promise.all(promiseList);

        promiseList = [];


        this._loadTotal += assetNameList.length;

        for (const obj of assetNameList) {
            let pp = Util.Res.LoadAssetRes(obj.bundle, obj.name);
            pp.then((assert) => {
                this.curLoadCount++;
                uiEventDispatcher.Emit(CustomEvents.LoadingProgress, this.curLoadCount / this._loadTotal);

                if (obj.bundle == Enum_AssetBundle.Config) {
                    GM.configManager.ParseData(obj.name, (assert as cc.JsonAsset).json);
                }
            })
            promiseList.push(pp);
        }


        for (const inf of this._preloadView) {
            let path: string = `${VIEW_DIR}/${UIName[inf.viewName]}`;

            let pp = Util.Res.LoadAssetRes(inf.bundle, path);
            pp.then((assert) => {
                this.curLoadCount++;
                uiEventDispatcher.Emit(CustomEvents.LoadingProgress, this.curLoadCount / this._loadTotal);
            })
            promiseList.push(pp);

        }

        await Promise.all(promiseList);

        return Promise.resolve();
    }

  
}
