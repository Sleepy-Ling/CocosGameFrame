import IRecoverObject from "../Core/GameObjects/IRecoverObject";

const { ccclass, property } = cc._decorator;

export class PopUpItemBaseParam {
    closeCallBack: Function;
}

@ccclass
export default class PopUpItemBase extends cc.Component implements IRecoverObject {
    @property(cc.Label)
    label: cc.Label = null;

    param: PopUpItemBaseParam;

    public show(str: string, duration: number, param: PopUpItemBaseParam) {
        this.label.string = str;
        this.param = param;

        this.scheduleOnce(() => { this.onShowEnd(param.closeCallBack); }, duration);
        this.onShowStart(param);
    }

    public onShowStart(param: PopUpItemBaseParam) {
        this.node.scale = 0;
        let t = cc.tween(this.node);
        t.to(0.1, { scale: 1 });

        t.start();
    }

    public onShowEnd(endCallBack: Function) {
        let t = cc.tween(this.node);
        t.to(0.1, { scale: 0 }).call(() => {
            if (endCallBack) {
                endCallBack();
            }
        });

        t.start();
    }

    public close() {
        this.unscheduleAllCallbacks();

    }

    onRecover(): boolean {
        this.unscheduleAllCallbacks();

        this.node.setParent(null);

        return true;
    }


}
