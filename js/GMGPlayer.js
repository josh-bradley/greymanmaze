var GMGPlayer = (function(){
    function GMGPlayer(state, x, y, sprite){
        Phaser.Sprite.call(this, state.game, x, y, sprite);

        this.game = state.game;

        this.game.physics.arcade.enable(this);

        this.mover = new GMGSpriteMover(state, this);
    };

    GMGPlayer.prototype = Object.create(Phaser.Sprite.prototype);
    GMGPlayer.prototype.constructor = GMGPlayer;

    GMGPlayer.prototype.tryToMoveTowards = function(direction){
        this.mover.moveTowards(direction);
    };

    return GMGPlayer;
})();