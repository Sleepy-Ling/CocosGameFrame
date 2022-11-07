import { GameData } from "../Data/GameData";
import { Enum_OnlineParam } from "../Def/EnumDef";


class _SDKManager {
    OnlineConfig: Map<Enum_OnlineParam, string> = new Map();
    BeginRecordTime: number;
    async Init() {
        return Promise.resolve(true);
    }


    /**显示原生广告 （按初始化序号显示）*/
    ShowCustomAd(idx: number) {
        if (cc.sys.isBrowser) {
            return;
        }

    }

    /**关闭原生广告 */
    CloseCustomAd(idx: number) {
        console.log(`====================关闭原生广告 ${idx} ====================`);
    }

    /**广告是否准备好了 */
    CustomAdIsReady(idx: number) {

    }

    /**
     * 关闭全部原生广告
     */
    CloseAllCustomAd() {

    }

    /**设置原生广告关闭回调 */
    setCloseCustomAdCallBack(idx: number, callback: Function) {
    }


    /**显示banner */
    ShowBanner(idx: number = 0) {
        console.log("====================显示banner====================");
    }

    /**关闭banner
    * @memberof _SDKManager
    */
    CloseBanner() {
        console.log("====================关闭banner====================");
    }

    /**
      *展示插页广告
      *
      * @memberof _SDKManager
      */
    ShowInsert(callback?: Function) {
        console.log("====================展示插页广告====================");
    }


    /**播放视频 */
    ShowVideo(type: string, success: Function, fail: Function = null, stop: Function = null, logEventObj?: any) {

    }


    /**
    *开始录屏
    * 
    * @memberof _SDKManager
    */
    BeginRecord() {
        console.log("====================开始录屏==================== ");
        this.BeginRecordTime = GameData.NowTime;

    }

    /**
    *结束录屏
    *
    * @memberof _SDKManager
    */
    EndRecord() {
        console.log("====================结束录屏====================");
    }

    /**
     *分享录屏
     *
     */
    ShareRecord(ShareType: string, success: Function, fail: Function = null) {
        console.log("====================分享录屏====================");

    }

    /**获得在线参数值 */
    GetOnlineValue(type: Enum_OnlineParam): string {
        return "";
    }

    /**获取并更新在线参数 */
    FetchConfig() {
        console.log("====================更新在线参数====================");
    }

    ShowScore() {

    }

    LogEvent(eventName: string, obj?: any) {
        let param = obj == null ? "" : JSON.stringify(obj);

    }
}

export const SDKManager = new _SDKManager();