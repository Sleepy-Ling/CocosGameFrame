class _PlayerData {
    public moveDirection: cc.Vec2;
    public attackInput: boolean;

    constructor() {
        this.moveDirection = new cc.Vec2(0, 0);
    }

}

export const PlayerData = new _PlayerData();
