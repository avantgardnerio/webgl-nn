var BlurShader = require('./BlurShader');

var shaderSpec = new BlurShader(); 


var IMG_WIDTH = 29;
var IMG_HEIGHT = 29;
var IMG_FLT_SZ = IMG_WIDTH * IMG_HEIGHT * 4;
var IMG_BYTE_SZ = IMG_FLT_SZ * 4;

var srcImgbytes;

var width = 39;
var height = 39;
var gl;
var shaderProgram;
var floatTexture;
var cubeVertexPositionBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;

function webGLStart() {
    
    // File reader
    var fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', function(e) {
	var file = fileInput.files[0];

	var reader = new FileReader();

	reader.onload = function(e) {
	    var dv = new DataView(reader.result);
	    var pos = -4;
	    var magic = dv.getUint32(pos += 4);
	    console.log("magic=" + magic);
	    
	    // Image file
	    if(magic == 2051) { 
		var imageCount = dv.getUint32(pos += 4);
		var rowCount = dv.getUint32(pos += 4);
		var colCount = dv.getUint32(pos += 4);
		console.log("imageCount=" + imageCount);
		console.log("rowCount=" + rowCount);
		console.log("colCount=" + colCount);
		srcImgbytes = new ArrayBuffer(IMG_BYTE_SZ * imageCount);
		var pixels = new Float32Array(srcImgbytes, 0, IMG_FLT_SZ * imageCount);
		var pixIdx = 0;
		
		var imgByteSize = rowCount * colCount;
		for(var imgIdx = 0; imgIdx < imageCount; imgIdx++) {
		    for(var y = 0; y < IMG_HEIGHT; y++) {
			for(var x = 0; x < IMG_WIDTH; x++) {
			    var color = 0.0;
			    if(y < rowCount && x < colCount) {
				color = dv.getUint8(pos + (imgIdx * imgByteSize) + (y * colCount) + x) / 255.0;
			    }
			    pixels[pixIdx + 0] = color;
			    pixels[pixIdx + 1] = color;
			    pixels[pixIdx + 2] = color;
			    pixels[pixIdx + 3] = 1.0;
			    pixIdx += 4;
			}
		    }
		}
		

		// Test stripes for alignment
		pixIdx = 0;
		for(var y = 0; y < IMG_HEIGHT; y++) {
		    for(var x = 0; x < IMG_WIDTH; x++) {
			var color = 0.0;
			if(x == 0 || y == 0 || x == IMG_WIDTH-1 || y == IMG_HEIGHT-1) {
			    color = 1.0;
			}
			pixels[pixIdx + 0] = color;
			pixels[pixIdx + 1] = color;
			pixels[pixIdx + 2] = color;
			pixels[pixIdx + 3] = 1.0;
			pixIdx += 4;
		    }
		}

		
		var tex = createTexture(pixels, IMG_WIDTH, IMG_HEIGHT);
		//var tmp = new Float32Array(srcImgbytes, IMG_BYTE_SZ * (imageCount-1), IMG_FLT_SZ);
		//replaceTexture(tex, tmp, IMG_WIDTH, IMG_HEIGHT);
		drawScene(tex, false);
	    }
	    
	    // Label file
	    if(magic == 2049) {
		var lblCnt = dv.getUint32(pos += 4);
		for(var lblIdx = 0; lblIdx < lblCnt; lblIdx++) {
		    var lbl = dv.getUint8(pos + lblIdx);
		    console.log("lbl=" + lbl);
		}
	    }
	}

	reader.readAsArrayBuffer(file);	
    });

    // WebGL
    var canvas = document.getElementById("lesson05-canvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    initTexture();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    drawScene(floatTexture, false);
}

function initGL(canvas) {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
}

