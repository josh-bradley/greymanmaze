var GMGBadGuy = (function(){
    function GMGBadGuy(state, x, y, sprite){
        Phaser.Sprite.call(this, state.game, x, y, sprite);

        this.game = state.game;
        this.state = state;

        this.game.physics.arcade.enable(this);

        this.mover = new GMGSpriteMover(state, this);

        this.moveQueue = [Phaser.LEFT, Phaser.DOWN, Phaser.RIGHT, Phaser.UP];
        this.lastVisitedTile = -1;
        this.tilesVisited = {};
        this.lastDirection = Phaser.NONE;
        this.moveQueueIndex = Phaser.LEFT;
        this.lastDirectionIdx = -1;
    };

    GMGBadGuy.prototype = Object.create(Phaser.Sprite.prototype);
    GMGBadGuy.prototype.constructor = GMGBadGuy;

    GMGBadGuy.prototype.move = function(){
        var marker = {};
        marker.x = this.state.math.snapToFloor(Math.floor(this.x), this.state.gridsize) / this.state.gridsize;
        marker.y = this.state.math.snapToFloor(Math.floor(this.y), this.state.gridsize) / this.state.gridsize;

        var currentTileIdx = marker.x + marker.y * this.state.map.width;
        var newTile = currentTileIdx !== this.lastVisitedTile;

        if (newTile) {
            this.moveQueueIndex = (this.lastDirectionIdx + 1) % 4;
            //if ((this.tilesVisited[currentTileIdx] || this.tilesVisited[currentTileIdx] === 0)) {
            //    this.moveQueueIndex = this.tilesVisited[currentTileIdx];
            //    if (newTile) {
            //        this.moveQueueIndex = (1 + this.moveQueueIndex) % 4;
            //    }
            //} else {
            //    this.moveQueueIndex = this.lastDirectionIdx === 2 ? 1 : 0;
            //}

            for (var i = 0; i < 4; i++) {
                var idx = (this.moveQueueIndex + i) % 4;
                var direction = this.moveQueue[idx];
                if (this.mover.isTileInDirectionEmpty(direction, marker)) {
                    this.mover.moveTowards(direction);
                    this.tilesVisited[this.lastVisitedTile] = this.lastDirectionIdx;
                    this.lastDirectionIdx = idx;
                    this.lastDirection = direction;
                    break;
                }
            }
        } else {
            this.mover.moveTowards(this.lastDirection);
        }

        this.lastVisitedTile = currentTileIdx;
    };

    return GMGBadGuy;
})();