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

}

export const StringUtil = new _StringUtil();
