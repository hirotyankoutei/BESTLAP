// ゲームパッド情報用定数
const _DIGITAL = 0;
const _ANALOG = 1;
const _HORIZONTAL_PLUS = 0;
const _HORIZONTAL_MIMUS = 1;
const _VERTICAL_PLUS = 3;
const _VERTICAL_MINUS = 4;


/*
 * キーコントローラークラス
 * 画面のパッドとキー入力、ゲームパッドを抽象化する
 */
phina.define("KeyController", {
    // 初期化
    init: function(pad, button1, button2, gamepadManager) {
        // パッド
        this.pad = pad;
        // ボタン1
        this.button1 = button1;
        // ボタン2
        this.button2 = button2;

        // ゲームパッド
        this.gamepadManager = gamepadManager;

        // ゲームパッドのマッピングの初期化
        //      index:          パッドのインデックス
        //		type:　　　     デジタルかアナログか
        //		button:         ボタンの番号
        //      direction:      アナログの方向
        this.gamepadMapping = {
            upInfo:         {index: 0, type: _ANALOG, button: 0, direction: _VERTICAL_MINUS},
            downInfo:       {index: 0, type: _ANALOG, button: 0, direction: _VERTICAL_PLUS},
            leftInfo:       {index: 0, type: _ANALOG, button: 0, direction: _HORIZONTAL_MIMUS},
            rightInfo:      {index: 0, type: _ANALOG, button: 0, direction: _HORIZONTAL_PLUS},
            button1Info:    {index: 0, type: _DIGITAL, button: 0},
            button2Info:    {index: 0, type: _DIGITAL, button: 1},
        };
    },

    // 状態取得
    // app: アプリケーションオブジェクト
    // useGamePadFlag: ゲームパッドを考慮するかどうかのフラグ　デフォルト true
    getState: function (app, useGamePadFlag = true) {
        // 状態保持用プロパティ
        var state = {
            isUp: false,
            isDown: false,
            isLeft: false,
            isRight: false,
            isButton1: false,
            isButton2: false,
            isNotDirection: false,
        };

        // 画面のパッドの状態を反映
        state.isUp = this.pad.isUp;
        state.isDown = this.pad.isDown;
        state.isLeft = this.pad.isLeft;
        state.isRight = this.pad.isRight;
        state.isButton1 = this.button1.isPress;
        state.isButton2 = this.button2.isPress;

        // キーボードの状態を反映
        var key = app.keyboard;
        if (key.getKey('up')) {
            state.isUp = true;
        }
        if (key.getKey('down')) {
            state.isDown = true;
        }
        if (key.getKey('left')) {
            state.isLeft = true;
        }
        if (key.getKey('right')) {
            state.isRight = true;
        }
        if (key.getKey('z')) {
            state.isButton1 = true;
        }
        if (key.getKey('x')) {
            state.isButton2 = true;
        }

        // ゲームパッドの状態を反映
        if (useGamePadFlag) {
            this.gamepadManager.update();
            if (this.getGamepadState(this.gamepadMapping.upInfo)) {
                state.isUp = true;
            }
            if (this.getGamepadState(this.gamepadMapping.downInfo)) {
                state.isDown = true;
            }
            if (this.getGamepadState(this.gamepadMapping.leftInfo)) {
                state.isLeft = true;
            }
            if (this.getGamepadState(this.gamepadMapping.rightInfo)) {
                state.isRight = true;
            }
            if (this.getGamepadState(this.gamepadMapping.button1Info)) {
                state.isButton1 = true;
            }
            if (this.getGamepadState(this.gamepadMapping.button2Info)) {
                state.isButton2 = true;
            }
        }

        // 方向キーを押していないかどうかを反映
        state.isNotDirection = !state.isUp && !state.isDown && !state.isLeft && !state.isRight;

        return state;
    },
    // ゲームパッドマッピング情報に対応するボタンの情報を取得
    getGamepadState: function(info) {
        let resultFlag = false;

        const gamepad = this.gamepadManager.get(info.index);
        if (info.type == _DIGITAL) {
            if (gamepad.getKey(info.button)) {
                resultFlag = true;
            }
        }else if (info.type == _ANALOG) {
            const duration = 0.5;
            let analog = gamepad.getStickDirection(info.button);

            switch (info.direction) {
                case _HORIZONTAL_PLUS:
                    if (analog.x > duration) {
                        resultFlag = true;
                    }
                    break;
                case _HORIZONTAL_MIMUS:
                    if (analog.x < -duration) {
                        resultFlag = true;
                    }
                    break;
                case _VERTICAL_PLUS:
                    if (analog.y > duration) {
                        resultFlag = true;
                    }
                    break;
                case _VERTICAL_MINUS:
                    if (analog.y < -duration) {
                        resultFlag = true;
                    }
                    break;
            }
        }

        return resultFlag;
    },
  });


