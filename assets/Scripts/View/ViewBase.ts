import { LogUtil } from '../Core/LogUtil';
import { Enum_OnlineParam, Enum_Language, Enum_Orientation, AudioType } from '../Def/EnumDef';
import { AudioManager } from '../Manager/AudioManager';

import { SDKManager } from '../SDK/SDKManager';
import IViewBase from './IViewBase';
const { ccclass, property } = cc._decorator;

export class ViewParamBase {
    closeCallBack: Function;
    openCallBack: Function;
}

@ccclass('ViewBase')
export class ViewBase extends cc.Component implements IViewBase {
    @property(cc.Node)
    protected icon_AdList: cc.Node[] = [];

    protected viewParam: ViewParamBase;
    start(): void {

    }

    /**预初始化 */
    public async preInitView(): Promise<boolean> {
        return Promise.resolve(true);

    }

    /**预加载对应场景资源 */
    public async preLoadSrc(): Promise<boolean> {
        return Promise.resolve(true);

    }

    /**在界面打开时触发 */
    public onViewOpen(param: ViewParamBase) {
        this.viewParam = param;

        if (param && param.openCallBack) {
            param.openCallBack();
        }

    };

    /**在界面关闭时触发 */
    public onViewClose() {
        if (this.viewParam && this.viewParam.closeCallBack) {
            this.viewParam.closeCallBack();
        }

    };

    /**
     * 界面语种切换
     * @param lang 
     */
    public onChangeLanguage(lang: Enum_Language): void {
    }

    /**
     * 横竖屏切换
     * @param ori 
     */
    public onChangeOrientation(ori: Enum_Orientation): void {
    }

    /**屏幕尺寸改变 */
    public onFrameResize(): void {
    }

    /**
     * 监听按钮点击事件
     * @param btn 按钮节点
     * @param clickFuncName 点击事件函数名
     * @param target 作用域
     * @param compName 组件名
     * @param clearOldListener 是否清除旧的监听事件
     * @returns 
     */
    protected bindBtnClickEvent(btn: cc.Node, clickFuncName: string, target: cc.Node, compName: string, customEventData: string = "", clearOldListener: boolean = true) {
        let button = btn.getComponent(cc.Button);
        if (button == null) {
            LogUtil.Error("do not has button", btn);
            return;
        }

        if (clearOldListener) {
            button.clickEvents = [];
        }

        let clickEventHandler = new cc.Component.EventHandler();
        clickEventHandler.target = target;
        clickEventHandler.component = compName;
        clickEventHandler.handler = clickFuncName;
        clickEventHandler.customEventData = customEventData;
        button.clickEvents.push(clickEventHandler);

        clickEventHandler = new cc.Component.EventHandler();
        clickEventHandler.target = this.node;
        clickEventHandler.component = compName;
        clickEventHandler.handler = "triggerBtnSound";
        button.clickEvents.push(clickEventHandler);

    }

    protected triggerBtnSound() {
        AudioManager.PlayEffect(AudioType.ClickBtn)
    }

}

