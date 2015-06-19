var Crafty = require('craftyjs');
var uuid = require('uuid');

var mapWidth = 1425, mapHeight = 700;
var ships = [];
var turretSelected = false;

var treasury = 300;
var treasuryHud = null;

var updateTreasury = function (amount) {
    treasury += amount;
    treasuryHud.text(treasury);
};

Crafty.init(mapWidth, mapHeight).background('#bbddff');

var createMenus = function () {
    Crafty.e('2D, Color, Canvas')
        .attr({x: mapWidth - 100, y: 0, w: 100, h: mapHeight})
        .color('grey');

    var buyTurretButton = Crafty.e('2D, Mouse, Color, Canvas, Image')
        .attr({x: mapWidth - 100, y: 0, w: 100, h: 100})
        .color('white')
        .image('graphics/turret.png')
        .bind('Click', function (event) {
            if (treasury < 100) {
                return;
            }

            this.color('lightgreen');
            turretSelected = true;
            updateTreasury(-100);
        });

    Crafty.e('2D, Mouse')
        .attr({x: 0, y: 0, w: mapWidth - 100, h: mapHeight})
        .bind('Click', function (event) {
            if (turretSelected) {
                createTurret(event.realX, event.realY);
                turretSelected = false;
                buyTurretButton.color('white');
            }
        });

    treasuryHud = Crafty.e('2D, DOM, Text')
        .attr({x: mapWidth - 90, y: mapHeight - 30})
        .textFont({ size: '20px', weight: 'bold' })
        .text(treasury);
};

Crafty.c('Turret', {
    aim: function (targetShipIndex) {
        if (ships.length == 0) {
            return this.timeout(this.aim, 1000);
        }

        var targetIndex = targetShipIndex ? targetShipIndex : parseInt(Math.random() * ships.length);
        var targetShip = ships[targetIndex];

        if (targetShip) {
            var a = (targetShip.x - this.x);
            var b = (this.y - targetShip.y);

            this.rotation += (this.rotation < Math.atan2(a, b) * 180 / Math.PI) ? 1 : -1;

            return this.timeout(this.aim.bind(this, targetIndex), 10);
        }

        this.timeout(this.aim, 10);
    },

    shoot: function () {
        if (ships.length) {
            for (var simultaneous = 3; simultaneous > 0; simultaneous--) {
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
        this.health -= 1;

        if (this.health <= 0) {
            this.destroy();
        }
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

        this.timeout(this.travel.bind(this, rotationInRadians));
    },

    wasHit: function (hitData) {
        this.destroy();
    }
});

Crafty.c('Ship', {
    nextMove: function (waypoints, sequence) {
        var speed = this.speed;
        var proximity = parseInt(Math.random() * 30);

        if (!waypoints[sequence]) {
            sequence = 0;
        }

        var waypoint = waypoints[sequence];
        var a = (waypoint.x - this.x);
        var b = (this.y - waypoint.y);

        var turnLeftOrRight = (this.rotation < Math.atan2(a, b) * 180 / Math.PI) ? 1 : -1;
        this.rotation += turnLeftOrRight * speed;

        var rotationInRadians = this.rotation * (Math.PI / 180);

        this.y -= Math.cos(rotationInRadians) * speed;
        this.x += Math.sin(rotationInRadians) * speed;

        if (Math.abs(a) < proximity && Math.abs(b) < proximity) {
            sequence++;
        }

        this.timeout(this.nextMove.bind(this, waypoints, sequence, 1));

        return this;
    },

    wasHit: function (hitData) {
        this.health -= 1;
        this.speed -= 0.1;

        if (this.health <= 0) {
            ships = ships.filter(function (ship) {
                return this.id != ship.id;
            }.bind(this));

            this.destroy();

            updateTreasury(50);
        }
    }
});

var waypoints = [
    Crafty.e('2D, Color, Canvas')
        .attr({x: 50, y: 100}),

    Crafty.e('2D, Color, Canvas')
        .attr({x: mapWidth - 200, y: mapHeight / 2}),

    Crafty.e('2D, Color, Canvas')
        .attr({x: 200, y: mapHeight / 2})
];

var createTurret = function (x, y) {
    var turret = Crafty.e('Turret, 2D, Canvas, Collision, Image')
        .attr({x: x, y: y, w: 25, h: 25, accuracy: 1, health: 2})
        .origin('center')
        .checkHits('Ship')
        .image('graphics/turret.png');

    turret.bind('HitOn', function (hitData) { turret.wasHit(hitData); });
    turret.aim();
    turret.shoot();

    return turret;
};

var createAmmunition = function (x, y, rotation) {
    var ammo = Crafty.e('Ammunition, 2D, Canvas, Color, Collision, Rotate')
        .attr({x: x + 10, y: y + 10, w: 8, h: 8, rotation: rotation})
        .color('black')
        .origin('center')
        .checkHits('Ship');

    ammo.bind('HitOn', function (hitData) { ammo.wasHit(hitData); });
    ammo.shoot();

    return ammo;
};

var createShip = function (x, y) {
    var ship = Crafty.e('Ship, 2D, Canvas, Color, Rotate, Collision')
        .attr({x: x, y: y, w: 16, h: 30, rotation: 10, id: uuid(), health: 3, speed: 0.5})
        .color('#666666')
        .origin('center')
        .checkHits('Ammunition', 'Turret')
        .nextMove(waypoints, 0);

    ship.bind('HitOff', function (hitData) {
        ship.wasHit(hitData);
    });

    ships.push(ship);

    return ship;
};

createMenus();

for (var y = 1; y < 50; y += 1) {
    createShip(50, mapHeight - 100 + y * 60);
}