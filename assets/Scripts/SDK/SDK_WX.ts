import { PlatformAdapter } from "./SDKBase";


export namespace SDK_WX {
    export const wx = window["wx"];
    export const wxSysInfo = wx ? wx.getSystemInfoSync() : null;

    export const GameClubButtonStyleConfg: { [key: number]: GameClubButtonCustomParam } = {
        0: {
            x: -594.056,
            y: -82.799,
            width: 40,
            height: 40,
            isImage: true,

        },
    }

    /**
     * 游戏坐标转换成相对设备屏幕坐标（坐标系的起点在左上角）
     * @param x 游戏x位置
     * @param y 游戏y位置
     * @param width 图标宽
     * @param height 图标高
     */
    export const GamePositionInverstToDeviceScreen = (x: number, y: number, width: number, height: number, fixWidth: boolean = true) => {
        let res: { x: number, y: number, width: number, height: number } = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        }

        const deviceWidth = wxSysInfo.screenWidth;
        const deviceHeight = wxSysInfo.screenHeight;

        const gameScreenSize = cc.Canvas.instance.designResolution;

        res.x = (gameScreenSize.width / 2 + x - width / 2) / gameScreenSize.width * deviceWidth
        res.y = (1 - (gameScreenSize.height / 2 + y + height / 2) / gameScreenSize.height) * deviceHeight;

