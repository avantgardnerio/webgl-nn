var BlurWrapper = require('./BlurWrapper');
var Texture = require('./Texture');
var IdxFileReader = require('./IdxFileReader');
var TestPattern = require('./TestPattern');
var UnitVertexBuffer = require('./UnitVertexBuffer');
var js2glsl = require("js2glsl");

var shader;

var width = 39;
var height = 39;
var canvas;
var gl;
var vertexBuffer;

function webGLStart() {

    // Hook up events
    document.getElementById('test_pattern').addEventListener('click', onTestPatternClick);
    document.getElementById('fileInput').addEventListener('change', onFileOpenClick);
    canvas = document.getElementById("lesson05-canvas");
    gl = canvas.getContext("experimental-webgl");
    gl.getExtension('OES_texture_float');
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // WebGL
    shader = new BlurWrapper(gl);
    vertexBuffer = new UnitVertexBuffer(gl);
}

function onTestPatternClick() {
    var pattern = new TestPattern();
    var tex = new Texture(gl, pattern.getWidth(), pattern.getHeight(), pattern.getPixels());
    drawScene(tex, false);
    draw2D(pattern.getPixels(), pattern.getWidth(), pattern.getHeight());

    // TODO: Read 13x13 output, then render down to 5x5
}

function onFileOpenClick(e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = onFileLoaded;
    reader.readAsArrayBuffer(file);
}

function onFileLoaded(e) {
    var dv = new DataView(e.target.result);
    var reader = new IdxFileReader();
    var file = reader.loadFile(dv);
    var pixels = file.getImage(0);//file.getImageCount()-1);

    var tex = new Texture(gl, file.getWidth(), file.getHeight(), pixels);

    drawScene(tex, false);
    draw2D(pixels, file.getWidth(), file.getHeight());
}

function draw2D(pixels, width, height) {
    var canvas2d = document.getElementById("2d");
    var ctx = canvas2d.getContext("2d");

    var w = canvas2d.width;
    var h = canvas2d.height;
    var sw = 500;
    var sh = 500;
    var img = ctx.createImageData(w, h);

    shader.setUniforms({
        uSampler: [pixels, width, height],
        sourceSize: 29.0,
        destinationSize: 13.0,
        tileCount: 3.0,
        skipCount: 2.0
    });
    var varyings = {};
    for (var x = 0; x <= sw; x++) {
        for (var y = 0; y <= sh; y++) {
            varyings.vTextureCoord = [x / w, y / h];
            shader.setVaryings(varyings);
            var rgba = shader.FragmentColor(js2glsl.builtIns);
            var idx = (x + (h - y - 1) * w) * 4;
            for (var c = 0; c < 4; c++) {
                img.data[idx + c] = Math.round(Math.max(0, Math.min(255, rgba[c] * 255)));
            }
            img.data[idx + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
}

function drawScene(texture, fbo) {

    // Optionally render to frame buffer
    if (fbo) {
        // Create output texture
        var tex = new Texture(gl, width, height);

        // Create and attach frame buffer
        var fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex.getId(), 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
            throw new Error("gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE");
        }
    }

    // Init the scene
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Set the texture
    texture.activate(gl.TEXTURE0);

    // Upload constants
    shader.setSamplerUniform(0);
    shader.setTileCount(3.0);
    shader.setSkipCount(2.0);
    shader.setSourceSize(29.0);
    shader.setDestSize(13.0);

    // Render
    vertexBuffer.draw(shader.getVertPosAttr());

    // http://stackoverflow.com/questions/17981163/webgl-read-pixels-from-floating-point-render-target
    if (fbo) {
        var pixels = new Float32Array(4 * width * height);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, pixels);
        console.log(pixels[0] + "," + pixels[1] + "," + pixels[2] + "," + pixels[3]);
    }
}

module.exports = webGLStart;
