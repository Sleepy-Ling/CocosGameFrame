import { Enum_AssetBundle, Enum_Language, Enum_Orientation, AudioType } from '../../Def/EnumDef';
import { SDKManager } from '../../SDK/SDKManager';
import { GM } from '../Global/GM';
import { LogUtil } from '../Utils/LogUtil';

import IViewBase from './IViewBase';
const { ccclass, property, menu } = cc._decorator;

/**界面过渡参数 */
export class ViewTranstionParam {
    /**过渡时所用到的加载界面（值等同于UIName） */
    loadingViewType: number;

    /**所属分包 */
    bundle?: Enum_AssetBundle;
}

/**打开界面参数 */
export class ViewParamBase {
    closeCallBack: Function;
    openCallBack: Function;
}

/**界面基类 */
@ccclass()
@menu("View/ViewBase")
export class ViewBase extends cc.Component implements IViewBase {
    @property(cc.Node)
    protected icon_AdList: cc.Node[] = [];

    /**首次应用字体 */
    protected firstApplyFont: boolean = true;

    protected viewParam: ViewParamBase;
    start(): void {

    }

    /**当前是否为有广告的ui界面 */
    @property({ tooltip: "值为true时，在界面打开或关闭，会调用广告页面参数" })
    private isPageCallAd: boolean = false;

    /**首次初始化界面
     * (注意：该方法只会在加载后执行一次,可以把ui绑定写在此处)
     */
    public async firstInitView(param?: ViewParamBase): Promise<boolean> {
        return Promise.resolve(true);
    }

    /**预初始化 */
    public async preInitView(param: ViewParamBase): Promise<boolean> {
        return Promise.resolve(true);

    }

    /**预加载对应场景资源 */
    public async preLoadSrc(param: ViewParamBase): Promise<boolean> {
        return Promise.resolve(true);

    }


    protected onTouchView(evt: cc.Event.EventTouch) {
        let worldPosition: cc.Vec2 = evt.getLocation();
        console.log("onTouchView ===>", evt.target.name, "touch pos", `{x:${worldPosition.x},y:${worldPosition.y}}`);


    }


    /**在界面打开时触发 */
    public onViewOpen(param: ViewParamBase) {
        this.viewParam = param;

        if (param && param.openCallBack) {
            param.openCallBack();
        }
    };

    /**在界面关闭时触发 */
    public onViewClose(param?: any) {
        if (this.viewParam && this.viewParam.closeCallBack) {
            this.viewParam.closeCallBack(param);
        }
    };

    /**在界面关闭前触发 */
    public onViewCloseBefore() {

    }

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
     * @param curButton 按钮节点
     * @param clickFuncName 点击事件函数名
     * @param target 作用域
     * @param compName 组件名
     * @param customEventData 自定义数据string
     * @param actionID 行为id
     * @param clearOldListener 是否清除旧的监听事件
     * @returns 
     */
    protected bindBtnClickEvent(button: cc.Node | cc.Button, clickFuncName: string, target: cc.Node, compName: string, customEventData: string = "", actionID: number = undefined, clearOldListener: boolean = false, btnClickSound?: AudioType) {
        if (button == null) {
            console.error("bindBtnClickEvent error: null object ===>", this.node.name,);
            return;
        }

        let curButton: cc.Button;
        if (button instanceof cc.Node) {
            curButton = button.getComponent(cc.Button);
            if (!curButton) {
                console.error("bindBtnClickEvent error:no cc.Button component ===>", this.node.name,);
                return;
            }
        }
        else {
            curButton = button;
        }

        if (clearOldListener) {
            curButton.clickEvents = [];
        }

        if (curButton.clickEvents == null) {
            curButton.clickEvents = [];
        }

        let clickEventHandler = new cc.Component.EventHandler();
        clickEventHandler.target = target;
        clickEventHandler.component = compName;
        clickEventHandler.handler = clickFuncName;
        clickEventHandler.customEventData = customEventData;
        curButton.clickEvents.push(clickEventHandler);

        clickEventHandler = new cc.Component.EventHandler();
        clickEventHandler.target = this.node;
        clickEventHandler.component = compName;
        clickEventHandler.handler = "triggerBtnSound";
        clickEventHandler.customEventData = btnClickSound;
        curButton.clickEvents.push(clickEventHandler);

        clickEventHandler = new cc.Component.EventHandler();
        clickEventHandler.target = this.node;
        clickEventHandler.component = compName;
        clickEventHandler.handler = "triggerLogBtn";
        clickEventHandler.customEventData = compName;
        curButton.clickEvents.push(clickEventHandler);

        if (actionID != undefined && !isNaN(actionID)) {//绑定该按钮行为id
            clickEventHandler = new cc.Component.EventHandler();
            clickEventHandler.target = this.node;
            clickEventHandler.component = compName;
            clickEventHandler.handler = "triggerAction";
            clickEventHandler.customEventData = actionID.toString();
            curButton.clickEvents.push(clickEventHandler);
        }
    }

    protected triggerBtnSound(evt: cc.Event.EventTouch, soundName: string) {
        // console.log("soundName", soundName);

        soundName = soundName == null ? AudioType.ClickBtn : soundName;
        GM.audioManager.PlayEffect(soundName, false);
    }

    /**关闭自己 */
    protected close() {
        GM.uiManager.CloseUI(this);
    }

    /**应用字体包 */
    public applyFont(font: cc.Font) {
        if (!this.firstApplyFont) {
            return;
        }

        this.firstApplyFont = false;

        let labList = this.getComponentsInChildren(cc.Label);
        labList.forEach((comp) => {
            comp.font = font;
        })

        let richTextList = this.getComponentsInChildren(cc.RichText);
        richTextList.forEach((comp) => {
            comp.font = font;
        })
    }
}

