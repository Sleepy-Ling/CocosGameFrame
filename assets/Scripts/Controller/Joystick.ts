import { PlayerData } from "../data/PlayerData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Joystick extends cc.Component {

    @property(cc.Node)
    protected joystick: cc.Node = null;

    @property(cc.Node)
    protected joystickBg: cc.Node = null;

    @property(cc.Integer)
    /**移动半径 */
    protected moveRidius: number = 10;

    /**移动摇杆参考起始点（通常为（0,0） */
    protected startMovePosition: cc.Vec2 = new cc.Vec2(0, 0);

    start() {
        if (this.joystick == null) {
            this.joystick = this.node.getChildByName("joystick");
        }

        if (this.moveRidius == 0) {
            this.moveRidius = this.joystickBg.width / 2;
        }

        this._addEvent();
    }

    private _addEvent() {
        this.joystickBg.on(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.joystickBg.on(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.joystickBg.on(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.joystickBg.on(cc.Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
    }

    private _removeEvent() {
        this.joystickBg.off(cc.Node.EventType.TOUCH_START, this._onTouchStart, this);
        this.joystickBg.off(cc.Node.EventType.TOUCH_MOVE, this._onTouchMove, this);
        this.joystickBg.off(cc.Node.EventType.TOUCH_END, this._onTouchEnd, this);
        this.joystickBg.off(cc.Node.EventType.TOUCH_CANCEL, this._onTouchEnd, this);
    }

    private _onTouchStart(e: cc.Event.EventTouch) {
        let touchPos = e.getLocation();

        let localTouchPos = this.joystickBg.convertToNodeSpaceAR(touchPos);
        this.joystick.setPosition(localTouchPos);

        let moveDir = localTouchPos.sub(this.startMovePosition).normalizeSelf();
        PlayerData.moveDirection = moveDir;
    }

    private _onTouchMove(e: cc.Event.EventTouch) {
        let touchPos = e.getLocation();
        let localTouchPos = this.joystickBg.convertToNodeSpaceAR(touchPos);
        let moveDir = localTouchPos.sub(this.startMovePosition).normalizeSelf();

        let distance = localTouchPos.sub(this.startMovePosition).len();
        if (distance < this.moveRidius) {
            this.joystick.setPosition(localTouchPos);
        }
        else {
            let nextPos = this.startMovePosition.add(moveDir.mul(this.moveRidius));
            this.joystick.setPosition(nextPos);
        }

        PlayerData.moveDirection = moveDir;
    }

    private _onTouchEnd(e: cc.Event.EventTouch) {
        this.joystick.setPosition(this.startMovePosition);

        PlayerData.moveDirection.x = PlayerData.moveDirection.y = 0;
    }

    onDestroy() {
        this._removeEvent();
    }
}
