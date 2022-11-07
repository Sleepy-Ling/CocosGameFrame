
import { Util } from '../Core/Util';
import { UIName, AssetBundleEnum, Enum_Layer } from '../Def/EnumDef';
import PopUpItemBase from '../PopUp/PopUpItemBase';
import { ViewBase, ViewParamBase } from '../View/ViewBase';
class ViewData {
    modName: UIName
    node: cc.Node
    show: boolean
    load: boolean

    viewBaseComp: ViewBase
    constructor(modName: UIName) {
        this.modName = modName
        this.show = false
        this.load = false
    }
}
class _UIManager {
    private _ViewMap: ViewData[] = [];
    private layerDict: { [key: number]: cc.Node };

    private getViewData(constModName: UIName): ViewData {
        for (let x = 0; x < this._ViewMap.length; x++) {
            const element = this._ViewMap[x];
            if (element.modName == constModName) {
                return element
            }
        }
        let viewData = new ViewData(constModName)
        this._ViewMap.push(viewData)
        return viewData
    }
    private async LoadView(viewData: ViewData) {
        if (viewData.load) { return }
        if (viewData.node == null) {
            viewData.load = true
            let p1 = Util.Res.LoadAssetRes<cc.Prefab>(AssetBundleEnum.ui, UIName[viewData.modName]).then(async (prefab) => {
                viewData.load = false
                viewData.node = cc.instantiate(prefab) as cc.Node;
                let preProcessSucc: boolean = await this.preProcessView(viewData);
                if (!preProcessSucc) { return; }
                if (!viewData.show) { return }
            })

            return p1;
        }
    }

    public init(parentNode: cc.Node) {
        this.layerDict = {};
        let node = cc.find("Layer_root", parentNode);
        this.layerDict[Enum_Layer.Main] = node;

        node = cc.find("Layer_pop", parentNode);
        this.layerDict[Enum_Layer.Pop] = node;

        node = cc.find("Layer_loading", parentNode);
        this.layerDict[Enum_Layer.Loading] = node;

        node = cc.find("Layer_UI", parentNode);
        this.layerDict[Enum_Layer.UI] = node;

        node = cc.find("Layer_background", parentNode);
        this.layerDict[Enum_Layer.Background] = node;

    }
    private AddChild(viewData: ViewData, layer: Enum_Layer) {
        viewData.node.parent = this.layerDict[layer]
        viewData.node.position = cc.Vec3.ZERO;
        viewData.node.active = viewData.show

        this._ViewMap.sort((vd1, vd2) => {//升序排序
            return vd1.modName - vd2.modName;
        })

        for (let x = 0; x < this._ViewMap.length; x++) {//重新排序，权重大的层级置于上层
            const element = this._ViewMap[x];
            if (element.show) {
                element.node.setSiblingIndex(element.node.parent.children.length);
            }
        }

    }

    public async OpenUI(name: UIName, viewParam: ViewParamBase = null, layer: Enum_Layer = Enum_Layer.UI) {
        let viewData = this.getViewData(name);
        if (viewData.load) {
            return null;
        }

        if (viewData.node == null) {
            await this.LoadView(viewData);
        }

        if (viewData.show) {
            return;
        }

        if (viewData.node) {
            viewData.show = true;
            this.AddChild(viewData, layer);
        }
        viewData.viewBaseComp.onViewOpen(viewParam);
    }

    public CloseUIByName(name: UIName) {
        let viewData = this.getViewData(name);
        if (viewData && viewData.show) {
            viewData.show = false;
            viewData.node.active = false;
            viewData.viewBaseComp.onViewClose();
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

        let preLoadSucc = await comp.preLoadSrc();
        let initSucc = await comp.preInitView();

        return initSucc && preLoadSucc;
    }

    ShowToast(content: string, duration: number = 2) {

    }
    RecoverToast(item: PopUpItemBase) {

    }
}
export const UIManager = new _UIManager()