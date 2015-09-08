var vfs = require("vinyl-fs");
var fs = require("fs");
var through = require("through2");
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

function processFile (file, harness, cb) {
	var src = file.contents.toString();

	// need to hoist strict directive
	var pre = getPrefix(src);

	file.contents = new Buffer(pre + harness + src);
	cb(null, file);
}

module.exports = function test262Streamer (opt) {
	opt = opt || {};

	var files = (opt.files || ["**/*.js"]).map(function (file) { return path.join(__dirname, root) + file; });
	var harness = opt.harness;
	var harnessLoaded = "harness" in opt;

	return vfs.src(files)
		.pipe(through.obj(function (file, enc, done) {
			if (!harnessLoaded) {
				fs.readFile(path.join(__dirname, "harness.js"), function (err, contents) {
					console.log(err);

					harness = contents;
					harnessLoaded = true;
					processFile(file, harness, done);
				});
			} else {
				processFile(file, harness, done);
			}
		}));
};
