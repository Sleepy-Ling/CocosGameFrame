import { GM } from "../Core/Global/GM";
import { Util } from "../Core/Utils/Util";
import { AudioType, Enum_AssetBundle, Enum_UserSettingType } from "../Def/EnumDef";
import { SDK_WX } from "../SDK/SDK_WX";
import { AudioManager } from "./AudioManager";


export class WX_AudioManager extends AudioManager {
    protected curBgmMusic: any;

    public init(inf?: unknown): boolean {
        let v = GM.gameDataManager.getUserSetting(Enum_UserSettingType.BGM);
        this.setBGMVolume(v);

        return true;
    }

    /**播放bgm */
    public async PlayBGM(name: AudioType, boolLoop = true) {
        if (name == AudioType.None || name == null) {
            return;
        }

        this.curBgm = name;
        let p = new Promise<any>(async (resolve, reject) => {
            let clip = await Util.Res.LoadAssetRes<cc.AudioClip>(Enum_AssetBundle.Audio, name);
            let wx = window["wx"];
            if (wx) {
                let str = "init " + name;
                console.log(str);

                let music = wx.createInnerAudioContext({ useWebAudioImplement: true });
                music.loop = boolLoop;
                music.src = clip.nativeUrl;

                music.onCanplay(() => {
                    if (this.curBgm == name) {
                        music.play();

                        let v = GM.gameDataManager.getUserSetting(Enum_UserSettingType.BGM);
                        this.setBGMVolume(v);
                        
                    }
                });

                music.onEnded(() => {
                    if (!boolLoop) {//不循环bgm时，播放完bgm 就销毁资源
                        music.destroy();
                    }

                    if (this.curBgmMusic == music) {
                        this.curBgmMusic = null;
                    }
                });

                if (this.curBgmMusic) {
                    this.curBgmMusic.destroy();
                }

                this.curBgmMusic = music;

                resolve(music);
            }
        });

        return await p;
    }

    /**播放音效 */
    public async PlayEffect(name: AudioType, loop: boolean = false): Promise<any> {
        if (name == AudioType.None || name == null) {
            return;
        }

        if (SDK_WX.wx) {
            let wx = SDK_WX.wx;
            if (wx) {
                let effect = this.getNotPlayingEffectByName(name);
                if (effect) {
                    effect.loop = loop;
                    effect.play();
                }
                else {
                    effect = await this.initWxEffect(name);
                }

                effect.volume = GM.gameDataManager.getUserSetting(Enum_UserSettingType.SoundsEff);
            }
        }

        return Promise.resolve(true);
    }

    /**根据音效名 停止播放的音效  */
    StopEffectByAudioType(name: AudioType) {
        let wx = SDK_WX.wx;
        if (wx) {
            if (this.effectPool[name] == null) {
                return false;
            }

            for (let effect of this.effectPool[name]) {
                if (effect.isPlaying) {
                    effect.stop();
                }
            }

            return true;
        }

        return false;
    }

    /**音效池 key：AudioType value:音频对象*/
    protected effectPool: { [key: string]: any[] } = {};
    async initWxEffect(name: AudioType) {
        let p = new Promise(async (resolve, reject) => {
            let clip = await Util.Res.LoadAssetRes<cc.AudioClip>(Enum_AssetBundle.Audio, name);
            let wx = window["wx"];
            if (wx) {
                let str = "init " + name;
                console.log(str);

                //useWebAudioImplement :使用底层音频驱动，对于短音频、播放频繁的音频建议开启此选项
                let music = wx.createInnerAudioContext({ useWebAudioImplement: true });
                music.loop = false;
                music.src = clip.nativeUrl;
                music.isPlaying = false;
                music.onEnded(() => {
                    music.isPlaying = false;
                });
                music.onStop(() => {
                    music.isPlaying = false;
                });

                music.onCanplay(() => {
                    if (this.effectPool[name] == null) {
                        this.effectPool[name] = [];
                    }

                    this.effectPool[name].push(music);

                })

                music.onPlay(() => {
                    music.isPlaying = true;
                })

                resolve(music);
            }


        });

        return await p;
    }

    /**获得对象池的音效 */
    protected getNotPlayingEffectByName(name: AudioType) {
        if (this.effectPool[name] == null) {
            return null;
        }

        for (let effect of this.effectPool[name]) {
            if (!effect.isPlaying) {
                return effect;
            }
        }

        return null;
    }

    public PauseBGM(): boolean {
        if (this.curBgmMusic) {
            this.curBgmMusic.pause();
        }
        return true;
    }

    public ResumeBGM(): boolean {
        if (this.curBgmMusic) {
            this.curBgmMusic.play();
        }
        return true;
    }

    /**设置背景音乐大小 */
    public setBGMVolume(v: number) {
        if (this.curBgmMusic) {
            this.curBgmMusic.volume = v;
        }
    }
    /**设置音效大小 */
    public setEffectVolume(v: number) {
        for (const name in this.effectPool) {
            if (Object.prototype.hasOwnProperty.call(this.effectPool, name)) {
                const list = this.effectPool[name];
                for (const effect of list) {
                    if (effect && effect.isPlaying) {
                        effect.volume = v;
                    }
                }
            }
        }
    }
}