import { Util } from "../Core/Util";

abstract class SaveData {
    abstract name: string
    GetData() {
        let data = Util.Save.GetData(this.name)
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                this[key] = data[key]
            }
        }
    }

    SaveData() {
        Util.Save.SaveData(this.name, this)
    }
}

class UserData extends SaveData {
    name: string = "user"
    userName: string = ""
    uuid: string = Util.getUUid()
    /**上次登陆的日期 0点  时间戳 单位：毫秒*/
    lastLoginMTime: number = 0;
    /**上次在线时间戳 单位：毫秒 */
    lastOnlineMTime: number;
}

class SettingData extends SaveData {
    name: string = "setting"
    sound: number = 1
    vibration: number = 1
    effect: number = 1
    buttonPosition: boolean = true;
    constructor() {
        super();
        cc.audioEngine.setMusicVolume(this.sound ? 1 : 0)
        cc.audioEngine.setEffectsVolume(this.effect ? 1 : 0)
    }

    SaveData(): void {
        super.SaveData();
        cc.audioEngine.setMusicVolume(this.sound ? 1 : 0)
        cc.audioEngine.setEffectsVolume(this.effect ? 1 : 0)
    }
}

class _GameData {
    UserData: UserData = new UserData()
    SettingData: SettingData = new SettingData()

    NowTime: number;

    /**当天 日期 */
    private localDate: string;
    /**当天 0点时间戳 单位：毫秒*/
    private localDateZeroMillionSeconds: number;
    constructor() {
        this.UserData.GetData()
        this.SettingData.GetData()
    }

    /**
     * 登陆时初始化
     * @param mTime 登陆时的时间戳
     */
    initOnLogin(mTime: number) {
        console.log(this.UserData);

        //更新当天的数据
        this.localDate = new Date().toLocaleDateString();
        this.localDateZeroMillionSeconds = new Date(this.localDate).getTime();
        console.log("now zero", this.localDateZeroMillionSeconds);
        this.UserData.lastLoginMTime = this.localDateZeroMillionSeconds;

    }

}

export const GameData = new _GameData()