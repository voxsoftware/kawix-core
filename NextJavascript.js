var Babel
var runtime= global.regeneratorRuntime= require("./runtime")

var transpiledLine = "\n// kawi converted. Preserve this line, Kawi transpiler will not reprocess if this line found"
var Next= exports.default= function(){}
Next.prototype.transpile= function(source, options){

	if(source.indexOf(transpiledLine) >= 0){
		return {
			code: source
		}
	}

	if(!Babel)
		Babel = require("./babel")

	if (!options) {
		options = {
			presets: ['es2015','es2016','es2017'],
			sourceMaps: true,
			comments: false
		}
	}
	var result= Babel.transform(source, options)
	if(result.code){
		result.code += transpiledLine
	}
	return result

}



exports.Next= Next
exports.transpile= function(a,b){
	var next= new Next()
	return next.transpile(a,b)
}