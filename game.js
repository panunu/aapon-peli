var Crafty = require('craftyjs');
var uuid = require('uuid');

var mapWidth = 1280, mapHeight = 600;
Crafty.init(mapWidth, mapHeight).background('#bbddff url(graphics/sea.png)');

var ships = [];
var itemSelected = null;
var treasury = 200;
var treasuryHud = null;

Crafty.c('Turret', {
    aim: function (targetShipIndex) {
        if (ships.length == 0) {
            return this.timeout(this.aim, 1000);
        }

        var targetIndex = 0;
        var targetShip = ships[targetIndex];

        if (targetShip) {
            var a = (targetShip.x - this.x);
            var b = (this.y - targetShip.y);

            this.rotation += (this.rotation < Math.atan2(a, b) * 180 / Math.PI) ? 1 : -1;

            return this.timeout(this.aim.bind(this, targetIndex), 50);
        }

        this.timeout(this.aim, 100);
    },

    shoot: function () {
        if (ships.length) {
            for (var simultaneous = this.turrets; simultaneous > 0; simultaneous--) {
                createAmmunition(
                    this.x,
                    this.y,
                    this.rotation + parseInt(Math.random() * (10 - this.accuracy)) * (parseInt(Math.random() * 10) <= 5 ? 1 : -1)
                );
            }
            this.timeout(this.shoot, 2000);
        }
    },

    wasHit: function (hitData) {
        this.destroy();
    }
});

Crafty.c('Mine', {
    float: function () {

        this.y -= Math.random() * (Math.random() >= 0.5 ? -1 : 1) / 2;
        this.x += Math.random() * (Math.random() >= 0.5 ? -1 : 1) / 2;

        this.timeout(this.float, 100);
    },

    wasHit: function (hitData) {
        var directions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        for (var d in directions) {
            createAmmunition(this.x, this.y, d * 45);
        }

        this.destroy();
    }
});

Crafty.c('Ammunition', {
    shoot: function () {
        var rotationInRadians = this.rotation * (Math.PI / 180);
        this.travel(rotationInRadians);
    },

    travel: function (rotationInRadians) {
        if (this.x < 0 || this.x > mapWidth - 100 || this.y > mapHeight || this.y < 0) {
            this.destroy();
        }

        var speed = 3;
        this.rotation += Math.random() * 2;

        this.y -= Math.cos(rotationInRadians) * speed;
        this.x += Math.sin(rotationInRadians) * speed;

        this.timeout(this.travel.bind(this, rotationInRadians), 20);
    },

    wasHit: function (hitData) {
        this.destroy();
    }
});

Crafty.c('Ship', {
    nextMove: function (waypoints, sequence) {
        var speed = this.speed;
        var proximity = parseInt(Math.random() * 100);

        if (!waypoints[sequence]) {
            return;
        }

        var waypoint = waypoints[sequence];
        var a = (waypoint.x - this.x);
        var b = (this.y - waypoint.y);

        var targetRotation = Math.atan2(a, b) * 180 / Math.PI;
        var turnLeftOrRight = (this.rotation < targetRotation) ? 1 : -1;

        this.rotation += turnLeftOrRight * speed * (Math.random());
        var rotationInRadians = this.rotation * (Math.PI / 180);

        this.y -= Math.cos(rotationInRadians) * speed;
        this.x += Math.sin(rotationInRadians) * speed;

        if (Math.abs(a) < proximity && Math.abs(b) < proximity) {
            sequence++;
        }

        this.timeout(this.nextMove.bind(this, waypoints, sequence, 1000), 15);

        return this;
    },

    wasHit: function (hitData) {
        this.health -= 1;
        this.speed -= 0.01;

        if (hitData == 'Solid') {
            this.health = 0;
        }

        if (this.health <= 0) {
            this.kaboom(true);
        }
    },

    kaboom: function (grantMoney) {
        ships = ships.filter(function (ship) {
            return this.uuid != ship.uuid;
        }.bind(this));

        this.destroy();

        if (ships.length == 0) {
            alert('Jee!');
            window.location.href = '/';
        }

        if (grantMoney) {
            updateTreasury(50);
        }
    }
});

var updateTreasury = function (amount) {
    treasury += amount;
    treasuryHud.text(treasury);
};

