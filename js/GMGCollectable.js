var GMGCollectable = (function(){
    function GMGCollectable(state, x, y, sprite){
        Phaser.Sprite.call(this, state.game, x, y, sprite);
        this.game = state.game;

        this.game.physics.arcade.enable(this);
        this.anchor.set(0.5);
        this.enableBody = true;
        this.body.gravity.y = 0;
        this.frozen = true;
    }

    GMGCollectable.prototype = Object.create(Phaser.Sprite.prototype);
    GMGCollectable.prototype.constructor = GMGCollectable;

    GMGCollectable.prototype.freeze = function(){
        this.body.gravity.y = 0;
        this.frozen = true;
    };

    GMGCollectable.prototype.unfreeze = function(){
        this.body.gravity.y = 200;
        this.frozen = false;
    };

    return GMGCollectable;
})();