var Crafty = require('craftyjs');

var mapWidth = 1425, mapHeight = 700;

Crafty.init(mapWidth, mapHeight).background('#bbddff');

Crafty.c('Ship', {
    nextMove: function (waypoints, sequence) {
        var speed = 2;
        var approximity = 1;

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

var ship = Crafty.e('Ship, 2D, Canvas, Color, Rotate')
    .attr({x: 50, y: mapHeight - 50, w: 10, h: 30, rotation: 10})
    .color('#666666')
    .origin('center')
    .nextMove(waypoints, 0);
