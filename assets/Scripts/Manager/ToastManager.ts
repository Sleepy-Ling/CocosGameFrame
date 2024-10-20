import { ObjectPool } from "../Core/ObjectPool/ObjectPool";
import { Util } from "../Core/Utils/Util";
import { Enum_AssetBundle, Enum_Layer } from "../Def/EnumDef";
import PopUpItemBase, { PopUpItemBaseParam } from "../PopUp/PopUpItemBase";
import ManagerBase from "./ManagerBase";

/**飘字管理者 */
export default class ToastManager extends ManagerBase {
    protected layer: cc.Node;
    init(root: cc.Node) {
        if (!root) {
            return false;
        }

        this.layer = root;
    }


    /**显示飘字提示 */
    ShowToast(toastID: number, content: string, duration: number = 2, param?: PopUpItemBaseParam) {
        if (param == null) {
            param = new PopUpItemBaseParam();
        }

        let toastName: string = `Toast_${toastID}`;
        let item = ObjectPool.get(toastName) as PopUpItemBase;
        let closeCallBack: Function = param.closeCallBack;


        if (!item) {
            Util.Res.LoadAssetRes<cc.Prefab>(Enum_AssetBundle.PopUpToast, toastID.toString()).then((prefab) => {
                let node = cc.instantiate(prefab);
                node.setParent(this.layer);
                node.setPosition(0, 0);

                let popUpItem = node.getComponent(PopUpItemBase);
                popUpItem.show(content, duration, param);

                //封装飘字后的回调
                let closeCallBack_1: Function = () => {
                    closeCallBack && closeCallBack();
                    this.RecoverToast(toastName, popUpItem);
                }

                param.closeCallBack = closeCallBack_1;
            });
        }
        else {
            item.node.setParent(this.layer);
            item.node.setPosition(0, 0);

            //封装飘字后的回调
            let closeCallBack_1: Function = () => {
                closeCallBack && closeCallBack();
                this.RecoverToast(toastName, popUpItem);
            }

            param.closeCallBack = closeCallBack_1;


            let popUpItem = item.getComponent(PopUpItemBase);
            popUpItem.show(content, duration, param);

        }

    }

    protected RecoverToast(toastName: string, item: PopUpItemBase) {
        ObjectPool.put(toastName, item);
    }

    // /**显示飘字提示 */
    // ShowToast(toastID: number, content: string, duration: number = 2, closeCallBack?: Function) {
    //     let param: PopUpItemBaseParam;
    //     if (toastID == 0) {
    //         let curParam: ToastParam = {
    //             position: cc.v2(375, 1212),
    //             offsetY: -50,
    //             tweenTime: 0.5,
    //             closeCallBack: closeCallBack
    //         };

    //         param = curParam;
    //     }

    //     GM.uiManager.ShowToast(toastID, content, duration, param);
    // }
}