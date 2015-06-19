var Crafty = require('craftyjs');
var uuid = require('uuid');

var mapWidth = 1425, mapHeight = 700;
var ships = [];

Crafty.init(mapWidth, mapHeight).background('#bbddff');

Crafty.e('2D, Mouse')
    .attr({x: 0, y: 0, w: 1325, h: 700})
    .bind('Click', function (event) {
        createTurret(event.realX, event.realY);
    });

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
            createAmmunition(
                this.x,
                this.y,
                this.rotation + parseInt(Math.random() * (10 - this.accuracy)) * (parseInt(Math.random() * 10) <= 5 ? 1 : -1)
            );

            createAmmunition(
                this.x,
                this.y,
                this.rotation + parseInt(Math.random() * (10 - this.accuracy)) * (parseInt(Math.random() * 10) <= 5 ? 1 : -1)
            );

            createAmmunition(
                this.x,
                this.y,
                this.rotation + parseInt(Math.random() * (10 - this.accuracy)) * (parseInt(Math.random() * 10) <= 5 ? 1 : -1)
            );

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
        var speed = 0.1;
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
        .attr({x: 500, y: 300, w: 2, h: 2})
        .color('yellow'),

    Crafty.e('2D, Color, Canvas')
        .attr({x: 1000, y: 50, w: 2, h: 2})
        .color('orangered'),

    Crafty.e('2D, Color, Canvas')
        .attr({x: 1300, y: 600, w: 2, h: 2})
        .color('darkblue'),

    Crafty.e('2D, Color, Canvas')
        .attr({x: 100, y: 250, w: 2, h: 2})
        .color('red'),

    Crafty.e('2D, Color, Canvas')
        .attr({x: 1000, y: 50, w: 2, h: 2})
        .color('orangered'),

    Crafty.e('2D, Color, Canvas')
        .attr({x: 100, y: 250, w: 2, h: 2})
        .color('darkgreen')
];

var createTurret = function (x, y) {
    var turret = Crafty.e('Turret, 2D, Canvas, Color')
        .attr({x: x, y: y, w: 25, h: 25, accuracy: 1})
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

createShip(1000, 500);
createShip(200, 200);
createShip(200, 500);
createShip(1300, 350);
createShip(20, 500);
createShip(100, 500);
createShip(20, 400);