#!/usr/bin/env node
var args= [].concat(process.argv.slice(2))
var arg
var Kawix= require("../main")


while(arg = args.shift()){
    if(arg == "--reload" || arg == "--force"){
        Kawix.KModule.defaultOptions= {
            force: true
        }
    }
    else if(!arg.startsWith("--")){
        
        // require file using KModule
        Kawix.KModule.injectImport()
        Kawix.KModule.import(arg,{
            parent: process.cwd() + "/cli.js"
        }).then(function(){}).catch(function(e){
            console.error("Failed executing: ", e)
        })
    }
}

