/**枚举定义 */

//#region  广告相关
export enum AdType {
    TT,
    WeChat,
    QQ,
    None,
    UMWeChat,
    UMOppo,
    UMVivo,
    Native,
}

export enum AdRewardType {

}

/**
 *配置
 *
 * @export
 * @enum {number}}
 */
export enum ConfigType {
}

/**
 *
 *资源分包
 * @export
 * @enum {number}
 */

export enum Enum_AssetBundle {
    bg = "bg",
    BMFont = "BMFont",
    ui = "ui",
    config = "config",
    effect = "effect",
    audio = "audio",
    prefab = "prefab",
    atlas = "atlas"
}

/**
 *音效
 *
 * @export
 * @enum {number}
 */
export enum AudioType {
    None = "",
    ClickBtn = "",
}

/**
 *特效
 *
 * @export
 * @enum {number}
 */
export enum EffectType {
    effect = "effect",
}


export enum AtlasType {
    default = "AutoAtlas",
}


/**碰撞体tag值 */
export enum ColliderType {

}


export enum UIName {
    BeginView,
    GameView,

    LoadingView,
}

/**游戏状态 */
export enum Enum_GameState {
    None,
    Gaming,
    GamePause,
    GamePauseOnBackgroud,
    GameEnd,

}

/**在线参数 */
export enum Enum_OnlineParam {

}

export enum Enum_UserSettingType {
    None,
    BGM,
    SoundsEff,
    Vibrate,
    UserAgreement,
    PrivacyPolicy,
}

/**子弹类型 */
export enum BulletType {
    /**普通子弹 */
    Normal,
    /**火焰子弹 */
    Fire,
}

/**碰撞盒掩码 */
export enum Enum_ColliderMask {
    Default = 0,
}

export enum Enum_Orientation {
    Portrait,
    Horizontal,
}
export enum Enum_Language {
    EN = "EN",
    CN = "CN",
}

/**游戏物体类型 */
export enum Enum_GameOjectsType {

}

/**层级类型 */
export enum Enum_Layer {
    Main,
    UI,
    Pop,
    Loading,
    Background,
}




