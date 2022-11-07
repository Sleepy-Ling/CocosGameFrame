const { ccclass, property } = cc._decorator;

/**自定义事件 */
@ccclass('CustomEvents')
export class CustomEvents {
    /**窗口打开事件 */
    public static OnViewOpen = "OnViewOpen";
    /**窗口关闭事件 */
    public static OnViewClose = "OnViewClose";

    /**游戏从后台转到前台 */
    public static GameShowFromBackground = "GameShowFromBackground";
    /**游戏从前台转到后台 */
    public static GameHideInBackground = "GameHideInBackground";


    /*------------游戏相关消息------------*/
    public static PauseGame = "PauseGame";
    public static ResumeGame = "ResumeGame";

    public static ShowDebug = "ShowDebug";

    public static LoadingProgress = "LoadingProgress";
}

