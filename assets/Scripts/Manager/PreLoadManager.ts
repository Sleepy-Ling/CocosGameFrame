import { UIManager } from "../Core/UIManager";
import { Util } from "../Core/Util";
import { GameData } from "../Data/GameData";
import { Enum_AssetBundle, AudioType, ConfigType, EffectType, UIName } from "../Def/EnumDef";
import { CustomEvents } from "../Event/CustomEvents";
import { EventDispatcher } from "../Event/EventDispatcher";
import { AudioManager } from "./AudioManager";
import { ConfigManager } from "./ConfigManager";
import ManagerBase from "./ManagerBase";

/**预加载管理者 */
class _PreLoadManager extends ManagerBase {
    private _loadTotal: number = 0;
    private _curLoadCount: number = 0;

    private _PreLoadEffect: EffectType[] = []
    /**模型 */
    private _PreLoadModel: string[] = [
    ]

    /**ui */
    private _PreLoadUI: UIName[] = [
    ]

    /**音效 */
    private _PreLoadAudio: AudioType[] = [
    ];
    _PreLoadTerrain: any;
    _PreLoadBackGround: any;

    public get curLoadCount(): number {
        return this._curLoadCount
    }
    public set curLoadCount(num: number) {
        this._curLoadCount = num

    }

    init(...inf: unknown[]): boolean {
        this._curLoadCount = 0;

        return super.init(inf);
    }
    
    async BeginLoad(): Promise<void> {
        await UIManager.OpenUI(UIName.LoadingView);
        console.log("BeginLoad")
        let AllConfigType = Object.keys(ConfigType)
        this._loadTotal = AllConfigType.length + this._PreLoadEffect.length
            + this._PreLoadModel.length + this._PreLoadUI.length +
            this._PreLoadAudio.length + this._PreLoadTerrain.length + this._PreLoadBackGround.length;

        this.curLoadCount = 0;

        console.time("total");

        console.time();
        for (let x = 0; x < AllConfigType.length; x++) {
            let res = await Util.Res.LoadAssetRes<cc.JsonAsset>(Enum_AssetBundle.config, ConfigType[AllConfigType[x]]);
            ConfigManager.ParseData(ConfigType[AllConfigType[x]], res.json)
            this.curLoadCount++;
            EventDispatcher.Emit(CustomEvents.LoadingProgress, this.curLoadCount / this._loadTotal);
        }
        console.timeEnd();
        console.log("Config PreLoad Complete")

        console.time();
        for (let x = 0; x < this._PreLoadEffect.length; x++) {
            await Util.Res.LoadAssetRes<cc.Prefab>(Enum_AssetBundle.effect, this._PreLoadEffect[x]);
            this.curLoadCount++;
            EventDispatcher.Emit(CustomEvents.LoadingProgress, this.curLoadCount / this._loadTotal);
        }
        console.timeEnd();
        console.log("Effect PreLoad Complete")

        console.time();
        for (let x = 0; x < this._PreLoadModel.length; x++) {
            await Util.Res.LoadAssetRes<cc.Prefab>(Enum_AssetBundle.prefab, this._PreLoadModel[x]);
            this.curLoadCount++;
            EventDispatcher.Emit(CustomEvents.LoadingProgress, this.curLoadCount / this._loadTotal);
        }
        console.timeEnd();
        console.log("Model PreLoad Complete")

        console.time();
        for (let x = 0; x < this._PreLoadUI.length; x++) {
            await Util.Res.LoadAssetRes<cc.Prefab>(Enum_AssetBundle.ui, UIName[this._PreLoadUI[x]]);
            this.curLoadCount++;
            EventDispatcher.Emit(CustomEvents.LoadingProgress, this.curLoadCount / this._loadTotal);
        }
        console.timeEnd();
        console.log("UI PreLoad Complete")

        console.time();
        for (let x = 0; x < this._PreLoadAudio.length; x++) {
            await Util.Res.LoadAssetRes<cc.AudioClip>(Enum_AssetBundle.audio, this._PreLoadAudio[x]);
            this.curLoadCount++;
            EventDispatcher.Emit(CustomEvents.LoadingProgress, this.curLoadCount / this._loadTotal);
        }
        console.timeEnd();
        console.log("Audio PreLoad Complete")

        console.timeEnd("total");

        UIManager.CloseUIByName(UIName.LoadingView);

        return Promise.resolve();
    }

}

export const PreLoadManager = new _PreLoadManager()
