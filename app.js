var BlurWrapper = require('./BlurWrapper');
var Texture = require('./Texture');
var IdxFileReader = require('./IdxFileReader');
var TestPattern = require('./TestPattern');
var UnitVertexBuffer = require('./UnitVertexBuffer');
var Renderer2d = require('./Renderer2d');
var Renderer3d = require('./Renderer3d');

var shader;
var cnv3d;
var gl;
var vertexBuffer;
var cnvOut;
var ctxOut;
var renderer2d;
var renderer3d;

function webGLStart() {

    // Hook up events
    document.getElementById('test_pattern').addEventListener('click', onTestPatternClick);
    document.getElementById('fileInput').addEventListener('change', onFileOpenClick);

    cnvOut = document.getElementById("cnvOut");
    ctxOut = cnvOut.getContext("2d");

    cnv3d = document.createElement("canvas");
    cnv3d.width = 13;
    cnv3d.height = 13;
    gl = cnv3d.getContext("experimental-webgl");

    gl.getExtension('OES_texture_float');
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // WebGL
    shader = new BlurWrapper(gl);
    vertexBuffer = new UnitVertexBuffer(gl);

    renderer2d = new Renderer2d(shader);
    renderer3d = new Renderer2d(shader, vertexBuffer);
}

function onTestPatternClick() {
    // 29x29
    var pattern = new TestPattern();
    putImageData(pattern.getPixels(), 0, 0, 29, 29);
    putImageData(pattern.getPixels(), 500, 0, 29, 29);

    // 13x13
    var img3d = renderer3d.render(gl, pattern.getPixels(), 29, 13);
    var img2d = renderer2d.render(gl, pattern.getPixels(), 29, 13);

    putImageData(img3d, 30, 0, 13, 13);
    putImageData(img2d, 530, 0, 13, 13);

    // TODO: Read 13x13 output, then render down to 5x5
}

function putImageData(rgba, dx, dy, width, height) {
    var img = ctxOut.createImageData(width, height);
    for(var y = 0; y < height; y++) {
        for(var x = 0; x < width; x++) {
            for(var c = 0; c < 4; c++) {
                var idx = y * width * 4 + x * 4 + c;
                img.data[idx] = Math.round(Math.max(0, Math.min(255, rgba[idx] * 255)));
            }
        }
    }
    ctxOut.putImageData(img, dx, dy);
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

    draw3d(tex, false);
    draw2d(pixels, file.getWidth(), file.getHeight());
}

module.exports = webGLStart;
