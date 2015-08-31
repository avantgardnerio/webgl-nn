var IdxFile = require('./IdxFile');

function IdxFileReader() {
}

IdxFileReader.prototype = new Object();
IdxFileReader.prototype.constructor = IdxFileReader;

IdxFileReader.prototype.loadFile = function (dataView) {
    var magic = dataView.getUint32(0);

    // Image file
    if (magic == 2051) {
        return new IdxFile(dataView);
    }

    // Label file - TODO: Include labels in IdxFile object
    if (magic == 2049) {
        var lblCnt = dataView.getUint32(pos += 4);
        for (var lblIdx = 0; lblIdx < lblCnt; lblIdx++) {
            var lbl = dataView.getUint8(pos + lblIdx);
            console.log("lbl=" + lbl);
        }
        return;
    }

    throw "Unknown magic value: " + magic;
};


module.exports = IdxFileReader;
