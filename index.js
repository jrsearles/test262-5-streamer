var vfs = require("vinyl-fs");
var fs = require("fs");
var through = require("through2");
var path = require("path");
var acorn = require("acorn");

var root = "node_modules/test262/test/suite/";

function isStrict (src) {
	try {
		var ast = acorn.parse(src);
		var body = ast.body[0];
		if (body
			&& body.type === "ExpressionStatement"
			&& body.expression.type === "Literal"
			&& body.expression.value === "use strict") {
				
			return true;
		}
	}	catch (err) { }

	return false;
}

function processFile (file, harness, cb) {
	var src = file.contents.toString();

	file.useStrict = isStrict(src);
	file.contents = new Buffer(harness + src);
	
	cb(null, file);
}

module.exports = function test262Streamer (opt) {
	opt = opt || {};
	
	function adjustGlob (pattern) {
		var base = opt.base || path.join(__dirname, root);
		if (pattern[0] === "!") {
			return "!" + base + pattern.substr(1);
		}
	
		return base + pattern;
	}

	var files = (opt.files || ["**/*.js"]).map(adjustGlob);
	var harness = opt.harness;
	var harnessLoaded = "harness" in opt;

	return vfs.src(files)
		.pipe(through.obj(function (file, enc, done) {
			if (!harnessLoaded) {
				fs.readFile(path.join(__dirname, "harness.js"), function (err, contents) {
					harness = contents;
					harnessLoaded = true;
					processFile(file, harness, done);
				});
			} else {
				processFile(file, harness, done);
			}
		}));
};
