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
}

export const MathUtil = new _MathUtil();
