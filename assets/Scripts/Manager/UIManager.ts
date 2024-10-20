import { GM } from "../Core/Global/GM"
import { ObjectPool } from "../Core/ObjectPool/ObjectPool"
import { Util } from "../Core/Utils/Util"
import { ViewBase, ViewParamBase, ViewTranstionParam } from "../Core/View/ViewBase"
import { VIEW_DIR, IS_DEBUG, GAME_VERSION } from "../Def/ConstDef"
import { UIName, Enum_Layer, Enum_AssetBundle, Enum_EventType } from "../Def/EnumDef"
import { CustomEvents } from "../Event/CustomEvents"
import PopUpItemBase from "../PopUp/PopUpItemBase"

export class ViewData {
    modName: UIName;
    node: cc.Node;
    show: boolean;
    load: boolean;
    layer: Enum_Layer;

    viewBaseComp: ViewBase;
    assetBundle: Enum_AssetBundle;
    constructor(modName: UIName, assetBundle?: Enum_AssetBundle) {
        this.modName = modName;
        this.show = false;
        this.load = false;
        this.assetBundle = assetBundle;
    }
}
export default class UIManager {
    private _ViewMap: ViewData[] = [];
    private _layerDict: { [key: number]: cc.Node };
    private _layerOrder: { [key: number]: number[] };

    private getViewData(constModName: UIName, module?: Enum_AssetBundle): ViewData {
        for (let x = 0; x < this._ViewMap.length; x++) {
            const element = this._ViewMap[x];
            if (element.modName == constModName) {
                return element
            }
        }
        let viewData = new ViewData(constModName, module);
        this._ViewMap.push(viewData);
        return viewData
    }
    private async LoadView(viewData: ViewData, module: Enum_AssetBundle) {
        if (viewData.load) { return }
        if (viewData.node == null) {
            viewData.load = true;

            //加载对应预制体
            let bundle: Enum_AssetBundle = module || Enum_AssetBundle.Common;
            let path: string = `${VIEW_DIR}/${UIName[viewData.modName]}`;

            await Util.Res.LoadAssetRes<cc.Prefab>(bundle, path).then(async (prefab) => {
                viewData.load = false
                viewData.node = cc.instantiate(prefab) as cc.Node;
                let preProcessSucc: boolean = await this.preProcessView(viewData);
                if (!preProcessSucc) { return Promise.resolve(null) }
            })

            return Promise.resolve(viewData.viewBaseComp);
        }
    }

    public init(parentNode: cc.Node) {
        this._layerDict = {};
        this._layerOrder = {};

        let node = cc.find("Layer_root", parentNode);
        this._layerDict[Enum_Layer.Main] = node;

        node = cc.find("Layer_pop", parentNode);
        this._layerDict[Enum_Layer.Pop] = node;

        node = cc.find("Layer_loading", parentNode);
        this._layerDict[Enum_Layer.Loading] = node;

        node = cc.find("Layer_UI", parentNode);
        this._layerDict[Enum_Layer.UI] = node;

        node = cc.find("Layer_guide", parentNode);
        this._layerDict[Enum_Layer.Guide] = node;

        node = cc.find("Layer_GM_Tool", parentNode);
        this._layerDict[Enum_Layer.GM_Tool] = node;
        node.active = IS_DEBUG;

        node = cc.find("Layer_recovery", parentNode);
        this._layerDict[Enum_Layer.recovery] = node;

        for (const key in this._layerDict) {
            if (Object.prototype.hasOwnProperty.call(this._layerDict, key)) {
                const element = this._layerDict[key];

                if (element) {
                    element.on(cc.Node.EventType.CHILD_ADDED, this._onLayerAddChild, this);
                    element.on(cc.Node.EventType.CHILD_REMOVED, this._onLayerRemoveChild, this);

                    this._layerOrder[key] = [];
                }
            }
        }

    }