/*
 * パッドクラス
 */
phina.define('Pad', {
	// Spriteを継承
	superClass: 'Sprite',
	// 初期化
	init: function(image, sizeX, sizeY) {
		// 親クラスの初期化
		this.superInit(image, sizeX, sizeY);

        // 表示初期化
        this.frameIndex = 0;
        this.isUp = false;
        this.isDown = false;
        this.isLeft = false;
        this.isRight = false;

        // タッチ可能にする
        this.setInteractive(true);

        // タッチされた際の処理
        this.onpointstart = function(e) {
            // 表示変更
            this.calculateDirection(e);
        };
        // タッチしたまま動かした際の処理
        this.onpointmove = function (e) {
            // 表示変更
            this.calculateDirection(e);
        };
        // タッチを離した際の処理
        this.onpointend = function() {
            // 表示初期化
            this.frameIndex = 0;
            this.isUp = false;
            this.isDown = false;
            this.isLeft = false;
            this.isRight = false;
        };
	},

    // タッチされた方向を計算する
    calculateDirection: function (e) {
        // 反応しない幅
        var space = 20;

        // タッチされた座標を取得
        var touchX = e.pointer.x;
        var touchY = e.pointer.y;

        // タッチされた方角を計算
        this.isUp = false;
        this.isDown = false;
        this.isRight = false;
        this.isLeft = false;
        if (touchY + space < this.y && (this.y - touchY) > Math.abs(this.x - touchX)) {
            this.isUp = true;
        }
        if (touchY - space > this.y && (touchY - this.y) > Math.abs(this.x - touchX)) {
            this.isDown = true;
        }
        if (touchX + space < this.x && (this.x - touchX) > Math.abs(this.y - touchY)) {
            this.isLeft = true;
        }
        if (touchX - space > this.x && (touchX - this.x) > Math.abs(this.y - touchY)) {
            this.isRight = true;
        }

        // タッチされた方向に画像を変更
        if (this.isUp && this.isRight) {
            this.frameIndex = 2;
            this.rotation = 0;
        } else if (this.isRight && this.isDown) {
            this.frameIndex = 2;
            this.rotation = 90;
        } else if (this.isDown && this.isLeft) {
            this.frameIndex = 2;
            this.rotation = 180;
        } else if (this.isLeft && this.isUp) {
            this.frameIndex = 2;
            this.rotation = 270;
        } else if (this.isUp) {
            this.frameIndex = 1;
            this.rotation = 0;
        } else if (this.isRight) {
            this.frameIndex = 1;
            this.rotation = 90;
        } else if (this.isDown) {
            this.frameIndex = 1;
            this.rotation = 180;
        } else if (this.isLeft) {
            this.frameIndex = 1;
            this.rotation = 270;
        }
    },
 });

  


/*
 * ボタンクラス
 */
phina.define('PadButton', {
	// Spriteを継承
	superClass: 'Sprite',
	// 初期化
	init: function(image, sizeX, sizeY) {
		// 親クラスの初期化
		this.superInit(image, sizeX, sizeY);

        // 表示初期化
        this.frameIndex = 0;
        this.isPress = false;
        // タッチ可能にする
        this.setInteractive(true);        

        // タッチされた際の処理
        this.onpointstart = function() {
            // 表示変更
            this.frameIndex = 1;
            this.isPress = true;
        };
        // タッチを離した際の処理
        this.onpointend = function() {
            // 表示変更
            this.frameIndex = 0;
            this.isPress = false;
        };
	},

 });
