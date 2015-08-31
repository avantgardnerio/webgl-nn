var UnitVertexBuffer = function(gl) {
    var self = {};

    var ITEM_SIZE = 2;
    var VERT_COUNT = 4;

    var vertexBuffer;

    var ctor = function() {
        vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        var vertAr = [
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            1.0, 1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertAr), gl.STATIC_DRAW);
    };

    self.draw = function(vertPosAttr) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.vertexAttribPointer(vertPosAttr, ITEM_SIZE, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, VERT_COUNT);
    };

    ctor();
    return self;
};

module.exports = UnitVertexBuffer;
