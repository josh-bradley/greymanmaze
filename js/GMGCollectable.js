var GMGCollectable = (function(){
    function GMGCollectable(state, x, y, sprite){
        Phaser.Sprite.call(this, state.game, x, y, sprite);
        this.game = state.game;

        this.game.physics.arcade.enable(this);
        this.enableBody = true;

        this.body.gravity.y = 200;
    }

    GMGCollectable.prototype = Object.create(Phaser.Sprite.prototype);
    GMGCollectable.prototype.constructor = GMGCollectable;

    return GMGCollectable;
})();