var GMGBadGuy = (function(){
    function GMGBadGuy(game, x, y, sprite){
        Phaser.Sprite.call(this, game, x, y, sprite);

        this.game = game;

        this.game.physics.arcade.enable(this);
    };

    GMGBadGuy.prototype = Object.create(Phaser.Sprite.prototype);
    GMGBadGuy.prototype.constructor = GMGBadGuy;

    return GMGBadGuy;
})();