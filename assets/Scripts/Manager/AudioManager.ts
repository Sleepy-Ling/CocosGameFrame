import { Util } from "../Core/Util";
import { AudioType, Enum_AssetBundle } from "../Def/EnumDef";
import ManagerBase from "./ManagerBase";

class _AudioManager extends ManagerBase {
    public async PlayBGM(name: AudioType, boolLoop = true) {
        if (name == AudioType.None) { return }
        const audio = await Util.Res.LoadAssetRes<cc.AudioClip>(Enum_AssetBundle.audio, name)
        cc.audioEngine.playMusic(audio, boolLoop)
    }

    public async PlayEffect(name: AudioType, loop: boolean = false): Promise<number> {
        if (name == AudioType.None) { return }
        const audio = await Util.Res.LoadAssetRes<cc.AudioClip>(Enum_AssetBundle.audio, name)
        return cc.audioEngine.playEffect(audio, loop)
    }

    public StopBGM() {
        cc.audioEngine.stopMusic()
    }

    public StopEffect(id: number) {
        cc.audioEngine.stopEffect(id)
    }

}

export const AudioManager = new _AudioManager();
