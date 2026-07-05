// phina.js をグローバル領域に展開
phina.globalize();
// 画面サイズ
var SC_WIDTH = 800;
var SC_HEIGHT = 600;

// ブラウザがカーソルキーでスクロールしないようにする。
window.addEventListener("keydown", function(e) {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

var ASSETS = {
	// 画像
	image: {
		pad: './image/pad.png',
		button: './image/button.png',
		title: './image/title.png',
		titleButton: './image/titleButton.png',
		car1: './image/car1.png',
		gear: './image/gear.png',
		smoke: './image/smoke.png',
	  	img_bg: './image/bg.png',
	  	flower: './image/flower.png',
	  	tree: './image/tree.png',
	  	board: './image/board.png',
	  	rightarrowboard: './image/rightarrowboard.png',
	  	leftarrowboard: './image/leftarrowboard.png',
	},
	// 音
	sound: {
		squeal: './sound/squeal.mp3',
		fastesttime: './sound/fastesttime.mp3',
		start1: './sound/start1.mp3',
		start2: './sound/start2.mp3',
	},
  };

// メインシーンを保持する変数
var mainScene;
// 道を保持する変数
var road;
// 自車を保持する変数
var myCar;

// initScene クラスを定義
phina.define('InitScene', {
	superClass: 'DisplayScene',
	init: function(option) {
		this.superInit(option);

		// 背景色を指定
		this.backgroundColor = "rgb(0, 0, 0)";

		// ラベルを設定
		Label({
			text:"画面をタッチ、またはクリックしてください。",
			fill:"white",
		}).addChildTo(this).setPosition(this.gridX.center(),this.gridY.center());

        // GamepadManager
        this.gamepadManager = phina.input.GamepadManager();

		// クリックイベント
		this.onclick = () => {
			// GamepadManagerの更新
			this.gamepadManager.update();
			// メインシーンへ切り替え
			this.exit({
				// GamepadManagerを引き渡す
				gamepadManager: this.gamepadManager,
			});
		};
	},
});


// MainScene クラスを定義
phina.define('MainScene', {
	superClass: 'DisplayScene',
	init: function(option) {
		this.superInit(option);
		// メインシーンを変数に格納
		mainScene = this;

		// 背景色を指定
		this.backgroundColor = "rgb(163, 219, 255)";

		// グループを生成する
		this.group = {
			// 背景用
			 backgroungGroup: DisplayElement().addChildTo(this),
			 // 道路用
			 roadGroup: DisplayElement().addChildTo(this),
			 // オブジェクト用
			 objGroup: DisplayElement().addChildTo(this),
			 // 自車用
			 myCarGroup: DisplayElement().addChildTo(this),
			 // インジケーター用
			 indicatorGroup: DisplayElement().addChildTo(this),
			 // コントローラー用
			 controllerGroup: DisplayElement().addChildTo(this),
		};
		// グループの大きさをこのシーンに合わせる
		for (var groupKey in this.group) {
			this.group[groupKey].width = this.width;
			this.group[groupKey].height = this.height;
		}

		// スピードメーター
		this.speedMeter = Label(
			{
				fill: "red",
				stroke: "white",
				strokeWidth: 5,
				fontFamily: "monospace",
			}
		).addChildTo(this.group.indicatorGroup).setPosition(this.gridX.span(14),this.gridY.center());
		this.updateSpeedMeter(0);
		// ラップタイム
		this.laptime  = Label(
			{
				fill: "navy",
				stroke: "white",
				strokeWidth: 5,
				fontFamily: "monospace",
			}
		).addChildTo(this.group.indicatorGroup).setPosition(this.gridX.center(),this.gridY.center(-3));
		this.updateLaptime(this.laptime, 0);

		// ラップタイムレコードを５つ作成
		this.laptimeRecord = [];
		for (let i = 0; i < 5; i++) {
			this.laptimeRecord[i] = Label(
				{
					fill: "black",
					stroke: "white",
					strokeWidth: 5,
					fontFamily: "monospace",
					text: "--------",
				}
			).addChildTo(this.group.indicatorGroup).setPosition(this.gridX.span(2),this.gridY.span(3 + i));
		}

		// BESTラップ
		Label(
			{
				fill: "green",
				stroke: "white",
				strokeWidth: 5,
				text: "Best Lap",
			}
		).addChildTo(this.group.indicatorGroup).setPosition(this.gridX.span(2),this.gridY.span(1));
		this.bestLap = Label(
			{
				fontWeight: "bold",
				fill: "green",
				stroke: "white",
				strokeWidth: 5,
				fontFamily: "monospace",
				text: "--------",
			}
		).addChildTo(this.group.indicatorGroup).setPosition(this.gridX.span(5),this.gridY.span(1));

		// ギア
		this.gear = Sprite("gear", 96, 96).addChildTo(this.group.indicatorGroup).setPosition(this.gridX.span(14), this.gridY.center(-2));
		this.gear.frameIndex = 0;

		// 背景を設定
		this.imgBg1 = Sprite("img_bg", 800, 800).addChildTo(this.group.backgroungGroup);
		this.imgBg1.left = 0;
		this.imgBg1.top = 0;
		this.imgBg2 = Sprite("img_bg", 800, 800).addChildTo(this.group.backgroungGroup);
		this.imgBg2.left = 0;
		this.imgBg2.top = 0;

		// 道を作成
		road = Road().addChildTo(this.group.roadGroup).setPosition(this.gridX.center(), this.gridY.center());

		// 自車を作成
		myCar = MyCar("car1", 210, 96).addChildTo(this.group.myCarGroup);

		// タイトルを表示
		this.title = Sprite("title", 600, 375).addChildTo(this.group.indicatorGroup).setPosition(this.gridX.center(), this.gridY.center(-3));
		this.isTitle = true;

		// スタートカウント
		this.gameStartFlag = false;
		this.startLabel = StartLabel().addChildTo(this.group.indicatorGroup).setPosition(this.gridX.center(),this.gridY.center(-2));
		this.startLabel.hide();

		// コントローラー
		this.group.controllerGroup.setInteractive(true);
		var pad = Pad("pad", 200, 200).addChildTo(this.group.controllerGroup).setPosition(this.gridX.span(2), this.gridY.span(13));
		var button1 = PadButton("button", 100, 100).addChildTo(this.group.controllerGroup).setPosition(this.gridX.span(12), this.gridY.span(13));
		var button2 = PadButton("button", 100, 100).addChildTo(this.group.controllerGroup).setPosition(this.gridX.span(15), this.gridY.span(13));
		this.keyController = KeyController(pad, button1, button2, option.gamepadManager);

		// タイトルボタンを作成
		this.titleButtons = TitleButtons(this);
	},
	update: function (app) {
		// タイトル表示中の場合
		if (this.isTitle) {
			// タイトルボタンを更新
			this.titleButtons.update(this, app);

			// スタートが選択された場合
			if (this.titleButtons.isStart) {
				// タイトルを隠す
				this.isTitle = false;
				this.title.hide();
				// タイトルボタンを隠す
				this.titleButtons.hide();

				// エンジン音を鳴らす
				EngineSound.init();
				EngineSound.play();

				// スタートカウント開始
				this.startLabel.show();
				this.startLabel.startTimer();
			
			// パッドコンフィグが選択された場合
			} else if (this.titleButtons.isPadconfig) {
				this.titleButtons.isPadconfig = false;
				// パッドコンフィグシーンに遷移
				app.pushScene(PadConfigScene());
			}


			return;
		}

		// ゲームが開始している場合
		if (this.gameStartFlag) {
			// ラップタイムを更新する
			var laptime = performance.now() - this.startTime;
			this.updateLaptime(this.laptime, laptime);
		}
	},
	updateSpeedMeter: function (val) {
		var val = ("   " + val).slice(-3) + " km/h";
		this.speedMeter.text = val;
	},
	updateLaptime: function (lavel, val) {
		// 分
		var minutes = Math.floor(val / 60000).toString().slice(-1);
		// 秒
		var seconds = ("00" + (Math.floor((val - (minutes * 60000)) / 1000))).slice(-2);
		// ミリ秒
		var millisecond = ("000" + (val - (minutes * 60000) - (seconds * 1000))).slice(-3);

		lavel.text = minutes + "'" + seconds + "." + millisecond;
	},
	updateLaptimeRecode: function() {
		// ラップタイム取得
		var laptime = this.laptime.text;
		var bestlap = this.bestLap.text;

		// ベストラップか判定
		var isBestlap = false;
		if (bestlap > laptime || bestlap == "--------") {
			isBestlap = true;
		}

		if (isBestlap) {
			// ファーステストタイム音を鳴らす
			SoundManager.play('fastesttime');
			// ベストラップを更新
			this.bestLap.text = laptime;
			// 20回点滅させる
			var tweener = this.bestLap.tweener;
			for (var i = 0; i < 20; i++) {
				tweener = tweener.fade(0,50);
				tweener = tweener.fade(1,50);
			}
			tweener.play();
		}

		// ラップタイムレコードを更新
		for (let i = 4; i > 0; i--) {
			this.laptimeRecord[i].text = this.laptimeRecord[i - 1].text;
			if (isBestlap) {
				// ベストラップの場合は黒
				this.laptimeRecord[i].fill = "black";
			} else {
				// ベストラップ以外は、色を引き継ぐ
				this.laptimeRecord[i].fill = this.laptimeRecord[i - 1].fill;
			}
		}

		// 1つめのラップタイムを更新
		this.laptimeRecord[0].text = laptime;
		if (isBestlap) {
			// ベストラップが出たときは赤
			this.laptimeRecord[0].fill = "red";
		} else {
			// ベストラップ以外は黒
			this.laptimeRecord[0].fill = "black";
		}
	},
});

// タイトルボタンクラス
phina.define('TitleButtons', {
	// 初期化
	init: function(mainScene) {
		// タイトルボタン作成
		this.buttons = [];
		// スタートボタン
		this.buttons[0] = Sprite("titleButton", 96, 32).addChildTo(mainScene.group.controllerGroup).setPosition(mainScene.gridX.center(), mainScene.gridY.center(+1));
		// スタートボタンを選択
		this.buttons[0].frameIndex = 1;
		this.selectButtonNo = 0;

		// パッドコンフィグボタン
		this.buttons[1] = Sprite("titleButton", 96, 32).addChildTo(mainScene.group.controllerGroup).setPosition(mainScene.gridX.center(), mainScene.gridY.center(+2));
		this.buttons[1].frameIndex = 4;

		this.count = 0;
		this.isStart = false;
		this.isPadconfig = false;
	},
	// 更新処理
	update: function(mainScene, app) {
		this.count--;
		// キーを取得
		let keyState = mainScene.keyController.getState(app);
		if (keyState.isNotDirection && this.count < 20) {
			this.count = 0;
		} else {
			if (this.count < 0) {
				this.count = 0;
			}
		}

		if (this.count == 0) {
			// 現在選択中のボタンを保持
			let preSelectButtonNo = this.selectButtonNo;
			// 上か左を押した場合
			if (keyState.isUp || keyState.isLeft) {
				this.selectButtonNo--;
			}
			// 下か右を押した場合
			if (keyState.isDown || keyState.isRight) {
				this.selectButtonNo++;
			}
			// タイトルボタンの選択位置を調整
			if (this.selectButtonNo < 0) {
				this.selectButtonNo = this.buttons.length - 1;
			}
			if (this.selectButtonNo >= this.buttons.length) {
				this.selectButtonNo = 0;
			}
			// タイトルボタンの表示を変更
			if (preSelectButtonNo != this.selectButtonNo) {
				// 選択中のボタンを未選択にする
				this.buttons[preSelectButtonNo].frameIndex--;
				// 新たに選択したボタンを選択中にする
				this.buttons[this.selectButtonNo].frameIndex++;
				this.count = 20;
			}


			if (keyState.isButton1 || keyState.isButton2) {
				// アクセルボタン または ブレーキボタン を押した場合、どのボタンが選択されているか判定する
				switch (this.selectButtonNo) {
					case 0:
						// スタートボタン
						this.isStart = true;
						break;
					case 1:
						this.isPadconfig = true;
						break;
				}
			}
		}

	},
	show: function() {
		this.buttons.forEach(button => {
			button.show();
		});
	},
	hide: function () {
		this.buttons.forEach(button => {
			button.hide();
		});
	},
});

// スタートをカウントするラベル
phina.define('StartLabel', {
	// Labelを継承
	superClass: 'Label',
	// 初期化
	init: function() {
		// 親クラスの初期化
		this.superInit({
			fontSize: 80,
			fontWeight: "bold",
			fill: "yellow",
			stroke: "white",
			strokeWidth: 5,
			fontFamily: "sans-serif",
		});

		// カウントの初期化
		this.counter = 3;
		this.text = this.counter;
	},

	// スタート処理
	startTimer: function() {
		// スタートカウントの音を鳴らす
		SoundManager.play('start1');
		// タイマーで処理を行う
		setTimeout(() => {this.timeUpdate();}, 1000);
	},

	// タイマーカウント処理
	timeUpdate: function () {
		if (this.counter > 1) {
			// カウンターを削減
			this.counter--;
			this.text = this.counter;
			// スタートカウントの音を鳴らす
			SoundManager.play('start1');
			// タイマーで処理を行う
			setTimeout(() => {this.timeUpdate();}, 1000);
		} else {
			// スタートカウントの音を鳴らす
			SoundManager.play('start2');
			// ゲーム開始
			mainScene.gameStartFlag = true;
			// ラップタイム計測開始
			mainScene.startTime = performance.now();
			// 非表示にする
			this.hide();
		}
	},
});

// 道クラス
phina.define('Road', {
	// PlainElementを継承
	superClass: 'PlainElement',
	// 初期化
	init: function() {
		// 親クラスの初期化
		this.superInit({
			width: mainScene.width,
			height: mainScene.height,
		});

		this.tmr = 0;
		// 道路の進み具合
		this.progress  = 0;
		this.vertical = 0;

		var CLEN = ROADDATA.length;

		var BOARD = 120;
		var CMAX = BOARD * CLEN;
		var curve = new Array(CMAX).fill(0);
		var updown = new Array(CMAX).fill(0);

		// 道路の板の基本形状を計算
		var BOARD_W = [];
		var BOARD_H = [];
		var BOARD_UD = [];
		for (var i = 0; i < BOARD; i++) {
			BOARD_W[i] = 10 + (BOARD - i) * (BOARD - i) / 12;
			BOARD_H[i] = 3.4 * (BOARD - i) /  BOARD;
			BOARD_UD[i] = 2 * Math.sin(Math.PI * i * 1.5 / 180);
		}

		// コースを生成
		for (var i = 0; i < CLEN; i++) {
			// カーブデータ取得
			var lr1 = ROADDATA[i][0];
			var lr2 = ROADDATA[(i + 1) % CLEN][0];
			// アップダウンデータ取得
			var ud1 = ROADDATA[i][1];
			var ud2 = ROADDATA[(i + 1) % CLEN][1];
			for (var j = 0; j < BOARD; j++) {
				var pos = j + BOARD * i;
				curve[pos] = lr1 * (BOARD - j) / BOARD + lr2 * j /BOARD;
				updown[pos] = ud1 * (BOARD - j) / BOARD + ud2 * j /BOARD;
			}
		}

		// 道路関係のプロパティ
		this.CMAX = CMAX;
		this.BOARD = BOARD;
		this.curve = curve;
		this.updown = updown;
		this.BOARD_W = BOARD_W;
		this.BOARD_H = BOARD_H;
		this.BOARD_UD = BOARD_UD;

		// 道路情報を保持する配列
		this.roadInfoArray = [];

		// 進んだ距離
		this.distance = 0;

		// 道路オブジェクトの初期表示
		for (var i = this.BOARD - 1; i >= 0; i--) {
			//  花
			if (i % 4 == 0) {
				var group = mainScene.group.objGroup;
				Flower(-i, 1).addChildTo(group);
				// 追加したオブジェクトを一番奥にする
				var obj = group.children.pop();
				group.children.unshift(obj);
				Flower(-i, -1).addChildTo(group);
				// 追加したオブジェクトを一番奥にする
				var obj = group.children.pop();
				group.children.unshift(obj);
			}

			// 看板
			if (i == this.BOARD - 50) {
				var group = mainScene.group.objGroup;
				Board('board', -i, 1).addChildTo(group);
				// 追加したオブジェクトを一番奥にする
				var obj = group.children.pop();
				group.children.unshift(obj);
				Board('board', -i, -1).addChildTo(group);
				// 追加したオブジェクトを一番奥にする
				var obj = group.children.pop();
				group.children.unshift(obj);
			}
		}

	},
	update: function(app) {
		
		// 車のスピードから道を進める量を計算する
		var progressValue = 0;
		var preDistance = Math.floor(this.distance);
		var speed = myCar.speed * 0.03;
		this.distance += speed;
		if (Math.floor(this.distance) - preDistance > 0) {
			progressValue = Math.floor(this.distance) - preDistance;
			this.distance = 0;
		}

		var tmpProgress = this.progress;
		this.progress  = (this.progress  + progressValue)  % this.CMAX;
		// 道路が一周した場合は、ラップタイムをリセットする
		if (tmpProgress > this.progress) {
			mainScene.startTime = performance.now();
			mainScene.updateLaptimeRecode();
		}

		// オブジェクトを作成するタイミングが含まれている場合は生成する
		for (var i = progressValue - 1; i >= 0; i--) {
			var startProgress = this.progress  - i;

			//  花
			if ((this.progress  - i) % 4 == 0) {
				var group = mainScene.group.objGroup;
				Flower(startProgress, 1).addChildTo(group);
				// 追加したオブジェクトを一番奥にする
				var obj = group.children.pop();
				group.children.unshift(obj);
				Flower(startProgress, -1).addChildTo(group);
				// 追加したオブジェクトを一番奥にする
				var obj = group.children.pop();
				group.children.unshift(obj);
			}

			// 配列の要素数算出
			var elementCount = Math.floor(this.progress / this.BOARD);
			// 左オブジェクト
			var objDataArray = [];
			objDataArray[0] = ROADDATA[elementCount][2];
			// 右オブジェクト
			objDataArray[1] = ROADDATA[elementCount][3];
			
			// 左、右順に処理を行う
			for (var arrayNo = 0; arrayNo  <= 1; arrayNo++) {
				// 左右の判断
				var leftRight = -1;
				if (arrayNo == 1) {
					leftRight = 1;
				}

				var objData = objDataArray[arrayNo];
				switch (objData) {
					// 木（少な目）
					case 1:
						if (startProgress % 32 == 0) {
							var group = mainScene.group.objGroup;
							Tree(startProgress, leftRight).addChildTo(group);
							// 追加したオブジェクトを一番奥にする
							var obj = group.children.pop();
							group.children.unshift(obj);
						}
						break;
					// 木（多め）
					case 2:
						if (startProgress % 12 == 0) {
							var group = mainScene.group.objGroup;
							Tree(startProgress, leftRight).addChildTo(group);
							// 追加したオブジェクトを一番奥にする
							var obj = group.children.pop();
							group.children.unshift(obj);
						}
						break;
					// 看板
					case 3:
						if (startProgress % 60 == 0) {
							var group = mainScene.group.objGroup;
							Board('board', startProgress, leftRight).addChildTo(group);
							// 追加したオブジェクトを一番奥にする
							var obj = group.children.pop();
							group.children.unshift(obj);
						}
						break;
					// 右カーブ看板
					case 4:
						if (startProgress % 60 == 0) {
							var group = mainScene.group.objGroup;
							Board('rightarrowboard', startProgress, leftRight).addChildTo(group);
							// 追加したオブジェクトを一番奥にする
							var obj = group.children.pop();
							group.children.unshift(obj);
						}
						break;
					// 左カーブ看板
					case 5:
						if (startProgress % 60 == 0) {
							var group = mainScene.group.objGroup;
							Board('leftarrowboard', startProgress, leftRight).addChildTo(group);
							// 追加したオブジェクトを一番奥にする
							var obj = group.children.pop();
							group.children.unshift(obj);
						}
						break;
				}
			}

		}

		this.drowLoad(app);
	},
	drowLoad : function (app) {
		// キャンバスの取得
		var canvas = this.canvas.context;
		// キャンバスをクリア
		canvas.clearRect(0, 0, this.width, this.height);

		// 描画用の道路のX座標と路面の高低を計算
		var di = 0;
		var ud = 0;
		var board_x = [];
		var board_di = [];
		var board_ud = [];
		for (var i = 0; i < this.BOARD; i++) {
			di += this.curve[(this.progress  + i) % this.CMAX];
			ud += this.updown[(this.progress  + i) % this.CMAX];
			board_x[i] = 400 - this.BOARD_W[i] * myCar.virtualX / 800 + di / 2;
			board_di[i] = di;
			board_ud[i] = ud / 30;
		}

		// 地平線の座標の計算
		var horizon = 400 + ud / 3;
		// 道路を描き始める位置
		var sy = horizon;

		// 背景の垂直位置
		this.vertical -= myCar.speed * di / 8000;
		if (this.vertical < 0) {
			this.vertical += 800;
		}
		if (this.vertical >= 800) {
			this.vertical -= 800;
		}
		mainScene.imgBg1.left = this.vertical - 799;
		mainScene.imgBg2.left = this.vertical;

		// 背景の水平位置
		var minUy = mainScene.height;

		// 描画用データをもとに道路を描く
		for (var i = this.BOARD - 1; i > 0; i--) {
			var ux = board_x[i];
			var uy = sy - this.BOARD_UD[i] * board_ud[i];
			var uw = this.BOARD_W[i];
			sy += this.BOARD_H[i] * (600 - horizon) / 200;
			var bx = board_x[i -1];
			var by = sy - this.BOARD_UD[i - 1] * board_ud[i -1] + 1;
			var bw = this.BOARD_W[i -1];
			var col = "rgb(160, 160, 160)";
			if ((this.progress  + i) % 30 <= 15) {
				col = "rgb(150, 150, 150)";
			}
			DrawTrapezoid(canvas, col, ux, uy, bx, by, uw, bw);

			// 背景の水平位置を計算
			if (minUy > uy) {
				minUy = uy;
			}

			// 左右の黄色線
			if ((this.progress  + i) % 20 <= 6) {
				DrawTrapezoid(canvas, "yellow", ux, uy, bx, by, uw * 0.02, bw * 0.02);
				DrawTrapezoid(canvas, "yellow", ux + uw * 0.98, uy, bx + bw * 0.98, by, uw * 0.02, bw * 0.02);
			}
			// 白線
			if ((this.progress  + i) % 20 <= 8) {
				DrawTrapezoid(canvas, "white", ux + uw * 0.24, uy, bx + bw * 0.24, by, uw * 0.02, bw * 0.02);
				DrawTrapezoid(canvas, "white", ux + uw * 0.49, uy, bx + bw * 0.49, by, uw * 0.02, bw * 0.02);
				DrawTrapezoid(canvas, "white", ux + uw * 0.76, uy, bx + bw * 0.76, by, uw * 0.02, bw * 0.02);
			}

			// 生成した情報を格納する
			this.roadInfoArray[this.BOARD - 1 - i] = {
				ux: ux,
				uy: uy,
				bx: bx,
				by: by,
				uw: uw,
				bw: bw,
				di: board_di[i],
			};

		}

		// 背景の水平位置を設定
		mainScene.imgBg1.y = minUy;
		mainScene.imgBg2.y = minUy;


	},
 });

 // 台形描画関数
 function DrawTrapezoid(canvas, col, ux, uy, bx, by, uw, bw) {
	// パスの太さを0にする
	canvas.lineWidth  = 0;
	// 描画色設定
	canvas.fillStyle = col;
	// パスを描画
	canvas.beginPath();
	canvas.moveTo(ux, uy);
	canvas.lineTo(ux+uw, uy);
	canvas.lineTo(bx+bw, by);
	canvas.lineTo(bx, by);
	canvas.fill();        // 4.Canvas上に描画する
 }
 
 // 自車クラス
 phina.define('MyCar', {
	// Spriteを継承
	superClass: 'Sprite',
	// 初期化
	init: function(image, sizeX, sizeY) {
		// 親クラスの初期化
		this.superInit(image, sizeX, sizeY);
		
		// プロパティの初期化
		this.x = 400;
		this.y = 522;
		// 自車のフレームの初期値
		this.frameIndex = 3;
		// スピード
		this.speed = 0;
		// エンジンの回転数
		this.rpm = 0;
		// ハンドルの曲がり具合（右がプラス左がマイナス）
		this.handle  = 0;
		// タイヤが滑る処理の間隔
		this.slideTime = 0;

		// 車の仮想的なX座標
		this.virtualX = 400;

		// 道路の取得位置
		this.rodePosition = road.BOARD - 10;

		// ギアの状態（0:Low 1:High）
		this.gear = 0;


	},
	update: function(app) {
		// タイトル表示中は処理をしない
		if (mainScene.isTitle) {
			return;
		}

		// ギアの定数
		const GEAR_LOW = 0;
		const GEAR_HIGH = 1;

		// スモークを出すかどうかのフラグ
		let isSmoke = false;

		// ハンドルを操作していない場合は、0に戻そうとする。
		if (this.handle < 0) {
			this.handle++;
		}
		if (this.handle > 0) {
			this.handle--;
		}

		// パッドとキーの状態を取得
		let keyState = mainScene.keyController.getState(app);
		// カーソルキー検知
		if (keyState.isLeft) {
			// ハンドルを左に切る
			this.handle-=2;
			if (this.handle < -100) {
				this.handle = -100;
			}
		}
		if (keyState.isRight) {
			this.handle+=2;
			// ハンドルを右に切る
			if (this.handle > 100) {
				this.handle = 100;
			}
		}
		if (keyState.isUp) {
			// ギアをLowにする
			this.gear = GEAR_LOW;
			mainScene.gear.frameIndex = GEAR_LOW;
		}
		if (keyState.isDown) {
			// ギアがLowの場合Highにする
			if (this.gear == GEAR_LOW) {
				this.gear = GEAR_HIGH;
				mainScene.gear.frameIndex = GEAR_HIGH;
				// スピードが上がりすぎている場合はスピードを落とす
				if (this.speed > 110) {
					this.speed -= 20;
					// スモークを出す
					isSmoke = true;
				}
			}
		}

		// アクセルブレーキ検知
		if (this.gear == GEAR_LOW && this.speed > 120) {
			this.speed -= 2;
			// スモークを出す
			isSmoke = true;
		} else if (keyState.isButton1) {
			this.speed -= 2;
			// スピードが出ている場合スモークを出す
			if (this.speed > 60) {
				isSmoke = true;
			}
		} else if (keyState.isButton2 && mainScene.gameStartFlag) {
			if (this.gear == GEAR_LOW) {
				this.speed += 1;
			} else {
				this.speed += 0.25;
			}
		} else {
			this.speed--;
		}
		if (this.speed < 0) {
			this.speed = 0;
		}
		if (this.speed > 300) {
			this.speed = 300;
		}

		// スピードから回転数を計算
		this.rpm = this.speed * ((1 - this.gear) * 4 + 4)



		// ハンドルの切り具合でイメージを変更
		var frameIndex = Math.trunc(this.handle * 3 / 50);
		if (Math.abs(frameIndex) > 3) {
			frameIndex = 3 * Math.sign(frameIndex);
		}
		this.frameIndex = frameIndex + 3;

		// スピードメーターを更新
		mainScene.updateSpeedMeter(Math.trunc(this.speed));
		// エンジン音を変更
		EngineSound.acceleration(this.rpm);

		// 道路情報を取得
		var roadInfo = road.roadInfoArray[this.rodePosition];

		// 車の位置を設定する
		this.bottom = roadInfo.by;
		
		// ハンドルによる移動量を計算
		var handleMove = this.handle * this.speed / 100;
		// 遠心力を計算(305キロで操作不能)
		var centrifugalForce = handleMove * this.speed / 305;
		// ハンドル移動量を遠心力を考慮して計算しなおし
		if (Math.abs(handleMove) < Math.abs(centrifugalForce)) {
			handleMove = 0;
		} else {
			handleMove -= centrifugalForce;
		}

		// カーブによる移動量を計算
		var curveMove = roadInfo.di * this.speed / 500;

		// 車の仮想的なX座標を計算
		this.virtualX += handleMove - curveMove;
		// 道をはみ出している場合の処理
		if (this.virtualX < 0 || this.virtualX > 800) {
			if (this.speed > 30) {
				this.speed -= 5;
				// スモークを出す
				isSmoke = true;
			}

			if (this.virtualX < -100) {
				this.virtualX = -100;
			} else if (this.virtualX > 900) {
				this.virtualX = 900;
			}
		}

		// 遠心力が一定の値を超える場合はスモークを出す
		if (Math.abs(centrifugalForce) > 50) {
			// スモークを出す
			isSmoke = true;
		}

		// スモークを出す処理
		if (isSmoke) {
			Smoke(app, this.x, this.rodePosition).addChildTo(mainScene.group.myCarGroup);
			if (this.slideTime % 5 == 0) {
				// スキール音を鳴らす
				SoundManager.play('squeal');
			}
			this.slideTime++;
		} else {
			this.slideTime = 0;
		}

	},
 });

 // スモーククラス
 phina.define('Smoke', {
	// Spriteを継承
	superClass: 'Sprite',
	// 初期化
	init: function(app, x, rodePosition) {
		// 親クラスの初期化
		this.superInit('smoke', 210, 96);
		
		this.rodePosition = rodePosition;
		this.startProgress = road.progress;
		this.frameIndex = app.frame % 2;

		// 道路情報を取得
		var roadInfo = road.roadInfoArray[rodePosition];

		// 初期位置を設定
		this.x = x;
		this.y = roadInfo.uy;

		// X座標の割合
		this.ratioX = (this.x - roadInfo.ux) / roadInfo.uw;


	},
	update: function(app) {
		// オブジェクトが道路に無い場合は削除する
		if (road.roadInfoArray[this.rodePosition + (road.progress - this.startProgress)] == null) {
			this.remove();
			delete this;
            return;
		}

		// 道路情報を取得
		var roadInfo = road.roadInfoArray[this.rodePosition + (road.progress - this.startProgress)];

        // スケールを計算
         var sc = 1.5 * roadInfo.uw / road.BOARD_W[0];

        // スケールを設定
        this.setScale(sc, sc);

        // 表示
        this.x = this.ratioX * roadInfo.uw + roadInfo.ux;
        this.y = roadInfo.uy;
	},
 });




// メイン処理
phina.main(function() {
	// アプリケーション生成
	var app = GameApp({
		fps: 60,	// FPS 60フレーム
		startLabel: 'init', // メインシーンから開始する
		scenes: [
			{
				className: 'InitScene',
				label: 'init',
				nextLabel: 'main',
		 	},
			{
				className: 'MainScene',
				label: 'main',
		 	},
		],
		// アセット読み込み
		assets: ASSETS,
		width: SC_WIDTH,
		height: SC_HEIGHT,
	});
	
	// アプリケーション実行
	app.run();
});
