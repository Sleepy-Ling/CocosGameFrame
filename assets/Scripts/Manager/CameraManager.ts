// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import ManagerBase from "./ManagerBase";


export default class CameraManager extends ManagerBase {
    protected mainCamera: cc.Camera;
    protected gameCamera: cc.Camera;

    init(mainCamera: cc.Camera, gamingCamera?: cc.Camera) {
        this.mainCamera = mainCamera;
        this.gameCamera = gamingCamera;

        return super.init();
    }

    public setMainCameraLookAtPos2DInSingleParam(x?: number, y?: number, z?: number) {
        // let localPos = this.mainCamera.node.getPosition();
        // x = x || localPos.x;
        // y = y || localPos.y;

        this.mainCamera.node.setPosition(x, y);
    }

    public getMainCameraLocalPosition() {
        let localPos = this.mainCamera.node.getPosition();

        return localPos;
    }
    
    public getMainCamera() {
        return this.mainCamera;
    }

    public getGameCamera() {
        return this.gameCamera;
    }

}