import { Enum_GameState } from "../Def/EnumDef";
import { CustomEvents } from "../Event/CustomEvents";
import { EventDispatcher } from "../Event/EventDispatcher";

class _GameViewController {
    //控制的游戏界面
    // protected gameView:GameView;

    private _gameState: Enum_GameState;
    public get gameState(): Enum_GameState {
        return this._gameState;
    }
    public set gameState(value: Enum_GameState) {
        this._gameState = value;
    }

    /**根据游戏数据初始化 */
    public init(gameInfo?: unknown) {
        EventDispatcher.OffAllListenOfTarget(this);

        //切换后台会暂停游戏
        // EventDispatcher.Listen(CustomEvents.GameHideInBackground, this.pauseGameToBackground, this);
        // EventDispatcher.Listen(CustomEvents.GameShowFromBackground, this.resumeGameFromBackground, this);
    }

    /**外部调用开始游戏接口 */
    public startGame() {

    }

    /**初始化结束检测方法 */
    public onInitFinishCheck() {

    }

    /**初始化完成方法 */
    protected async onInitDone() {

    }

    /**暂停游戏 */
    public pauseGame() {
        if (this._gameState == Enum_GameState.Gaming) {
            this.pauseGame();
        }

        this._gameState ^= Enum_GameState.GamePause;

    }

    /**恢复游戏（从暂停状态） */
    public resumeGame() {
        this._gameState ^= Enum_GameState.GamePause;

        if (this._gameState == Enum_GameState.Gaming) {
            this.resumeGame();
        }
    }

    /**切换到前台恢复游戏 */
    protected resumeGameFromBackground() {
        this._gameState ^= Enum_GameState.GamePauseOnBackgroud;

        if (this._gameState == Enum_GameState.Gaming) {
            this.resumeGame();
        }
    }

    /**切换到后台暂停游戏 */
    protected pauseGameToBackground() {
        if (this._gameState == Enum_GameState.Gaming) {
            this.pauseGame();
        }

        this._gameState ^= Enum_GameState.GamePauseOnBackgroud;
    }

    /**外部调用关闭游戏接口 */
    public closeGameView() {
        EventDispatcher.OffAllListenOfTarget(this);

    }

}

export const GameViewController = new _GameViewController();

enum Enum_InitState {
    None = 0,
}