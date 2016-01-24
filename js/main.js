var game = new Phaser.Game(500, 500, Phaser.AUTO, 'game');

var COLLECTABLE_TYPE = 'diamond';
var BAD_GUY_TYPE = 'badGuy';
var PLAYER_START_TYPE = 'playerStart';

var PhaserGame = function (game) {
    this.map = null;
    this.baseLayer = null;
    this.player = null;

    this.safetile = 2;
    this.dirtTile = 2644;
    this.gridsize = 16;


    this.marker = new Phaser.Point();
};

PhaserGame.prototype = {

    init: function () {

        this.physics.startSystem(Phaser.Physics.ARCADE);

    },

    preload: function () {

        //scaling options
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.load.tilemap('level1', 'assets/greymanmaze.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.image('tiles', 'assets/tiles.png');
        this.load.image('diamond', 'assets/diamond.png');
        this.load.spritesheet('player', 'assets/player.png', 16, 16);
        this.load.spritesheet('badGuy', 'assets/badGuy.png', 16, 16);
    },

    create: function () {

        this.map = this.add.tilemap('level1');
        this.map.addTilesetImage('tiles', 'tiles');

        //create layer
        this.baseLayer = this.map.createLayer('backgroundLayer');
        this.blockAllLayer = this.map.createLayer('blockAllLayer');
        this.blockNonPlayerLayer = this.map.createLayer('blockNonPlayerLayer');

        //collision on blockedLayer
        this.map.setCollision(223, true, this.baseLayer);
        this.map.setCollision(223, true, this.blockAllLayer);
        this.map.setCollision(2644, true, this.blockNonPlayerLayer);


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
        sprite.anchor.set(0.5);
        //copy all properties to the sprite
        Object.keys(element.properties).forEach(function(key){
            sprite[key] = element.properties[key];
        });

        return sprite;
    },

    correctCoordinate: function(x){
        var d = Math.floor(x / 16);
        var p = x % 16;
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

    playerHitsDiamond: function(diamond){
        diamond.kill();
    },

    update: function () {

        this.physics.arcade.collide(this.playerGroup, this.baseLayer);
        this.physics.arcade.collide(this.playerGroup, this.blockAllLayer);
        this.physics.arcade.collide(this.diamonds, this.baseLayer);
        this.physics.arcade.collide(this.diamonds, this.blockAllLayer);
        this.physics.arcade.collide(this.diamonds, this.blockNonPlayerLayer);
        this.physics.arcade.collide(this.diamonds, this.playerGroup, this.playerHitsDiamond);

        this.checkKeys();
        this.badGuys.children[0].move();

        // Where are you? What grid element.
        this.marker.x = this.math.snapToFloor(Math.floor(this.player.x), this.gridsize) / this.gridsize;
        this.marker.y = this.math.snapToFloor(Math.floor(this.player.y), this.gridsize) / this.gridsize;

        this.currentTile = this.map.getTile(this.marker.x, this.marker.y, this.blockNonPlayerLayer.index);
    },

    render: function () {
        this.currentTile && this.currentTile.index === this.dirtTile && this.map.removeTile(this.currentTile.x, this.currentTile.y, this.blockNonPlayerLayer);
    }

};

game.state.add('Game', PhaserGame, true);
