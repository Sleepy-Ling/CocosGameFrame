const { ccclass, property } = cc._decorator;

@ccclass
export default class PopUpItemBase extends cc.Component {
    @property(cc.Label)
    label: cc.Label = null;

    public show(str: string, duration: number, closeCallBack?: Function) {
        this.label.string = str;
        this.scheduleOnce(() => { this.onShowEnd(closeCallBack); }, duration);
        this.onShowStart();
    }

    public onShowStart() {
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

    public recover() {
        this.unscheduleAllCallbacks();

    }

}
