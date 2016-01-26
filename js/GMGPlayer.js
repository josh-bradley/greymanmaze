var GMGPlayer = (function(){
    function GMGPlayer(state, x, y, sprite){
        Phaser.Sprite.call(this, state.game, x, y, sprite);

        this.game = state.game;

        this.game.physics.arcade.enable(this);
        this.anchor.set(0.5);
        this.mover = new GMGSpriteMover(state, this);
        this.dead = false;


        this.animations.add('run', [0, 1, 2, 1], 10, true);
        this.animations.add('die', [5], 10, true);
    };

    GMGPlayer.prototype = Object.create(Phaser.Sprite.prototype);
    GMGPlayer.prototype.constructor = GMGPlayer;

    GMGPlayer.prototype.tryToMoveTowards = function(direction){
        this.mover.moveTowards(direction);
        this.animations.play('run');
    };

    GMGPlayer.prototype.update = function(){
        if (this.body.velocity.x === 0 && this.body.velocity.y === 0) {
            this.animations.stop();
        }
    };

    GMGPlayer.prototype.die = function(){
        this.body.velocity.x = 0;
        this.body.velocity.y = 0;
        this.animations.play('die');
        this.dead = true;
    };

    return GMGPlayer;
})();