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
    cnv3d.width = 39;
    cnv3d.height = 39;
    gl = cnv3d.getContext("experimental-webgl");

    gl.getExtension('OES_texture_float');
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // WebGL
    shader = new BlurWrapper(gl);
    vertexBuffer = new UnitVertexBuffer(gl);

    renderer2d = new Renderer2d(shader);
    renderer3d = new Renderer3d(shader, vertexBuffer);
}

function onTestPatternClick() {
    // 29x29
    var pattern = new TestPattern();
    putImageData(pattern.getPixels(), 0, 0, 29);
    putImageData(pattern.getPixels(), 500, 0, 29);

    // 13x13
    var img3d = renderer3d.render(gl, pattern.getPixels(), 29, 39, 3);
    var img2d = renderer2d.render(gl, pattern.getPixels(), 29, 39, 3);

    putImageData(img3d, 40, 0, 39);
    putImageData(img2d, 540, 0, 39);

    // 5x5
    img3d = renderer3d.render(gl, img3d, 13, 5, 7);
    img2d = renderer2d.render(gl, img2d, 13, 5, 7);

    putImageData(img3d, 80, 0, 35);
    putImageData(img2d, 580, 0, 35);
}

function putImageData(rgba, dx, dy, size) {
    var img = ctxOut.createImageData(size, size);
    for(var y = 0; y < size; y++) {
        for(var x = 0; x < size; x++) {
            for(var c = 0; c < 4; c++) {
                var idx = y * size * 4 + x * 4 + c;
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
