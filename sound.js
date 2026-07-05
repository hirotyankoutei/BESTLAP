// エンジン音
var EngineSound = {
    init: function() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.ctx.resume();
        this.gainNode = this.ctx.createGain();
        this.oscillator = this.ctx.createOscillator();
        this.depth = this.ctx.createGain();
        this.isPlaying = false;
    },
    play: function() {
        if (this.isPlaying) {
            return;
        }
        // 波形をのこぎり派に
        this.oscillator.type = "sawtooth";
        this.oscillator.frequency.value = 20
        this.oscillator.connect(this.gainNode).connect(this.ctx.destination);
        // 音量の初期値
        this.gainNode.gain.value = 0.5;
        this.oscillator.start();      

        isPlaying = true;        
    },
    acceleration: function(speed) {
        this.oscillator.frequency.value = 20 + speed / 5;
    },
};