var createMenus = function () {
    Crafty.e('2D, Color, Canvas, Image')
        .attr({x: mapWidth - 100, y: 0, w: 100, h: mapHeight})
        .image('graphics/menu.png');

    var buyTurretButton = Crafty.e('2D, Mouse, Color, Canvas, Image')
        .attr({x: mapWidth - 100, y: 0, w: 100, h: 100})
        .color('white')
        .image('graphics/buy-turret.png')
        .bind('Click', function (event) {
            if (itemSelected || treasury < 100) {
                return;
            }

            this.color('lightgreen');
            itemSelected = 'turret';
            updateTreasury(-100);
        });

    var buyMineButton = Crafty.e('2D, Mouse, Color, Canvas, Image')
        .attr({x: mapWidth - 100, y: 121, w: 100, h: 100})
        .color('white')
        .image('graphics/buy-mine.png')
        .bind('Click', function (event) {
            if (itemSelected || treasury < 50) {
                return;
            }

            this.color('lightgreen');
            itemSelected = 'mine';
            updateTreasury(-50);
        });

    Crafty.e('2D, Mouse')
        .attr({x: 0, y: 0, w: mapWidth - 100, h: mapHeight})
        .bind('Click', function (event) {
            if (!itemSelected) {
                return;
            }

            if (itemSelected === 'turret') {
                createTurret(event.realX, event.realY);
                buyTurretButton.color('white');
            }

            if (itemSelected === 'mine') {
                createMine(event.realX, event.realY);
                buyMineButton.color('white');
            }

            itemSelected = null;
        });

    treasuryHud = Crafty.e('2D, DOM, Text')
        .attr({x: mapWidth - 90, y: mapHeight - 30})
        .textFont({size: '20px', weight: 'bold'})
        .textColor('lightgreen')
        .text(treasury);
};

var waypoints = [
    Crafty.e('2D, Color, Canvas').attr({x: 50, y: 50}),
    Crafty.e('2D, Color, Canvas').attr({x: mapWidth / 2 - 330, y: 50, w: 10, h: 10}),
    Crafty.e('2D, Color, Canvas').attr({x: mapWidth / 2 - 290, y: mapHeight - 50, w: 10, h: 10}),
    Crafty.e('2D, Color, Canvas').attr({x: mapWidth / 2 - 10, y: mapHeight - 50, w: 10, h: 10}),
    Crafty.e('2D, Color, Canvas').attr({x: mapWidth / 2, y: 55, w: 10, h: 10}),
    Crafty.e('2D, Color, Canvas').attr({x: mapWidth - 330, y: 56, w: 10, h: 10}),
    Crafty.e('2D, Color, Canvas').attr({x: mapWidth - 300, y: mapHeight, w: 10, h: 10})
];

var createShip = function (x, y) {
    var ship = Crafty.e('Ship, 2D, Canvas, Collision, Image')
        .attr({x: x, y: y, rotation: 10, uuid: uuid(), health: 10, speed: 0.2})
        .image('graphics/ship-small.png?' + uuid())
        .origin('bottom')
        .checkHits('Ammunition', 'Turret', 'Solid')
        .nextMove(waypoints, 0);

    ship.bind('HitOff', function (hitData) {
        ship.wasHit(hitData);
    });

    ships.push(ship);

    return ship;
};

var createMine = function (x, y) {
    var mine = Crafty.e('Mine, 2D, Canvas, Collision, Image')
        .attr({x: x - 17, y: y - 17, w: 25, h: 25})
        .origin('center')
        .checkHits('Ship, Ammunition')
        .image('graphics/mine.png?' + uuid());

    mine.bind('HitOn', function (hitData) { mine.wasHit(hitData); });
    mine.float();

    return mine;
};

var createTurret = function (x, y) {
    var turret = Crafty.e('Turret, 2D, Canvas, Collision, Image')
        .attr({x: x, y: y, w: 25, h: 25, accuracy: 1, health: 2, turrets: 1})
        .origin('center')
        .checkHits('Ship')
        .image('graphics/turret-smaller.png');

    turret.bind('HitOn', function (hitData) { turret.wasHit(hitData); });
    turret.aim();
    turret.shoot();

    return turret;
};

var createAmmunition = function (x, y, rotation) {
    var ammo = Crafty.e('Ammunition, 2D, Canvas, Collision, Rotate, Image')
        .attr({x: x + 10, y: y + 10, w: 8, h: 8, rotation: rotation})
        .origin('center')
        .checkHits('Ship')
        .image('graphics/ammo.png?' + uuid());

    ammo.bind('HitOn', function (hitData) { ammo.wasHit(hitData); });
    ammo.shoot();

    return ammo;
};

var createBase = function (x, y) {
    var base = Crafty.e('2D, Canvas, Collision, Image, Color, Solid')
        .attr({x: x - 100, y: y - 50, w: 100, h: 100, health: 5})
        .origin('center')
        .checkHits('Ship')
        .image('graphics/base.png');

    base.bind('HitOn', function (hitData) {
        var collidingShips = base.hit('Ship');
        var keys = Object.keys(collidingShips);

        for (var key in keys) {
            collidingShips[key].obj.kaboom();
        }

        base.health--;
        base.resetHitChecks();

        if (base.health <= 0) {
            base.destroy();

            alert('Kaboom!');
            window.location.href = '/';
        }
    });
};

// Go!

createBase(mapWidth - 320, mapHeight - 200);
createMenus();

for (var y = 1; y < 75; y += 1) {
    createShip(50, mapHeight - 100 + y * (75 + Math.random() * 15));
}