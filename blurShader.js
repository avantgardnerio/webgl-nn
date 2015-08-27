var js2glsl = require("js2glsl");


function BlurShader() {
    js2glsl.ShaderSpecification.call(this);    
}

BlurShader.prototype = Object.create(js2glsl.ShaderSpecification.prototype);
BlurShader.prototype.constructor = BlurShader;

BlurShader.prototype.VertexPosition = function(builtIns) { 
    var xyz = this.attributes.aVertexPosition; 
    this.varyings.vTextureCoord = [ xyz[0] / 2 + 0.5,
				    xyz[1] / 2 + 0.5 ]; 
    return [xyz[0], xyz[1], 0, 1]; 
}

BlurShader.prototype.FragmentColor = function(builtIns) {
    var val = [0,0,0,0]; 

    var image_size = 29.0; 
    var pixel_middle = 0.5/image_size;
			
    // kx & ky = 5x5 kernel
    var kw = 5.0; 
    var kh = 5.0; 
    var halfSize = 2.5;
    var sz = halfSize * 2.0 + 1.0;

    // vTextureCoord = [0,1] -> [0,29]
    var fmx = builtIns.mod(this.varyings.vTextureCoord[0] * 3.0, 1.0) - pixel_middle;
    var fmy = builtIns.mod(this.varyings.vTextureCoord[1] * 3.0, 1.0) - pixel_middle;

    // floor((m - 5) / 2) + 1
    // 29 - 5 = 24 / 2 = 12 + 1 = 13 possible positions for the kernel within the source texture
    // destination (0-13)
    var dx = (fmx * 13.0); // WTF? 15 should be 13
    var dy = (fmy * 13.0);

    for(var ky = -halfSize; ky <= halfSize; ky++) {
	for(var kx = -halfSize; kx <= halfSize; kx++) {
	    // source
	    // 0 * 2 + -2 + 2 = 0
	    // 0 * 2 + 2 + 2 = 4
	    // 14 * 2 = 28 - 2 + 2 = 28
	    // 14 * 2 = 28 + 2 + 2 = 32 - doh
	    var sx = (dx * 2.0) + kx + 2.0;
	    var sy = (dy * 2.0) + ky + 2.0;

	    val = builtIns.addVecs4(val, builtIns.texture2D(this.uniforms.uSampler, [sx / 29.0, sy / 29.0]) ); 
	}
    }

    var k = sz*sz; 
    return [val[0]/k, val[1] / k * Math.abs(this.varyings.vTextureCoord[0] * this.varyings.vTextureCoord[1]), val[2]/k, val[3]/k];

    //var rtn = builtIns.texture2D(this.uniforms.uSampler, [fmx,fmy]);

} 

module.exports = BlurShader; 
