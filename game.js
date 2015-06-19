var Crafty = require('craftyjs');
var uuid = require('uuid');

var mapWidth = 1425, mapHeight = 700;
var ships = [];

Crafty.init(mapWidth, mapHeight).background('#bbddff');

Crafty.c('Turret', {
    aim: function () {
        if (ships.length == 0) {
            this.timeout(this.aim, 1000);
        }

        console.log(ships.length);

        var targetShip = ships[0];

        if (targetShip) {
            var a = (targetShip.x - this.x);
            var b = (this.y - targetShip.y);

            this.rotation += (this.rotation < Math.atan2(a, b) * 180 / Math.PI) ? 1 : -1;

            this.timeout(this.aim, 5);
        }
    },

    shoot: function () {
        createAmmunition(
            this.x,
            this.y,
            this.rotation
        );

        if (ships.length) {
            this.timeout(this.shoot, 2000);
        }
    }
});

Crafty.c('Ammunition', {
    shoot: function () {
        var rotationInRadians = this.rotation * (Math.PI / 180);
        this.travel(rotationInRadians);
    },

    travel: function (rotationInRadians) {
        if (this.x < 0 || this.x > mapWidth || this.y > mapHeight || this.y < 0) {
            this.destroy();
        }

        var speed = 3;
        this.rotation++;

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
        var speed = 0.1;
        var approximity = 5;

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

        if (Math.abs(a) < approximity && Math.abs(b) < approximity) {
            sequence++;
        }

        this.timeout(this.nextMove.bind(this, waypoints, sequence, 1));

        return this;
    },

    wasHit: function (hitData) {
        this.health -= 1;

        if (this.health <= 0) {
            ships = ships.filter(function (ship) {
                return this.id != ship.id;
            }.bind(this));

            this.destroy();
        }
    }
});

var waypoints = [
    Crafty.e('2D, Color, Canvas')
        .attr({x: 500, y: 300, w: 10, h: 10})
        .color('yellow'),

    Crafty.e('2D, Color, Canvas')
        .attr({x: 1000, y: 50, w: 10, h: 10})
        .color('orangered'),

    Crafty.e('2D, Color, Canvas')
        .attr({x: 700, y: 500, w: 10, h: 10})
        .color('darkblue'),

    Crafty.e('2D, Color, Canvas')
        .attr({x: 100, y: 250, w: 10, h: 10})
        .color('skyblue'),

    Crafty.e('2D, Color, Canvas')
        .attr({x: 1000, y: 50, w: 10, h: 10})
        .color('orangered'),

    Crafty.e('2D, Color, Canvas')
        .attr({x: 100, y: 250, w: 10, h: 10})
        .color('skyblue')
];

var createTurret = function (x, y) {
    var turret = Crafty.e('Turret, 2D, Canvas, Color')
        .attr({x: x, y: y, w: 25, h: 25})
        .origin('center')
        .color('darkgray');

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
        .attr({x: x, y: y, w: 16, h: 30, rotation: 10, id: uuid(), health: 3})
        .color('#666666')
        .origin('center')
        .checkHits('Ammunition')
        .nextMove(waypoints, parseInt((Math.random() * 4)));

    ship.bind('HitOn', function (hitData) { ship.wasHit(hitData); });

    ships.push(ship);

    return ship;
};

createShip(100, 100);
createShip(1000, 500);
createShip(200, 200);

createTurret(100, 100);
createTurret(1000, 400);
createTurret(500, 600);
