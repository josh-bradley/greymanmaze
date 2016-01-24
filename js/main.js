var game = new Phaser.Game(500, 500, Phaser.AUTO, 'game');

var COLLECTABLE_TYPE = 'diamond';
var BAD_GUY_TYPE = 'badGuy';

var PhaserGame = function (game) {

    this.map = null;
    this.baseLayer = null;
    this.player = null;

    this.safetile = 2;
    this.dirtTile = 2644;
    this.gridsize = 16;

    this.speed = 100;
    this.threshold = 3;
    this.turnSpeed = 150;

    this.marker = new Phaser.Point();
    this.turnPoint = new Phaser.Point();

    this.directions = [ null, null, null, null, null ];
    this.opposites = [ Phaser.NONE, Phaser.RIGHT, Phaser.LEFT, Phaser.DOWN, Phaser.UP ];

    this.current = Phaser.UP;
    this.turning = Phaser.NONE;

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
        var result = this.findObjectsByType('playerStart', this.map, 'objectsLayer');
        this.player = this.game.add.sprite(24, 24, 'player');
        this.player.anchor.set(0.5);
        this.game.physics.arcade.enable(this.player);


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
        console.log('Objects of type: '+ type + 'found: ' + result.length);
        result.forEach(function(element){
            this.createFromTiledObject(element, group, constructor);
        }, this);
    },

    createFromTiledObject: function(element, group, constructor) {
        var sprite = new constructor(this.game, this.correctCoordinate(element.x), this.correctCoordinate(element.y), element.properties.sprite);
        console.log('The sprite of type: ' + sprite.x);
        sprite.anchor.set(0.5);
        group.addChild(sprite);
        //copy all properties to the sprite
        Object.keys(element.properties).forEach(function(key){
            sprite[key] = element.properties[key];
        });
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

        if (this.cursors.left.isDown && this.current !== Phaser.LEFT)
        {
            this.checkDirection(Phaser.LEFT);
        }
        else if (this.cursors.right.isDown && this.current !== Phaser.RIGHT)
        {
            this.checkDirection(Phaser.RIGHT);
        }
        else if (this.cursors.up.isDown && this.current !== Phaser.UP)
        {
            this.checkDirection(Phaser.UP);
        }
        else if (this.cursors.down.isDown && this.current !== Phaser.DOWN)
        {
            this.checkDirection(Phaser.DOWN);
        }
        else
        {
            //  This forces them to hold the key down to turn the corner
            this.turning = Phaser.NONE;
        }

    },

    checkDirection: function (turnTo) {

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

    },

    turn: function () {

        var cx = Math.floor(this.player.x);
        var cy = Math.floor(this.player.y);

        // This needs a threshold, because at high speeds you can't turn because the coordinates skip past
        if (!this.math.fuzzyEqual(cx, this.turnPoint.x, this.threshold) || !this.math.fuzzyEqual(cy, this.turnPoint.y, this.threshold))
        {
            return false;
        }

        this.player.x = this.turnPoint.x;
        this.player.y = this.turnPoint.y;

        this.player.body.reset(this.turnPoint.x, this.turnPoint.y);

        this.move(this.turning);

        this.turning = Phaser.NONE;

        return true;

    },

    move: function (direction) {

        var speed = this.speed;

        if (direction === Phaser.LEFT || direction === Phaser.UP)
        {
            speed = -speed;
        }

        if (direction === Phaser.LEFT || direction === Phaser.RIGHT)
        {
            this.player.body.velocity.x = speed;
        }
        else
        {
            this.player.body.velocity.y = speed;
        }

        this.current = direction;

    },

    playerHitsDiamond: function(player, diamond){
        diamond.kill();
    },

    update: function () {

        this.physics.arcade.collide(this.player, this.baseLayer);
        this.physics.arcade.collide(this.player, this.blockAllLayer);
        this.physics.arcade.collide(this.diamonds, this.baseLayer);
        this.physics.arcade.collide(this.diamonds, this.blockAllLayer);
        this.physics.arcade.collide(this.diamonds, this.blockNonPlayerLayer);
        this.physics.arcade.collide(this.diamonds, this.player, this.playerHitsDiamond);

        // Where are you? What grid element.
        this.marker.x = this.math.snapToFloor(Math.floor(this.player.x), this.gridsize) / this.gridsize;
        this.marker.y = this.math.snapToFloor(Math.floor(this.player.y), this.gridsize) / this.gridsize;

        //  Update our grid sensors
        this.directions[1] = this.map.getTileLeft(this.baseLayer.index, this.marker.x, this.marker.y);
        this.directions[2] = this.map.getTileRight(this.baseLayer.index, this.marker.x, this.marker.y);
        this.directions[3] = this.map.getTileAbove(this.baseLayer.index, this.marker.x, this.marker.y);
        this.directions[4] = this.map.getTileBelow(this.baseLayer.index, this.marker.x, this.marker.y);
        this.currentTile = this.map.getTile(this.marker.x, this.marker.y, this.blockNonPlayerLayer.index);

        this.checkKeys();

        if (this.turning !== Phaser.NONE)
        {
            this.turn();
        }

    },

    render: function () {
        this.currentTile && this.currentTile.index === this.dirtTile && this.map.removeTile(this.currentTile.x, this.currentTile.y, this.blockNonPlayerLayer);
    }

};

game.state.add('Game', PhaserGame, true);
