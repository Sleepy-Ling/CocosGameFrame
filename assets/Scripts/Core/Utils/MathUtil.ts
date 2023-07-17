class _MathUtil {
    toAngle(radian: number) {
        return 180 / Math.PI * radian;
    }

    toRadian(angle: number) {
        return Math.PI / 180 * angle;
    }

    /**范围随机取值 [min,max) */
    randomInt(min: number, max: number) {
        let d = Math.abs(max - min);
        let curMin = Math.min(min, max);
        return Math.floor(Math.random() * d + curMin);
    }

    /**范围随机取值 [min,max) */
    randomFloat(min: number, max: number) {
        let d = Math.abs(max - min);
        let curMin = Math.min(min, max);
        return Math.random() * d + curMin;
    }

    randomElementFromArray<T>(arr: Array<T>, startIdx: number = 0, endIdx: number = arr.length - 1) {
        let idx = this.randomInt(startIdx, endIdx);
        idx = Math.max(idx, 0);

        return arr[idx];
    }

    /**
     * 获取两个向量间的夹角
     * @param vec1 
     * @param vec2 
     * @returns 
     */
    getABAngle2D(vec1: cc.Vec2 | cc.Vec3, vec2: cc.Vec2 | cc.Vec3 = null) {
        if (vec2 == null) {
            vec2 = cc.v3(1, 0, 0);
        }
        let ab = cc.Vec2.dot(vec1, vec2);
        let abLen = vec1.len() * vec2.len();
        let cosab = ab / abLen;

        let radians = Math.acos(cosab);
        return MathUtil.toAngle(radians);
    }

    getVectorAngle2D_1(vec1: cc.Vec2) {
        let angle = MathUtil.toAngle(Math.atan2(vec1.y, vec1.x));
        return angle;
    }

    clamp(n: number, min: number, max: number) {
        return Math.max(min, Math.min(max, n));
    }

    toVec2(v: cc.Vec3) {
        return cc.v2(v.x, v.y);
    }

    toVec3(v: cc.Vec2, z: number = 0) {
        return cc.v3(v.x, v.y, z);
    }

    /**
     * 计算垂直目标向量的向量
     * @param v 目标向量
     */
    calcPerpendicularVec2(v: cc.Vec2) {
        return cc.v2(-v.y, v.x);
    }

}

export const MathUtil = new _MathUtil();
