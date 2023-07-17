
import { UIManager } from "./Core/UIManager";
import { GameData } from "./Data/GameData";
import { GAMEDATA_TICK_INTERVAL } from "./Def/ConstDef";
import { UIName } from "./Def/EnumDef";
import { CustomEvents } from "./Event/CustomEvents";
import { EventDispatcher } from "./Event/EventDispatcher";
import { CameraManager } from "./Manager/CameraManager";
import { ConfigManager } from "./Manager/ConfigManager";
import { GameDataManager } from "./Manager/GameDataManager";
import { PreLoadManager } from "./Manager/PreLoadManager";

import { SDKManager } from "./SDK/SDKManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Main extends cc.Component {
    private _RefreshTime: number = 0;

    onLoad() {
        // var manager = cc.director.getCollisionManager();
        // 默认碰撞检测系统是禁用的，如果需要使用则需要以下方法开启碰撞检测系统：
        // manager.enabled = true;
        // 默认碰撞检测系统的 debug 绘制是禁用的，如果需要使用则需要以下方法开启 debug 绘制：
        // manager.enabledDebugDraw = true;

        // cc.director.getPhysicsManager().enabled = true;
        // cc.director.getPhysicsManager().debugDrawFlags = cc.PhysicsManager.DrawBits.e_aabbBit;

    }

    start() {
        cc.game.setFrameRate(60);
        cc.game.on(cc.game.EVENT_SHOW, () => { EventDispatcher.Emit(CustomEvents.GameShowFromBackground) });
        cc.game.on(cc.game.EVENT_HIDE, () => { EventDispatcher.Emit(CustomEvents.GameHideInBackground) });

        this._run()
    }

    private async _run() {
        cc.game.addPersistRootNode(this.node);

        let time = new Date().getTime();
        GameDataManager.init(time);
        PreLoadManager.init();
        ConfigManager.init();

        await SDKManager.Init()
        await PreLoadManager.BeginLoad();


        let node = cc.find("MainCamera", this.node);
        CameraManager.init(node.getComponent(cc.Camera));

        // UIManager.OpenUI(UIName.BeginView);
    }


    update(t: number) {
        this._RefreshTime += t;
        if (this._RefreshTime > GAMEDATA_TICK_INTERVAL) {
            let date = new Date()
            let mTime = date.getTime();
            GameDataManager.update(mTime);

            this._RefreshTime = 0;
        }
    }


}

