import { Enum_EventType } from "../Def/EnumDef";
import EventDispatcher from "../Event/EventDispatcher";
import ManagerBase from "./ManagerBase";

/**事件派发器 */
export default class EventDispatcherManager extends ManagerBase {
    protected dictionary: Map<Enum_EventType, EventDispatcher>;
    init(...inf: unknown[]): boolean {
        this.dictionary = new Map();

        // console.log(Enum_EventType);

        const values = Object.values(Enum_EventType);
        values.forEach(v => {
            if (!isNaN(Number(v))) {
                // console.log(v);

                this.dictionary.set(v as Enum_EventType, new EventDispatcher());
            }
        });


        return super.init();
    }

    /**根据模块类型获取对应的事件派发器 */
    public getEventDispatcher(type: Enum_EventType) {
        return this.dictionary.get(type);
    }

}