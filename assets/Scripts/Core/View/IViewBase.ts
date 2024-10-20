import { Enum_Language, Enum_Orientation } from "../../Def/EnumDef";

export default interface IViewBase {
    /**切换语言 */
    onChangeLanguage(lang: Enum_Language): void;
    /**横竖屏切换 */
    onChangeOrientation(ori: Enum_Orientation): void;
    /**窗口变化 */
    onFrameResize(): void;

}