/**
 * 按格式转换时间字符串
 * @param time 秒
 * @returns 
 */
class _StringUtil {
    public timeToStr(time: number) {
        let seconds = time % 60;
        let minute = Math.floor(time / 60);

        let param = [minute, seconds];
        let str = "{0}:{1}";
        let exp = /{\d}/g;
        let arr = str.match(exp);
        for (let i = 0; i < arr.length; i++) {
            let replace = param[i] < 10 ? '0' + param[i] : param[i].toString();
            str = str.replace(arr[i], replace);
        }

        return str;

    }

    public millionTimeToStr(mTime: number) {
        let time = mTime / 1000;
        let seconds = Math.floor(time) % 60;
        let minute = Math.floor(time / 60) % 60;
        let hour = Math.floor(time / 3600);
        let param = [hour, minute, seconds];
        let str = "{0}:{1}:{2}";
        let exp = /{\d}/g;
        let arr = str.match(exp);
        for (let i = 0; i < arr.length; i++) {
            let replace = param[i] < 10 ? '0' + param[i] : param[i].toString();
            str = str.replace(arr[i], replace);
        }
        return str;
    }


    /**
     * 简化数字 （满足某位数简写成 数字+单位， 1000 -> 1k  10000 -> 1w)
     * @param num 需要简化的数字
     * @param minimumDigits 需要简化的最小位数 默认值为4。 4：则代表需要简化到千位，5：则代表简化到万位
     * @param fractionDigits 保留小数位 默认值为0。
     * @param signs 标识符
     */
    public simplifyNumbers(num: number, minimumDigits: number = 4, fractionDigits: number = 0, signs: string[] = ['k', 'w']) {
        if (minimumDigits < 4) {
            return num.toString();
        }

        if (num < 1000) {
            return num.toString();
        }

        let baseNum: number = Math.pow(10, minimumDigits - 1);
        let result: number = num / baseNum;

        let signIdx: number = 0;

        if (result >= 10) {
            for (let i = 1; i < signs.length; i++) {
                result /= 10;
                signIdx++;
            }

        }

        let sign = signs[signIdx];
        return result.toFixed(fractionDigits) + sign;
    }

}

export const StringUtil = new _StringUtil();
