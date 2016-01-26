var game = new Phaser.Game(500, 500, Phaser.AUTO, 'game');

var COLLECTABLE_TYPE = 'diamond';
var BAD_GUY_TYPE = 'badGuy';
var PLAYER_START_TYPE = 'playerStart';

var PhaserGame = function (game) {
    this.map = null;
    this.baseLayer = null;
    this.player = null;

    this.safetile = 2;
    this.dirtTile = 310;
    this.gridsize = 16;
    this.gameOver = false;

    this.marker = new Phaser.Point();
};

PhaserGame.prototype = {

    init: function () {

        this.physics.startSystem(Phaser.Physics.ARCADE);

    },

    preload: function () {

        //scaling options
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        //this.load.tilemap('level1', 'assets/greymanmaze.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.tilemap('level1', 'assets/dropdiamonds.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.image('tiles', 'assets/tiles.png');
        this.load.image('diamond', 'assets/diamond.png');
        this.load.spritesheet('player', 'assets/player.png', 16, 16);
        this.load.spritesheet('badGuy', 'assets/badGuy.png', 16, 16);
    },

    create: function () {

        this.tempFrozen = [];
        this.map = this.add.tilemap('level1');
        this.map.addTilesetImage('tiles', 'tiles');

        //create layer
        this.baseLayer = this.map.createLayer('backgroundLayer');
        this.blockAllLayer = this.map.createLayer('blockAllLayer');
        this.blockNonPlayerLayer = this.map.createLayer('blockNonPlayerLayer');

        //collision on blockedLayer
        this.map.setCollision(223, true, this.baseLayer);
        this.map.setCollision(223, true, this.blockAllLayer);
        this.map.setCollision([310, 49], true, this.blockNonPlayerLayer);


        //resizes the game world to match the layer dimensions
        this.baseLayer.resizeWorld();

        //create player
        this.playerGroup = this.game.add.group();
        var result = this.findObjectsByType(PLAYER_START_TYPE, this.map, 'objectsLayer');
        this.player = this.createFromTiledObject(result[0], GMGPlayer);
        this.playerGroup.addChild(this.player);

        this.diamonds = this.game.add.group();
        this.diamonds.enableBody = true;
        this.createItems(COLLECTABLE_TYPE, GMGCollectable, this.diamonds);
        this.game.physics.arcade.enable(this.diamonds);

        this.badGuys = this.game.add.group();
        this.badGuys.enableBody = true;
        this.createItems(BAD_GUY_TYPE, GMGBadGuy, this.badGuys);
        this.game.physics.arcade.enable(this.badGuys);

        this.game.camera.follow(this.player);

        this.cursors = this.input.keyboard.createCursorKeys();
    },

    createItems: function(type, constructor, group) {
        //create items
        var result = this.findObjectsByType(type, this.map, 'objectsLayer');
        result.forEach(function(element){
            var sprite = this.createFromTiledObject(element, constructor);
            group.addChild(sprite);
        }, this);
    },

    createFromTiledObject: function(element, constructor) {
        var sprite = new constructor(this, this.correctCoordinate(element.x), this.correctCoordinate(element.y), element.properties.sprite);

        //copy all properties to the sprite
        Object.keys(element.properties).forEach(function(key){
            sprite[key] = element.properties[key];
        });

        return sprite;
    },

    correctCoordinate: function(r){
        var d = Math.floor(r / 16);
        var p = r % 16;
        if (p > 8) {
            d += 1;
        }

        return 16 * d + 8;
    },

    //find objects in a Tiled layer that containt a property called "type" equal to a certain value
    findObjectsByType: function(type, map, layer) {
        var result = new Array();
        map.objects[layer].forEach(function(element){
            if(element.properties.type === type) {
                //Phaser uses top left, Tiled bottom left so we have to adjust
                //also keep in mind that the cup images are a bit smaller than the tile which is 16x16
                //so they might not be placed in the exact position as in Tiled
                element.y -= map.tileHeight;
                result.push(element);
            }
        });
        return result;
    },



    checkKeys: function () {

        if (this.gameOver) {
            return false;
        }
        if (this.cursors.left.isDown)
        {
            this.player.tryToMoveTowards(Phaser.LEFT);
        }
        else if (this.cursors.right.isDown)
        {
            this.player.tryToMoveTowards(Phaser.RIGHT);
        }
        else if (this.cursors.up.isDown)
        {
            this.player.tryToMoveTowards(Phaser.UP);
        }
        else if (this.cursors.down.isDown)
        {
            this.player.tryToMoveTowards(Phaser.DOWN);
        }
    },

    playerHitsDiamond: function(diamond, player){
        if (!player.dead) {
            if (!diamond.body.onFloor() && diamond.body.velocity.y > 0 && player.y > diamond.y) {
                player.die();
                this.gameOver = true;
            } else {
                diamond.kill();
            }
        }
    },

    playerHitsBadGuy: function(player, badGuy){
        if (!badGuy.dead) {
            player.die();
            this.gameOver = true;
        }
    },

    diamondsHitsBadGuy: function(diamond, badGuy){
        if (!badGuy.dead && diamond.body.velocity.y > 0 && badGuy.y > diamond.y) {
            this.badGuyDeath(badGuy);
        }
    },

    badGuyDeath: function(badGuy){
        badGuy.die();
        var newDiamondCount = 0;

        this.createNewObject(badGuy.x - 16, badGuy.y, 'diamond', GMGCollectable, this.diamonds) && newDiamondCount++;
        this.createNewObject(badGuy.x + 16, badGuy.y, 'diamond', GMGCollectable, this.diamonds) && newDiamondCount++;
        this.createNewObject(badGuy.x, badGuy.y - 16, 'diamond', GMGCollectable, this.diamonds) && newDiamondCount++;
        this.createNewObject(badGuy.x, badGuy.y + 16, 'diamond', GMGCollectable, this.diamonds) && newDiamondCount++;
    },

    createNewObject: function(x, y, sprite, constructor, group) {
        var tileX = this.math.snapToFloor(Math.floor(x), this.gridsize) / this.gridsize;
        var tileY = this.math.snapToFloor(Math.floor(y), this.gridsize) / this.gridsize;
        var obj;
        if (tileX !== 0 && tileY !== 0 && tileX !== this.map.width - 1 && tileY !== this.length - 1) {
            var tileForDiamond = this.map.getTile(tileX, tileY, this.blockNonPlayerLayer.index);

            if (tileForDiamond && tileForDiamond.index === this.dirtTile ) {
                this.map.removeTile(tileForDiamond.x, tileForDiamond.y, this.blockNonPlayerLayer);
            }
            obj = new constructor(this, this.correctCoordinate(tileX * 16), this.correctCoordinate(tileY * 16), sprite);
            group.addChild(obj);
        }

        return obj;
    },

    update: function () {

        this.physics.arcade.collide(this.playerGroup, this.baseLayer);
        this.physics.arcade.collide(this.playerGroup, this.blockAllLayer);
        this.physics.arcade.collide(this.diamonds, this.baseLayer);
        this.physics.arcade.collide(this.diamonds, this.blockAllLayer);
        this.physics.arcade.collide(this.diamonds, this.blockNonPlayerLayer);
        this.physics.arcade.collide(this.diamonds, this.diamonds);


        //this.physics.arcade.overlap(this.playerGroup, this.blockNonPlayerLayer, this.playerHitsNonPlayerLayer, null, this);
        this.physics.arcade.overlap(this.diamonds, this.playerGroup, this.playerHitsDiamond, null, this);
        this.physics.arcade.overlap(this.playerGroup, this.badGuys, this.playerHitsBadGuy, null, this);
        this.physics.arcade.overlap(this.diamonds, this.badGuys, this.diamondsHitsBadGuy, null, this);

        this.checkKeys();

        // Where are you? What grid element.
        this.marker.x = this.math.snapToFloor(Math.floor(this.player.x), this.gridsize) / this.gridsize;
        this.marker.y = this.math.snapToFloor(Math.floor(this.player.y), this.gridsize) / this.gridsize;

        this.currentTile = this.map.getTile(this.marker.x, this.marker.y, this.blockNonPlayerLayer.index);

        this.player.update();
        this.diamonds.forEachAlive(this.unfreezeObjects, this);


        this.badGuys.forEachAlive(function(badGuy){
            badGuy.move();
        });
    },

    unfreezeObjects: function(obj){
        if (obj.frozen) {
            var playerBounds = this.player.getBounds();

            var objBounds = obj.getBounds();
            if (this.player.dead || playerBounds.left >= objBounds.right || playerBounds.right <= objBounds.left || playerBounds.top > objBounds.bottom + 8) {
                obj.unfreeze();

            }
        }
    },

    getTileIdFromPosition: function(x, y){
        var tileX = this.math.snapToFloor(Math.floor(x), this.gridsize) / this.gridsize;
        var tileY = this.math.snapToFloor(Math.floor(y), this.gridsize) / this.gridsize;

        return tileX + tileY * this.map.width;
    },

    render: function () {
        if (this.currentTile && this.currentTile.index === this.dirtTile ) {
            var tileAbovePlayerId = this.getTileIdFromPosition(this.player.x, this.player.y - 16);
            this.diamonds.forEachAlive(function(diamond){
               var diamondTileId = this.getTileIdFromPosition(diamond.x, diamond.y);

                if (diamondTileId === tileAbovePlayerId) {
                    diamond.freeze();
                }
            }, this);


            this.map.removeTile(this.currentTile.x, this.currentTile.y, this.blockNonPlayerLayer);
        }
    }

};

game.state.add('Game', PhaserGame, true);
