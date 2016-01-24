var GMGCollectable = (function(){
    function GMGCollectable(game, x, y, sprite){
        console.log('did this get called')
        Phaser.Sprite.call(this, game, x, y, sprite);
        this.game = game;

        this.game.physics.arcade.enable(this);
        this.enableBody = true;

        this.body.gravity.y = 200;
    }

    GMGCollectable.prototype = Object.create(Phaser.Sprite.prototype);
    GMGCollectable.prototype.constructor = GMGCollectable;

    return GMGCollectable;
})();