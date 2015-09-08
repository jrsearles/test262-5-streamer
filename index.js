var fs = require("vinyl-fs");
var through = require("through2");
var merge = require("merge-stream");

var root = "node_modules/test262/test/suite/";

module.exports = function test262Streamer (opt) {
	opt = opt || {};

	var files = (opt.files || ["**/*.js"]).map(function (file) { return root + file; });
	var harness = opt.harness;
	var stream1;

	if (!("harness" in opt)) {
		stream1 = fs.src(["harness.js"])
			.pipe(through.obj(function (file, enc, done) {
				harness = file.contents.toString();
				done();
			}));
	}

	var stream2 = fs.src(files)
			.pipe(through.obj(function (file, enc, done) {
				var src = harness + file.contents.toString();

				file.contents = new Buffer(src);
				done(null, file);
			}));

	return stream1 ? merge(stream1, stream2) : stream2;
};