    public showVer() {
        if (IS_DEBUG) {
            let lab: cc.Label = (new cc.Node()).addComponent(cc.Label);
            lab.node.anchorX = 0;
            lab.node.anchorY = 1;
            lab.node.setParent(this.getLayer(Enum_Layer.GM_Tool));
            lab.node.setPosition(cc.v2(-350, 1624 / 2));

            lab.string = GAME_VERSION;

        }
    }

    private _onLayerAddChild(node: cc.Node) {
        node.emit(UIManager.addInLayerFinish);
    }

    private _onLayerRemoveChild(node: cc.Node) {
        node.emit(UIManager.removeFromLayerFinish);
    }

    private static readonly addInLayerFinish: string = "addInLayerFinish";
    private static readonly removeFromLayerFinish: string = "removeFromLayerFinish";

    private async AddChild(viewData: ViewData, layer: Enum_Layer, zIndex: number) {
        let p: Promise<boolean>

        // viewData.node.parent = this.layerDict[layer];
        let layerNode = this._layerDict[layer];
        if (viewData.node.parent == null || viewData.node.parent != layerNode) {
            p = new Promise<boolean>((resolve) => {
                viewData.node.once(UIManager.addInLayerFinish, () => {
                    resolve(true);
                })
            })
            layerNode.addChild(viewData.node, zIndex);
        }
        else {
            p = Promise.resolve(true);
        }
        viewData.node.position = cc.Vec3.ZERO;
        viewData.node.active = viewData.show;
        viewData.layer = layer;


        return p;
    }

    public async OpenUI(name: UIName, viewParam: ViewParamBase = null, module: Enum_AssetBundle = Enum_AssetBundle.Common, layer: Enum_Layer = Enum_Layer.UI, transtionParam?: ViewTranstionParam): Promise<ViewBase> {
        console.log("OpenUI ==>", "模块名:", module, "界面名:", UIName[name], "界面id:", name);

        let viewData = this.getViewData(name, module);
        if (viewData.load) {
            console.log(UIName[name], "is loading ");

            return Promise.resolve(null);
        }

        let comp: ViewBase = viewData.viewBaseComp;
        if (viewData.show) {
            console.log("view:", UIName[name], " already exist !");
            return Promise.resolve(comp);
        }

        viewData.show = true;
        viewData.layer = layer;
        //层级顺序记录
        this._layerOrder[layer].push(name);

        if (transtionParam) {//如果启用过渡界面,打开过渡界面
            await this.OpenUI(transtionParam.loadingViewType, null, transtionParam.bundle, Enum_Layer.Loading);
        }

        if (viewData.node == null) {
            comp = await this.LoadView(viewData, module);
        }

        const preLoadPromise = await comp.preLoadSrc(viewParam);

        if (!preLoadPromise) {
            console.error("preLoad fail", name);
            return Promise.resolve(null);
        }

        if (viewData.node) {
            let zIndex = this._layerOrder[layer].indexOf(name);
            await this.AddChild(viewData, layer, zIndex);
            console.log("AddChild finish ！！", viewData.node.name);
        }

        const preInitPromise = await comp.preInitView(viewParam);
        if (!preInitPromise) {
            console.error("preInit fail", name);
            return Promise.resolve(null);
        }

        if (transtionParam) {//如果启用过渡界面,则关闭过渡界面
            this.CloseUIByName(transtionParam.loadingViewType);
        }

        comp.onViewOpen(viewParam);

        comp.onChangeLanguage(GM.gameDataManager.getLanguage());

        const uiEventDispatcher = GM.eventDispatcherManager.getEventDispatcher(Enum_EventType.UI);

        uiEventDispatcher.Emit(CustomEvents.OnViewOpen, name, comp);

        return Promise.resolve(comp);
    }

    public CloseUIByName(name: UIName) {
        let viewData = this.getViewData(name);
        if (viewData && !viewData.load && viewData.show) {
            console.log("CloseUI ==>", UIName[name]);
            viewData.viewBaseComp?.onViewCloseBefore();
            viewData.show = false;
            viewData.node.active = false;
            let idx = this._layerOrder[viewData.layer].indexOf(name);
            this._layerOrder[viewData.layer].splice(idx, 1);
            viewData.layer = null;
            viewData.node.setParent(null);
            viewData.viewBaseComp?.onViewClose();
        }
    }

