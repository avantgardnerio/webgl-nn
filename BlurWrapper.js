var BlurShader = require('./BlurShader');

function BlurWrapper(gl) {
    var self = {};

    var shader = new BlurShader();

    var prog = shader.GetProgram(gl)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw "Could not initialise shaders!";
    }

    gl.useProgram(prog);

    var vertPosAttr = gl.getAttribLocation(prog, "aVertexPosition");
    var texCoordAttr = gl.getAttribLocation(prog, "aTextureCoord");
    var sampler = gl.getUniformLocation(prog, "uSampler");
    var tileCount = gl.getUniformLocation(prog, "tileCount");
    var skipCount = gl.getUniformLocation(prog, "skipCount");
    var sourceSize = gl.getUniformLocation(prog, "sourceSize");
    var destinationSize = gl.getUniformLocation(prog, "destinationSize");

    gl.enableVertexAttribArray(vertPosAttr);
    gl.enableVertexAttribArray(texCoordAttr);

    self.setVaryings = function(val) {
        shader.varyings = val;
    };

    self.setUniforms = function(val) {
        shader.uniforms = val;
    };

    self.FragmentColor = function(val) {
        return shader.FragmentColor(val);
    };

    self.getVertPosAttr = function() {
        return vertPosAttr;
    };

    self.setSamplerUniform = function(val) {
        gl.uniform1i(sampler, val);
    };

    self.setTileCount = function(val) {
        gl.uniform1f(tileCount, val);
    };

    self.setSkipCount = function(val) {
        gl.uniform1f(skipCount, val);
    };

    self.setSourceSize = function(val) {
        gl.uniform1f(sourceSize, val);
    };

    self.setDestSize = function(val) {
        gl.uniform1f(destinationSize, val);
    };

    return self;
}

module.exports = BlurWrapper;
