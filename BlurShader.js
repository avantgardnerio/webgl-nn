var js2glsl = require("js2glsl");


function BlurShader() {
    js2glsl.ShaderSpecification.call(this);
}

BlurShader.prototype = Object.create(js2glsl.ShaderSpecification.prototype);
BlurShader.prototype.constructor = BlurShader;

BlurShader.prototype.VertexPosition = function (builtIns) {
    var xyz = this.attributes.aVertexPosition;
    this.varyings.vTextureCoord = [
        xyz[0] / 2 + 0.5,
        xyz[1] / 2 + 0.5
    ];
    return [xyz[0], xyz[1], 0, 1];
};

BlurShader.prototype.FragmentColor = function (builtIns) {
    var val = [0, 0, 0, 0];

    // TODO: Figure out how to parameterize kernel_sz
    var halfSize = 2.0;                     // "half" the kernel size
    var kernel_sz = halfSize * 2.0 + 1.0;   // Full kernel size

    // Three tiles of output per one pass over the input [0,1)
    var fmx = builtIns.mod(this.varyings.vTextureCoord[0] * this.uniforms.tileCount, 1.0);
    var fmy = builtIns.mod(this.varyings.vTextureCoord[1] * this.uniforms.tileCount, 1.0);

    // Round down into integer destination space [0,12]
    var dx = Math.floor(fmx * this.uniforms.destinationSize);
    var dy = Math.floor(fmy * this.uniforms.destinationSize);

    // Scan 5x5 kernel pixels
    for (var ky = -halfSize; ky <= halfSize; ky++) {
        for (var kx = -halfSize; kx <= halfSize; kx++) {
            // sx & sy in source space [0.5, 4.5] - [24.5, 28.5]
            var sx = (dx * this.uniforms.skipCount) + halfSize + kx + 0.5;
            var sy = (dy * this.uniforms.skipCount) + halfSize + ky + 0.5;

            // Texture position goes back to [0,1) in source space
            var tp = [sx / this.uniforms.sourceSize, sy / this.uniforms.sourceSize];
            val = builtIns.addVecs4(val, builtIns.texture2D(this.uniforms.uSampler, tp));
        }
    }

    // Average - TODO: Real squash function
    var k = kernel_sz * kernel_sz;
    return [val[0] / k, val[1] / k, val[2] / k, 1];
};

module.exports = BlurShader; 