        let rate: number = 1;
        if (fixWidth) {
            rate = deviceWidth / gameScreenSize.width;

        }
        else {
            rate = deviceHeight / gameScreenSize.height;

        }
        res.width = rate * width;
        res.height = rate * height;
        return res;
    }


    /**
      * 游戏坐标转换成相对设备屏幕坐标（坐标系的起点在左上角）(正确度待验证)
      * @param x 游戏x位置
      * @param y 游戏y位置
      * @param width 图标宽
      * @param height 图标高
      */
    export const DeviceScreenInverstTopGamePosition = (x: number, y: number, width: number, height: number) => {
        const deviceWidth = wxSysInfo.screenWidth;
        const deviceHeight = wxSysInfo.screenHeight;

        const gameScreenSize = cc.Canvas.instance.designResolution;

        let res: cc.Vec2 = cc.v2();

        res.x = ((x + width / 2) / deviceWidth - 0.5) * gameScreenSize.width;
        res.y = (0.5 - (y + height / 2) / deviceHeight) * gameScreenSize.height;

        return res;
    }

    export class WX_Adapter extends PlatformAdapter {
        reportEvent(id: any, obj: any): void {
            console.log("wx report event => ", "id", id, "  obj", obj);

            wx.reportEvent(id, obj);

        }
        protected canvas: any;
        protected fileSystemManager: any;
        constructor() {
            super();

            this.canvas = wx.createCanvas();
            this.fileSystemManager = wx.getFileSystemManager();

        }
        read(obj: ReadFileParam) {
            let fd = this.fileSystemManager.openSync(obj)
            obj.fd = fd;
            try {
                // console.log("fstatSync", this.fileSystemManager.fstatSync(obj));
                return this.fileSystemManager.readFileSync(obj.filePath, obj.encoding, obj.position, obj.length);
            }
            catch (e) {
                console.error("read error", e);

                return null
            }
        }
        write(obj: WriteFileParam) {
            console.log("write");

            //异步版本
            // let fd = this.fileSystemManager.openSync(obj)
            // obj.fd = fd;

            // const success: Function = (res) => {
            //     if (obj.success) {
            //         obj.success();
            //     }
            //     console.log("write done", res.bytesWritten);

            //     this.fileSystemManager.closeSync(obj);
            // }
            // const fail: Function = (res) => {
            //     if (obj.fail) {
            //         obj.fail();
            //     }

            //     console.log("write fail ", res);
            // }
            // const complete: Function = () => {
            //     if (obj.complete) {
            //         obj.complete();
            //     }
            // }
            // obj.success = success;
            // obj.complete = complete;
            // obj.fail = fail;

            // this.fileSystemManager.write(obj);

            //同步版本
            this.fileSystemManager.writeFileSync(obj.filePath, obj.data, obj.encoding);
        }

        deleteFile(obj: unknown): boolean {
            try {
                this.fileSystemManager.unlinkSync(obj);
                return true;
            }
            catch (err) {
                console.log("deleteFile error", err);

                return false;
            }
        }

        readDir(obj: any) {
            return this.fileSystemManager.readdirSync(obj);
        }

        getStorageInfo(obj: unknown) {
            wx.getStorageInfo(obj);
        }


        SaveCanvas2File(obj: SaveTempFileParam) {
            if (this.canvas == null) {
                console.error("canvas is null");
                return null;
            }


            return this.fileSystemManager.saveFileSync(this.canvas.toTempFilePathSync(obj));
        }
        ShareAppMessage(obj: unknown): void {
            if (wx == null) {
                return;
            }

            wx.shareAppMessage(obj);
        }
        OnShareAppMessage(func: Function) {
            if (wx == null) {
                return;
            }

            console.log("on share ", func);

            wx.onShareAppMessage(func);
        }

        protected GameClubButton: Map<number, any> = new Map();

        /**
         * 显示游戏圈按钮
         * @param index 
         * @returns 
         */
        public ShowGameClubButtonStyleByIndex(index: number, param: GameClubButtonCustomParam) {
            if (wx == null) {
                return;
            }

            let btn = this.GameClubButton.get(index);
            if (btn) {
                return btn.show();
            }

            const cfg = GameClubButtonStyleConfg[index];

            const fitWidth = cc.Canvas.instance.fitWidth
            const pos = GamePositionInverstToDeviceScreen(param.x || cfg.x, param.y || cfg.y,
                param.width || cfg.width, param.height || cfg.height, fitWidth);

            let style: GameClubButtonStyle = {
                left: pos.x,
                top: pos.y,
                width: pos.width,
                height: pos.height,
            }

            let ButtonParam: GameClubButtonParam = {
                type: cfg.isImage ? "image" : "text",
                style: style,
                icon: "white",
                image: param.iconURL || cfg.iconURL || "",
            }

            console.log("ButtonParam", ButtonParam);


            btn = wx.createGameClubButton(ButtonParam);

            this.GameClubButton.set(index, btn);
            return btn;
        };

        /**
         * 隐藏游戏圈按钮
         * @param index 
         */
        public HideGameClubButtonStyleByIndex(index: number) {
            const btn = this.GameClubButton.get(index);
            btn.hide();
        }

    }


    export interface GameClubButtonCustomParam {
        width: number;
        height: number;
        x: number,
        y: number,
        iconURL?: string;
        text?: string;
        isImage: boolean;
    }

    /**微信官方游戏圈按钮参数结构体 */
    export interface GameClubButtonParam {
        /**
         * text	可以设置背景色和文本的按钮
         * image 只能设置背景贴图的按钮，背景贴图会直接拉伸到按钮的宽高
         */
        type: string;
        /**
         * 按钮上的文本，仅当 type 为 text 时有效
         */
        text?: string;
        /**
         * 按钮的背景图片，仅当 type 为 image 时有效
         */
        image?: string;
        style: GameClubButtonStyle;
        /**
         * 仅当 object.type 参数为 image 时有效
         * green	绿色的图标
         * white	白色的图标
         * dark	有黑色圆角背景的白色图标
         * light	有白色圆角背景的绿色图标
         *  */
        icon: string;
    }

    /**微信官方游戏圈按钮样式结构体 */
    export interface GameClubButtonStyle {
        left: number;
        top: number;
        width: number;
        height: number;
        backgroundColor?: string;
        borderColor?: string;
        borderWidth?: number;
        borderRadius?: number;
        color?: string;
        textAlign?: string;
        fontSize?: number;
        lineHeight?: number;
    }

    export interface GetUserInfoButtonStyle {
        left
        top
        width
        height
        lineHeight
        backgroundColor
        color
        textAlign
        fontSize
        borderRadius
    }

    export interface GetUserInfoButtonParam {
        type: string;
        text?: string;
        image?: string;

        style: GetUserInfoButtonStyle;
    }

    export interface SaveTempFileParam {
        /**截取 canvas 的左上角横坐标 */
        x?: number;
        /**截取 canvas 的左上角纵坐标 */
        y?: number;
        /**截取 canvas 的宽度 */
        width?: number;
        /**截取 canvas 的高度 */
        height?: number;
        /**目标文件的宽度，会将截取的部分拉伸或压缩至该数值 */
        destWidth?: number;
        /**目标文件的高度，会将截取的部分拉伸或压缩至该数值 */
        destHeight?: number;
        /**目标文件的类型 jpg 文件 png 文件*/
        fileType?: string;
        /**jpg图片的质量 */
        quality?: number;

        success?: Function;
        fail?: Function;
        complete?: Function;
    }

    export interface SaveFileParam {
        tempFilePath: string;

        filePath?: string;
        success?: Function;
        fail?: Function;
        complete?: Function;

    }

    export class WriteFileParam {
        filePath: string;
        data: String | ArrayBuffer;
        fd?: string;
        encoding?: string;
        position?: number;
        length?: number;
        flag?: string = "w+";

        success?: Function;
        complete?: Function;
        fail?: Function;
    }

    export interface ReadFileParam {
        filePath: string;
        fd?: string;
        encoding?: string;
        position?: number;
        length?: number;
    }
}