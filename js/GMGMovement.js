var GMGSpriteMover = (function(){
    function GMGSpriteMover(state, sprite) {
        this.speed = 100;
        this.threshold = 5;
        this.state = state;
        this.sprite = sprite;
        this.marker = new Phaser.Point();
        this.turnPoint = new Phaser.Point();
        this.gridsize = state.gridsize;

        this.directions = [ null, null, null, null, null ];
        this.opposites = [ Phaser.NONE, Phaser.RIGHT, Phaser.LEFT, Phaser.DOWN, Phaser.UP ];

        this.tileGetters = [null, this.state.map.getTileLeft, this.state.map.getTileRight, this.state.map.getTileAbove, this.state.map.getTileBelow];

        this.current = Phaser.NONE;
        this.turning = Phaser.NONE;

        this.isTileInDirectionEmpty = function(direction, marker){
            return this.isTileEmpty(this.tileGetters[direction], marker);
        };

        this.isTileEmpty = function(tileGetter, marker){
            var tile = tileGetter.call(this.state.map, this.state.baseLayer.index, marker.x, marker.y);
            if (tile.index !== 49) {
                return false;
            }

            tile = tileGetter.call(this.state.map, this.state.blockAllLayer.index, marker.x, marker.y);

            if (tile.index > 0) {
                return false;
            }

            tile = tileGetter.call(this.state.map, this.state.blockNonPlayerLayer.index, marker.x, marker.y);

            if (tile.index > 0) {
                return false;
            }

            return true;
        };

        this.getDirections = function(){
            // Where are you? What grid element.
            this.marker.x = this.state.math.snapToFloor(Math.floor(this.sprite.x), this.gridsize) / this.gridsize;
            this.marker.y = this.state.math.snapToFloor(Math.floor(this.sprite.y), this.gridsize) / this.gridsize;

            //  Update our grid sensors
            this.directions[1] = this.state.map.getTileLeft(this.state.baseLayer.index, this.marker.x, this.marker.y);
            this.directions[2] = this.state.map.getTileRight(this.state.baseLayer.index, this.marker.x, this.marker.y);
            this.directions[3] = this.state.map.getTileAbove(this.state.baseLayer.index, this.marker.x, this.marker.y);
            this.directions[4] = this.state.map.getTileBelow(this.state.baseLayer.index, this.marker.x, this.marker.y);

            return this.directions;
        };

        this.checkDirection = function (turnTo) {

            if (this.turning === turnTo || this.directions[turnTo] === null)
            {

                //  Invalid direction if they're already set to turn that way
                //  Or there is no tile there, or the tile isn't index a floor tile
                return;
            }

            //  Check if they want to turn around and can
            if (this.current === this.opposites[turnTo])
            {
                this.move(turnTo);
            }
            else
            {
                this.turning = turnTo;

                this.turnPoint.x = (this.marker.x * this.gridsize) + (this.gridsize / 2);
                this.turnPoint.y = (this.marker.y * this.gridsize) + (this.gridsize / 2);
            }
        };

        this.turn = function () {

            var cx = Math.floor(this.sprite.x);
            var cy = Math.floor(this.sprite.y);

            // This needs a threshold, because at high speeds you can't turn because the coordinates skip past
            if (!this.state.math.fuzzyEqual(cx, this.turnPoint.x, this.threshold) || !this.state.math.fuzzyEqual(cy, this.turnPoint.y, this.threshold))
            {
                console.log("the fuck dude");
                return false;
            }

            // Correct the position of the player so it is right for the turn
            this.sprite.x = this.turnPoint.x;
            this.sprite.y = this.turnPoint.y;

            this.sprite.body.reset(this.turnPoint.x, this.turnPoint.y);

            this.move(this.turning);

            return true;

        };

        this.move = function (direction) {

            var speed = this.speed;

            if (direction === Phaser.LEFT || direction === Phaser.UP)
            {
                speed = -speed;
            }

            if (direction === Phaser.LEFT || direction === Phaser.RIGHT)
            {
                this.sprite.body.velocity.x = speed;
            }
            else
            {
                this.sprite.body.velocity.y = speed;
            }

            this.current = direction;

        };

        this.moveTowards = function(turnTo){
            if (this.current !== turnTo) {
                this.getDirections();
                this.checkDirection(turnTo);

                if (this.turning !== Phaser.NONE) {
                    this.turn();
                    this.turning = Phaser.NONE;
                }
            }

            return false;
        };
    }

    return GMGSpriteMover;
})();