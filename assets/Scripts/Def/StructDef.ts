/**结构体定义 */

import CharacterBase from "../GameObjects/CharacterBase";
import { BulletType, Enum_ColliderMask } from "./EnumDef";

export interface IWeapon {
    /**武器id */
    id: number;
    /**伤害 */
    damage: number;
    /**射击间隔 单位秒*/
    shootingInterval: number;
    /**与之匹配的子弹 配置id */
    bulletID: number;
}

export interface IBulletBase {
    id: number;
    lifeTime: number;
    speed: number;
    /**子弹类型 */
    bulletType: BulletType;
    /**重力加速度 缩放*/
    gScale?: number;
    /**碰撞盒掩码 */
    colliderMask?: Enum_ColliderMask;
    /**命中时特效名 */
    hitEffectName?: string;
}

/**发射中 子弹属性 */
export interface IBulletInfo extends IBulletBase {
    /**伤害 */
    damage: number;
    /**发射者 */
    owner: CharacterBase;
    /**击中回调 */
    hitCallBack?: Function;
    /**飞行开始时的角度 */
    angleOnInit?: number;
}

/**发射信息 */
export interface IShootInfo {
    /**子弹信息 */
    bulletInfo: IBulletInfo;
    /**发射位置(世界位置) */
    shootingPos: cc.Vec2;
    /**发射方向 */
    shootingDir: cc.Vec2;
}

export interface IBulletHitInfo {
    /**中弹位置（世界位置） */
    hitPos: cc.Vec2
    /**发射者 */
    owner: CharacterBase;
    /**命中时特效名 */
    hitEffectName: string;
}
