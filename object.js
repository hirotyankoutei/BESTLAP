/**
 * 道路のオブジェクトの基本クラス
 * leftOrRight  -1:左、1:右
 */
phina.define('RoadObj', {
	// Spriteを継承
	superClass: 'Sprite',
	// 初期化
	init: function(image, sizeX, sizeY, startProgress, leftOrRight) {
		// 親クラスの初期化
		this.superInit(image, sizeX, sizeY);
		
		// プロパティの初期化
		this.x = 0;
		this.y = 0;
        this.sc = 0;
		this.roadMargin = 0.05;		// 道路とのマージン
		this.leftOrRight = leftOrRight;

		// オブジェクト生成時の progress の値
		this.startProgress  = startProgress ;

	},
	update: function(app) {

		// オブジェクトが道路に無い場合は削除する
		var roadInfoPosition = road.progress - this.startProgress;
		if (roadInfoPosition < 0) {
			// 道路が1週した場合を考慮
			roadInfoPosition = road.CMAX + road.progress - this.startProgress;
		}
		if (road.roadInfoArray[roadInfoPosition] == null) {
			this.remove();
			delete this;
            return;
		}

		// 道路情報を取得
		this.roadInfo = road.roadInfoArray[roadInfoPosition];

        // スケールを計算
        this.sc = 1.5 * this.roadInfo.uw / road.BOARD_W[0];

		// 動かす
		this.move();
		
	},
	// 敵を動かすメソッド	
	move: undefined		// 継承先で設定
	,
	// オブジェクトを道両脇に描画する位置を計算するメソッド
	DrawOnRoad: function () {
		// 道路からはみ出る割合
		// 左側
		var margin = -this.roadMargin;
		if (this.leftOrRight == 1) {
			// 右側
			margin = 1 + this.roadMargin;
		}
	
		// 割合から算出したＸ座標
		var tmpX = this.roadInfo.ux + this.roadInfo.uw * margin;
		// Ｙ座標
		var bottom = this.roadInfo.uy;
		// 画像の大きさを考慮して表示
		this.x = tmpX + (this.width * this.sc / 2) * this.leftOrRight;
		this.y = bottom - (this.height * this.sc / 2);
	},
 });


 /**
 * 花
 */
  phina.define('Flower', {
	// RoadObjを継承
	superClass: 'RoadObj',
	// 初期化
	init: function(startProgress, leftOrRight) {
		// 親クラスの初期化
		this.superInit('flower', 760, 36, startProgress, leftOrRight);

		this.roadMargin = 0.5;		// 道路とのマージン
	},
	// オブジェクトを動かすメソッド	
	move: function () {
        // スケールを設定(横方向はそのまま)
        this.setScale(1, this.sc);

        // 道路に表示
		var margin = -this.roadMargin;
		if (this.leftOrRight == 1) {
			// 右側
			margin = 1 + this.roadMargin;
		}	
		// 割合から算出したＸ座標
		var tmpX = this.roadInfo.ux + this.roadInfo.uw * margin;
		// Ｙ座標
		var top = this.roadInfo.uy;
		// 表示
		if (this.leftOrRight == 1) {
			this.left = tmpX;
		} else {
			this.right = tmpX;
		}
		this.y = top;
	},
 });


/**
 * 木
 */
 phina.define('Tree', {
	// RoadObjを継承
	superClass: 'RoadObj',
	// 初期化
	init: function(startProgress, leftOrRight) {
		// 親クラスの初期化
		this.superInit('tree', 470, 500, startProgress, leftOrRight);

		this.roadMargin = 0.05;		// 道路とのマージン
	},
	// オブジェクトを動かすメソッド	
	move: function () {
        // スケールを設定
        this.setScale(this.sc, this.sc);

        // 道路に表示
		this.DrawOnRoad();
	},
 });

/**
 * 看板
 */
 phina.define('Board', {
	// RoadObjを継承
	superClass: 'RoadObj',
	// 初期化
	init: function(image, startProgress, leftOrRight) {
		// 親クラスの初期化
		this.superInit(image, 300, 500, startProgress, leftOrRight);
        
		this.roadMargin = 0.1;		// 道路とのマージン
	},
	// オブジェクトを動かすメソッド	
	move: function () {
        // スケールを設定
        this.setScale(this.sc, this.sc);

        // 道路に表示
		this.DrawOnRoad();

	},
 });