function drawScene(texture, fbo) {
    
    // Optionally render to frame buffer
    if(fbo) {
	// Create output texture
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);

	// Create and attach frame buffer
	var fbo = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	gl.bindTexture(gl.TEXTURE_2D, null);
	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
	    throw new Error("gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE");
	}
    }

    // Draw the scene
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    // http://stackoverflow.com/questions/17981163/webgl-read-pixels-from-floating-point-render-target
    if(fbo) {
	var pixels = new Float32Array(4 * width * height);
	gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, pixels);
	console.log(pixels[0] + "," + pixels[1] + "," + pixels[2] + "," + pixels[3]);
    }
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
	return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
	if (k.nodeType == 3) {
	    str += k.textContent;
	}
	k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
	shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
	shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
	return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	alert(gl.getShaderInfoLog(shader));
	return null;
    }

    return shader;
}

function initShaders() {
    shaderProgram = shaderSpec.GetProgram(gl)

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}

function initTexture() {
    gl.getExtension('OES_texture_float');
    
    // Draw texture
    var ar = new Float32Array(width * height * 4);
    for(var i = 0; i < width * height; i++) {
	ar[i * 4 + 0] = 0.5;
	ar[i * 4 + 1] = 0.5;
	ar[i * 4 + 2] = 1;
	ar[i * 4 + 3] = 1;
    }
    
    // Upload texture to GPU
    floatTexture = createTexture(ar, width, height);
}

function replaceTexture(tex, floatAr, width, height) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 	// target - Specifies the target texture
		  0, 							// level - The level of detail value.
		  gl.RGBA, 					// internalformat - Specifies the number of color components in the texture.
		  width, 						// width - Width of texture image. Value used only when UInt8Array or Float32Array for pixels is specified.
		  height, 					// height - Height of texture image. Value used only when UInt8Array or Float32Array for pixels is specified.
		  0, 							// border - Specifies the width of the border. Must be 0. 
		  gl.RGBA, 					// format - Contains the format for the source pixel data. Must match internalformat (see above).
		  gl.FLOAT,					// type - The type of texture data. (gl.FLOAT creates 128 bit-per-pixel textures instead of 32 bit-per-pixel for the image)
		  floatAr						// pixels - The ImageData array, ArrayBufferView, HTMLCanvasElement, HTMLImageElement to use as a data source for the texture.
		 );				
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function createTexture(floatAr, width, height) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 	// target - Specifies the target texture
		  0, 							// level - The level of detail value.
		  gl.RGBA, 					// internalformat - Specifies the number of color components in the texture.
		  width, 						// width - Width of texture image. Value used only when UInt8Array or Float32Array for pixels is specified.
		  height, 					// height - Height of texture image. Value used only when UInt8Array or Float32Array for pixels is specified.
		  0, 							// border - Specifies the width of the border. Must be 0. 
		  gl.RGBA, 					// format - Contains the format for the source pixel data. Must match internalformat (see above).
		  gl.FLOAT,					// type - The type of texture data. (gl.FLOAT creates 128 bit-per-pixel textures instead of 32 bit-per-pixel for the image)
		  floatAr						// pixels - The ImageData array, ArrayBufferView, HTMLCanvasElement, HTMLImageElement to use as a data source for the texture.
		 );				
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); 
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    return tex;
}

function initBuffers() {
    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    vertices = [
	    -1.0, -1.0,  0.0,
	1.0, -1.0,  0.0,
	1.0,  1.0,  0.0,
	    -1.0,  1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numItems = vertices.length;

    cubeVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    var textureCoords = [
	0.0, 0.0,
	1.0, 0.0,
	1.0, 1.0,
	0.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    cubeVertexTextureCoordBuffer.itemSize = 2;
    cubeVertexTextureCoordBuffer.numItems = vertices.length;

    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    var cubeVertexIndices = [
	0, 1, 2,      0, 2, 3
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    cubeVertexIndexBuffer.itemSize = 1;
    cubeVertexIndexBuffer.numItems = cubeVertexIndices.length;
}

module.exports = webGLStart;
