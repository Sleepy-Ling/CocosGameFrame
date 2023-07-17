/**平台适配器 */
export abstract class PlatformAdapter {
    abstract ShowGameClubButtonStyleByIndex(index: number, param?: unknown): void;
    abstract HideGameClubButtonStyleByIndex(index: number): void;
    abstract OnShareAppMessage(func: Function): void;
    abstract ShareAppMessage(obj: unknown): void;

    abstract SaveCanvas2File(obj: unknown): any;
    abstract read(obj: unknown): any;
    abstract write(obj: unknown): any;
    abstract deleteFile(obj: unknown): boolean;
    abstract readDir(obj: unknown): any;
    abstract getStorageInfo(obj: unknown): any;

    /**打点 */
    abstract reportEvent(id: any, obj: any): void;
}

/**样板适配器 */
export class NoneAdapter extends PlatformAdapter {
    reportEvent(id: any, obj: any): void {
    }
    getStorageInfo(obj: unknown) {
        return null;
    }
    deleteFile(obj: unknown) {
        return true;
    }
    readDir(obj: unknown) {

    }
    read(obj: unknown) {
    }
    write(obj: unknown) {
    }
    SaveCanvas2File(obj: unknown) {
    }
    ShareAppMessage(obj: unknown): void {

    }
    OnShareAppMessage(func: Function) {

    }
    HideGameClubButtonStyleByIndex(index: number) {

    }
    ShowGameClubButtonStyleByIndex(index: number) {

    }

}