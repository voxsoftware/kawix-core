var Kawi = require("../../main.js")
var KModule = Kawi.KModule
var Path= require("path")

var path = Path.normalize(__dirname + "/ecmascript2017.js")

// enable KModule import using `import` syntax
KModule.injectImport()

// this will be async 
KModule.import(path)