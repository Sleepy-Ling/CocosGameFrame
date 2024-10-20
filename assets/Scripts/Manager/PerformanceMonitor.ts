import ManagerBase from "./ManagerBase";

/**fps 监控器 */
export class PerformanceMonitor extends ManagerBase {
    private lastTime: number = 0;
    private frameCount: number = 0;
    private fps: number = 0;

    update(dt: number) {
        this.frameCount++;
        const now = Date.now();
        if (now - this.lastTime > 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
            // console.log(`Current FPS: ${this.fps}`);
        }
    }

    isBusy(): boolean {
        return this.fps < 30; // 假设帧率低于30就认为系统繁忙
    }
}
