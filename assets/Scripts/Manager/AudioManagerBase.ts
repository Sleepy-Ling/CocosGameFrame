// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { Util } from "../Core/Utils/Util";
import { AudioType, Enum_AssetBundle } from "../Def/EnumDef";
import ManagerBase from "./ManagerBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default abstract class AudioManagerBase extends ManagerBase {

    /**播放bgm */
    public abstract PlayBGM(name: AudioType | string, loop: boolean): Promise<any>;

    /**播放音效 */
    public abstract PlayEffect(name: AudioType | string, loop: boolean): Promise<any>;
    /**暂停bgm */
    public abstract PauseBGM(): boolean;
    /**恢复bgm */
    public abstract ResumeBGM(): boolean;
    /**停止播放bgm */
    public abstract StopBGM(): boolean;

    /**根据id 停止播放的音效  */
    public abstract StopEffect(id: number): boolean;

    /**根据音效名 停止播放的音效  */
    public abstract StopEffectByAudioType(name: AudioType): boolean;

    /**设置背景音乐大小 */
    public abstract setBGMVolume(v: number);
    /**设置音效大小 */
    public abstract setEffectVolume(v: number);
}
