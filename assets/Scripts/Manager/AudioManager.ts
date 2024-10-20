import { GM } from "../Core/Global/GM";
import { Util } from "../Core/Utils/Util";
import { AudioType, Enum_AssetBundle, Enum_UserSettingType } from "../Def/EnumDef";
import AudioManagerBase from "./AudioManagerBase";


export class AudioManager extends AudioManagerBase {
    /**播放中的音效记录 */
    protected playingEffectRecord: Record<string, Array<number>> = {};


    protected curBgm: string;

    public init(inf?: unknown): boolean {
        let v = GM.gameDataManager.getUserSetting(Enum_UserSettingType.BGM);
        this.setBGMVolume(v);
        v = GM.gameDataManager.getUserSetting(Enum_UserSettingType.SoundsEff);
        this.setEffectVolume(v);

        return true;
    }

    /**播放bgm */
    public async PlayBGM(name: AudioType | string, boolLoop = true) {
        if (name == AudioType.None || name == null) {
            return;
        }

        const audio = await Util.Res.LoadAssetRes<cc.AudioClip>(Enum_AssetBundle.Audio, name);
        cc.audioEngine.playMusic(audio, boolLoop);

        this.curBgm = name;
    }

    /**播放音效 */
    public async PlayEffect(name: AudioType | string, loop: boolean = false): Promise<any> {
        if (name == AudioType.None || name == null) {
            return;
        }

        // console.log("PlayEffect", name);

        const audio = await Util.Res.LoadAssetRes<cc.AudioClip>(Enum_AssetBundle.Audio, name);

        let v = GM.gameDataManager.getUserSetting(Enum_UserSettingType.SoundsEff);
        let effectID: number = cc.audioEngine.play(audio, loop, v);

        if (this.playingEffectRecord[name] == null) {
            this.playingEffectRecord[name] = [];
        }
        this.playingEffectRecord[name].push(effectID);
    }

    public PauseBGM(): boolean {
        cc.audioEngine.pauseMusic();
        return true;
    }

    public ResumeBGM(): boolean {
        cc.audioEngine.resumeMusic();
        return true;
    }

    public StopBGM(): boolean {
        cc.audioEngine.stopMusic();
        return true;
    }

    public StopEffect(id: number): boolean {
        cc.audioEngine.stopEffect(id);
        return true;
    }

    public StopEffectByAudioType(name: AudioType): boolean {
        if (this.playingEffectRecord[name]) {
            this.playingEffectRecord[name].forEach((id) => {
                this.StopEffect(id);

                this.playingEffectRecord[name] = [];
            })

            return true;
        }


        return false;
    }

    public setBGMVolume(v: number) {
        cc.audioEngine.setMusicVolume(v);

    }
    public setEffectVolume(v: number) {
        cc.audioEngine.setEffectsVolume(v);
    }

}