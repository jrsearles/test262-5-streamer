var fs = require("vinyl-fs");
var through = require("through2");
var merge = require("merge-stream");
var path = require("path");
var acorn = require("acorn");

var root = "node_modules/test262/test/suite/";

function getPrefix (src) {
	try {
		var ast = acorn.parse(src);
		var body = ast.body[0];
		if (body
			&& body.type === "ExpressionStatement"
			&& body.expression.type === "Literal"
			&& body.expression.value === "use strict") {

			// hoist strict directive so it precedes test harness
			return body.expression.raw + "\n";
		}
	}	catch (err) { }

	return "";
}

module.exports = function test262Streamer (opt) {
	opt = opt || {};

	var files = (opt.files || ["**/*.js"]).map(function (file) { return path.join(__dirname, root) + file; });
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
				var src = file.contents.toString();

				// need to hoist strict directive
				var pre = getPrefix(src);

				file.contents = new Buffer(pre + harness + src);
				done(null, file);
			}));

	return stream1 ? merge(stream1, stream2) : stream2;
};
