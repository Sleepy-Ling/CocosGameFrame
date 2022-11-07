// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import ManagerBase from "./ManagerBase";


class _CameraManager extends ManagerBase {
    protected mainCamera: cc.Camera;
    protected scaleCamera: cc.Camera;

    init(mainCamera: cc.Camera, scaleCamera?: cc.Camera) {
        this.mainCamera = mainCamera;
        this.scaleCamera = scaleCamera;

        return super.init();
    }

    focusOn(pos: cc.Vec2, rate: number, duration: number = 1) {
        pos = this.scaleCamera.node.parent.convertToNodeSpaceAR(pos);

        let nowPos = this.mainCamera.node.getPosition();
        this.scaleCamera.node.setPosition(nowPos);
        this.scaleCamera.zoomRatio = this.mainCamera.zoomRatio;

        cc.Tween.stopAllByTarget(this.scaleCamera);
        cc.Tween.stopAllByTarget(this.scaleCamera.node);


        cc.tween(this.scaleCamera).to(duration, { zoomRatio: rate }).start();
        cc.tween(this.scaleCamera.node).to(duration, { x: pos.x, y: pos.y }, { easing: "backOut" }).start();


        this.scaleCamera.node.setPosition(pos);
        this.scaleCamera.zoomRatio = rate;

        this.mainCamera.enabled = false;
        this.scaleCamera.enabled = true;

    }

    public reset() {
        this.mainCamera.enabled = true;
        this.scaleCamera.enabled = false;
    }
}

export const CameraManager = new _CameraManager();
