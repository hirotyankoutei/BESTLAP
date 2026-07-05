// PadConfigScene クラスを定義
phina.define('PadConfigScene', {
	superClass: 'DisplayScene',
    init: function() {
	  	this.superInit({
        // 大きさをメインシーンに合わせる
        width : mainScene.width,
        height : mainScene.height,
      });
      // 背景を黒にする
      this.backgroundColor = "rgb(0, 0, 0)";
      // メインシーンのキーコントローラーを取得
      this.keyController = mainScene.keyController;

      // 画面のパッドを表示する
      this.keyController.pad.addChildTo(this);
      this.keyController.button1.addChildTo(this);
      this.keyController.button2.addChildTo(this);

      // 画面上のボタン情報を配列に設定する
      this.buttons = [];
      this.buttons[0] = {
        nameLabel : Label("ギアUP（上）"),
        infoLabel : Label(),
        mappingInfo : this.keyController.gamepadMapping.upInfo,
      };
      this.buttons[1] = {
        nameLabel : Label("ギアDOWN（下）"),
        infoLabel : Label(),
        mappingInfo : this.keyController.gamepadMapping.downInfo,
      };
      this.buttons[2] = {
        nameLabel : Label("ハンドル左（左）"),
        infoLabel : Label(),
        mappingInfo : this.keyController.gamepadMapping.leftInfo,
      };
      this.buttons[3] = {
        nameLabel : Label("ハンドル右（右）"),
        infoLabel : Label(),
        mappingInfo : this.keyController.gamepadMapping.rightInfo,
      };
      this.buttons[4] = {
        nameLabel : Label("ブレーキ"),
        infoLabel : Label(),
        mappingInfo : this.keyController.gamepadMapping.button1Info,
      };
      this.buttons[5] = {
        nameLabel : Label("アクセル（決定）"),
        infoLabel : Label(),
        mappingInfo : this.keyController.gamepadMapping.button2Info,
      };

      // 各ボタンを画面に表示する
      let i;
      for (i = 0; i < this.buttons.length; i++) {
        // ボタン用ラベルの設定
        let nameLabel = this.buttons[i].nameLabel;
        nameLabel.fill = "rgb(255, 255, 255)";
        nameLabel.fontWeight = "bold";
        nameLabel.align = "left";
        nameLabel.addChildTo(this).setPosition(this.gridX.center(-6), this.gridY.span((i * 1) + 2));

        // 変更モードかどうかのフラグ
        this.buttons[i].isModifyMode = false;

        // パッド情報ラベルの設定
        let infoLabel = this.buttons[i].infoLabel;
        infoLabel.fontSize = 20;
        infoLabel.fill = "rgb(255, 255, 255)";
        infoLabel.fontWeight = "bold";
        infoLabel.align = "left";
        infoLabel.addChildTo(this).setPosition(this.gridX.center(0), this.gridY.span((i * 1) + 2));

        // 現在の設定内容を初期表示する
        infoLabel.text = this.createPadInfoString(this.buttons[i].mappingInfo);
      }

      // 戻るボタン（ラベル）
      this.returnButton = Label({
        text : "タイトルへ戻る",
        fill : "rgb(255, 255, 255)",
        fontWeight : "bold",
      }).addChildTo(this).setPosition(this.gridX.center(0), this.gridY.span((i * 1) + 3));

      // ボタンの先頭を選択状態にする
      this.selectButtonNo = 0;
      let button = this.buttons[0];
      button.nameLabel.stroke = "rgb(255, 255, 0)";

      this.count = 30;
    },

    update: function (app) {
      this.count--;
      // キーを取得（ゲームパッドからは取得しない）
      let keyState = mainScene.keyController.getState(app, false);
      if (keyState.isNotDirection && this.count < 20) {
        this.count = 0;
      } else {
        if (this.count < 0) {
          this.count = 0;
        }
      }
  
      if (this.count == 0) {
        // 画面上のボタンの選択処理
        this.selectButton(keyState);

        // ボタンが押された場合
        if (keyState.isButton1 || keyState.isButton2) {
          // 戻るボタン以外の場合
          if (this.selectButtonNo != this.buttons.length) {
            // 選択しているボタンを変更状態にする
            let button = this.buttons[this.selectButtonNo];
            button.isModifyMode = true;
            button.nameLabel.fill = "rgb(255, 15, 15)";


          } else {
            // 戻るボタンの場合、前画面に戻る
            // 画面のパッドを mainScene に戻す
            let controllerGroup = mainScene.group.controllerGroup;
            this.keyController.pad.addChildTo(controllerGroup);
            this.keyController.button1.addChildTo(controllerGroup);
            this.keyController.button2.addChildTo(controllerGroup);
            
            // タイトルボタンのカウンターを増やしてすぐにボタンが反応しないようにする
            mainScene.titleButtons.count = 30;
            // PadConfigSceneから抜ける
            this.exit();
          }
        }
      }

      // 選択されたボタンが変更モードの場合
      if (this.selectButtonNo != this.buttons.length 
          && this.buttons[this.selectButtonNo].isModifyMode) {
        // ゲームパッド情報の上書き
        this.modifyGamepadInfo(this.buttons[this.selectButtonNo]);
      }
  
    },

    // パッド情報の文字列を作成する
    // 戻り値:パッド情報の文字列
    createPadInfoString : function (mappingInfo) {
      // マッピング情報から表示する文字列を作成する
      let infoString;
      // パッドのインデックス
      infoString = String(mappingInfo.index) + "_";
      // デジタルかアナログかで処理を分ける
      if (mappingInfo.type == _ANALOG) {
        infoString += "ANALOG_";
        infoString += String(mappingInfo.button);
        switch (mappingInfo.direction) {
          case _VERTICAL_MINUS:
            infoString += "_VERTICAL_MINUS";
            break;
          case _VERTICAL_PLUS:
            infoString += "_VERTICAL_PLUS";
            break;
          case _HORIZONTAL_MIMUS:
            infoString += "_HORIZONTAL_MIMUS";
            break;
          case _HORIZONTAL_PLUS:
            infoString += "_HORIZONTAL_PLUS";
            break;
        }
      } else {
        infoString += "DIGITAL_";
        infoString += String(mappingInfo.button);
      }
      return infoString;
    },

    // 画面上のボタンの選択処理
    // keyState : キー状態
    selectButton : function(keyState) {
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
        // ボタンの選択位置を調整
        //（ボタンの数は、ボタン配列＋戻るボタン）
        if (this.selectButtonNo < 0) {
          this.selectButtonNo = this.buttons.length;
        }
        if (this.selectButtonNo > this.buttons.length) {
          this.selectButtonNo = 0;
        }
        // ボタンの表示を変更
        if (preSelectButtonNo != this.selectButtonNo) {
          // 選択中のボタンを未選択にする
          if (preSelectButtonNo != this.buttons.length) {
            let button = this.buttons[preSelectButtonNo];
            let nameLabel = button.nameLabel
            nameLabel.stroke = null;
            nameLabel.fill = "rgb(255, 255, 255)";
            // 変更モードを解除する
            button.isModifyMode = false;
          } else {
            this.returnButton.stroke = null;
            this.returnButton.fill = "rgb(255, 255, 255)";
          }

          // 新たに選択したボタンを選択中にする
          if (this.selectButtonNo != this.buttons.length) {
            let nameLabel = this.buttons[this.selectButtonNo].nameLabel
            nameLabel.stroke = "rgb(255, 255, 0)";
            nameLabel.fill = "rgb(255, 255, 255)";
          } else {
            this.returnButton.stroke = "rgb(255, 255, 0)";
            this.returnButton.fill = "rgb(255, 255, 255)";
          }

          // 連続で操作できないようにカウンターを設定
          this.count = 20;
        }
    },

    // ゲームパッドの情報を取得し、ゲームパッド情報を上書きする
    modifyGamepadInfo : function (button) {
      let padNo;
      let buttonNo;
      let direction;
      // デジタルかアナログかの情報
      let digitalOrAnalog = undefined;

      // gamepadManagerを取得
      const gamepadManager = this.keyController.gamepadManager;
      gamepadManager.update();

      // 接続されているパッド単位にループ
      PADLOOP: for (padNo = 0, end = gamepadManager._rawgamepads.length; padNo < end; padNo++) {
        // ゲームパッドが接続されているか確認
        if (!gamepadManager.isConnected(padNo)) {
          // 接続されていない場合は次のループへ
          continue;
        }

        // gamepad オブジェクトの取得
        const gamepad = gamepadManager.get(padNo);

        // どのボタンが押されているかの確認
        for (buttonNo = 0, end = gamepad.buttons.length; buttonNo < end; buttonNo++) {
          if (gamepad.getKey(buttonNo)) {
            // キーが押されている場合は全てのループを抜ける
            digitalOrAnalog = _DIGITAL;
            break PADLOOP;
          }
        }

        // どのアナログスティックが入力されているかの確認
        const duration = 0.5;
        for (buttonNo = 0, end = gamepad.sticks.length; buttonNo < end; buttonNo++) {
          // ボタンNo4は無視する
          if (buttonNo == 4) {
            continue;
          }
          let analog = gamepad.getStickDirection(buttonNo);
          // 入力されている場合は全てのループを抜ける
          if (analog.x > duration) {
            digitalOrAnalog = _ANALOG;
            direction = _HORIZONTAL_PLUS;
            break PADLOOP;
          } else if (analog.x < -duration) {
            digitalOrAnalog = _ANALOG;
            direction = _HORIZONTAL_MIMUS;
            break PADLOOP;
          } else if (analog.y > duration) {
            digitalOrAnalog = _ANALOG;
            direction = _VERTICAL_PLUS;
            break PADLOOP;
          } else if (analog.y < -duration) {
            digitalOrAnalog = _ANALOG;
            direction = _VERTICAL_MINUS;
            break PADLOOP;
          }
        }

      }

      // ボタンかアナログスティックの情報を取得できている場合
      if (digitalOrAnalog !== undefined) {
        // パッド情報を更新する
        const mappingInfo = button.mappingInfo;
        mappingInfo.index = padNo;

        if (digitalOrAnalog == _DIGITAL) {
          // デジタルの場合
          mappingInfo.type = _DIGITAL;
          mappingInfo.button = buttonNo;
        } else if (digitalOrAnalog == _ANALOG){
          // アナログの場合
          mappingInfo.type = _ANALOG;
          mappingInfo.button = buttonNo;
          mappingInfo.direction = direction;
        }

        // 画面に反映する
        button.infoLabel.text = this.createPadInfoString(mappingInfo);
      }

    },


});
