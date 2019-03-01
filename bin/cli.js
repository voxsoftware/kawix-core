#!/usr/bin/env node
var file= process.argv[2]
if(file && !file.startsWith("--")){

    // require file using KModule
    var Kawix= require("../main")
    Kawix.KModule.injectImport()
    Kawix.KModule.import(file,{
        parent: process.cwd() + "/cli.js"
    }).then(function(){}).catch(function(e){
        console.error("Failed executing: ", e)
    })

}