    public CloseUI(comp: ViewBase) {
        for (let i = 0; i < this._ViewMap.length; i++) {
            const element = this._ViewMap[i];
            if (element.viewBaseComp == comp) {
                this.CloseUIByName(element.modName);
                break;
            }
        }
    }

    public CloseAllUI() {
        for (let i = 0; i < this._ViewMap.length; i++) {
            const element = this._ViewMap[i];
            this.CloseUIByName(element.modName);
        }
    }

    public GetUI(name: UIName): ViewBase {
        for (let i = 0; i < this._ViewMap.length; i++) {
            const element = this._ViewMap[i];
            if (element.modName == name) {
                return element.viewBaseComp;
            }
        }
    }

    /**
     * 获取界面数据 不建议调用该接口
     * *注意！请勿修改该返回值任何参数
     */
    public GetUIViewData(name: UIName): ViewData {
        for (let i = 0; i < this._ViewMap.length; i++) {
            const element = this._ViewMap[i];
            if (element.modName == name) {
                return element;
            }
        }
    }

    public GetUIIsShowing(name: UIName): boolean {
        for (let i = 0; i < this._ViewMap.length; i++) {
            const element = this._ViewMap[i];
            if (element.modName == name) {
                return element.show;
            }
        }
    }

    /**销毁界面 （注意：是否真的需要销毁该界面） */
    public DestoryUI(comp: ViewBase) {
        let idx = this._ViewMap.findIndex((value) => {
            return value.viewBaseComp == comp;
        })

        let viewData = this._ViewMap.splice(idx, 1)[0];
        viewData.node.destroy();
    }

    /**销毁界面 （注意：是否真的需要销毁该界面） */
    public DestoryUIByName(name: UIName) {
        let idx = this._ViewMap.findIndex((value) => {
            return value.modName == name;
        })

        let viewData = this._ViewMap.splice(idx, 1)[0];
        viewData.node.destroy();
    }

    /**
     * 预处理界面
     * @param viewData 界面数据
     * @returns 
     */
    private async preProcessView(viewData: ViewData): Promise<boolean> {
        let comp = viewData.node.getComponent(ViewBase);
        viewData.viewBaseComp = comp;
        if (comp == null) {
            console.log("UI   " + UIName[viewData.modName] + "上不含同名脚本");
            return Promise.resolve(false);
        }

        Util.Res.LoadAssetRes<cc.Font>(Enum_AssetBundle.Font, "VonwaonBitmap-12px_mini").then((font) => {
            comp.applyFont(font);
        })

        let isFirstInitViewSucc = await comp.firstInitView();

        return isFirstInitViewSucc;
    }

    public GetActiveViewByLayer(layer: Enum_Layer) {
        let result: UIName[] = [];

        for (const viewData of this._ViewMap) {
            if (viewData.node.parent == this._layerDict[layer] && viewData.show) {
                result.push(viewData.modName);
            }
        }

        return result;
    }

    /**获取层级 */
    public getLayer(layer: Enum_Layer) {
        return this._layerDict[layer];
    }

    /**获取层级信息 */
    public getLayerInf() {
        let result: string[] = [];

        let temp: IViewInf[] = [];
        for (let i = 0; i < this._ViewMap.length; i++) {
            const element = this._ViewMap[i];
            if (!element.show) {
                continue;
            }

            let idx = this._layerOrder[element.layer].indexOf(element.modName);

            let inf: IViewInf = {
                name: element.modName,
                layer: element.layer,
                assetBundle: element.assetBundle,
                zIndex: idx,
            }

            temp.push(inf);
        }

        temp.sort((a, b) => {
            return a.zIndex - b.zIndex;
        })

        for (let i = 0; i < temp.length; i++) {
            const element = temp[i];
            result.push(JSON.stringify(element));
        }

        return result;
    }
}

export interface IViewInf {
    name: UIName;
    layer: number;
    assetBundle: Enum_AssetBundle;
    zIndex: number;
}