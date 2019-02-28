var Kawi = require("../main.js")
var KModule = Kawi.KModule

// enable KModule import using `import` syntax
KModule.injectImport()

// this will be async 
KModule.import("https://raw.githubusercontent.com/voxsoftware/kawi-core/master/example/http.js")