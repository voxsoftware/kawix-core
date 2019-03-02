var eval1= function(str){
	return eval(str)
}
var Next= require("./NextJavascript")
var fs= require("fs")
var Os= require("os")
var Path= require("path")
var Module = require("module").Module
var Url= require('url')

var httpr={}

var Mod= exports.Module= function(){
}

Mod._cache = {}
Mod._cacherequire = {}
Mod._cacheresolve= {}
Mod._virtualfile= {}
Mod.cachetime= 5000

var createDefault=function(options){
	var defoptions= Mod.defaultOptions || exports.defaultOptions
	options= options || {}
	for(var id in defoptions){
		if(options[id] === undefined)
			options[id]= defoptions[id]
	}
	return options
}

Module._originalResolveFilename = Module._resolveFilename


var getKModule= function(filename){
	var nmod={
		filename: filename,
		require : Mod.require,
		import : Mod.import,
		addVirtualFile : Mod.addVirtualFile,
		extensions : Mod.extensions,
		replaceSyncRequire : Mod.replaceSyncRequire,
		removeCached : Mod.removeCached
	}
	return nmod 
}



var _getCachedFilename= function(uri, options){

	if(!uri.protocol){
		uri.protocol= "file:"
		uri.pathname= Path.normalize(uri.pathname)
	}

	var name= uri.format().replace(/\:|\?/g, '').replace(/\\/g, '/')
	if(uri.search){
		name += uri.search.replace(/\:|\?|\\/g, '')
	}
	var parts= name.split("/")
	parts= parts.filter(function(a){
		return !!a
	})
	if(options.virtual){
		parts.shift()
	}

	var full= parts.join(Path.sep)
	var kawi_dir= Path.join(Os.homedir(), ".kawi")
	var file_dir= Path.join(kawi_dir, full)
	var cache_dir= Path.dirname(file_dir)
	return {
		kawi_dir: kawi_dir,
		file_dir: file_dir,
		cache_dir: cache_dir ,
		parts: parts,
		full: full 
	}
}

var getCachedFilenameSync= function(uri, options){
	var result= _getCachedFilename(uri, options)
	var kawi_dir= result.kawi_dir
	var cache_dir= result.cache_dir 
	var file_dir= result.file_dir 
	var parts= result.parts 
	var full= result.full 
	var part

	try{
		if(fs.accessSync(cache_dir, fs.constants.F_OK)){
			return file_dir 
		}
	}catch(e){}

	var path= kawi_dir
	try{
		fs.accessSync(path, fs.constants.F_OK)
	}catch(e){
		fs.mkdirSync(path)
	}

	for(var i=0;i<parts.length-1;i++){
		part= parts[i]
		path= Path.join(path, part)
		try{
			fs.accessSync(path, fs.constants.F_OK)
		}catch(e){
			fs.mkdirSync(path)
		}
	}

	return file_dir

}


var getCachedFilename= function(uri, options){
	var result= _getCachedFilename(uri, options)
	var kawi_dir= result.kawi_dir
	var cache_dir= result.cache_dir 
	var file_dir= result.file_dir 
	var parts= result.parts 
	var full= result.full 

	
	return new Promise(function(resolve, reject){
		var i= 0, part
		var createTree= function(path){
			try{
				if(!path){
					path= kawi_dir
				}
				fs.access(path, fs.constants.F_OK, function(err){
					if(err){
						fs.mkdir(path, function(err){
							if(err) return reject(err)
							part= parts[i]
							if(i == parts.length - 1)
								return resolve(file_dir)
							i++ 
							return createTree(Path.join(path, part))
						})
					}else{
						part= parts[i]
						if(i == parts.length - 1)
							return resolve(file_dir)
						i++ 
						return createTree(Path.join(path, part))
					}
				})
			}catch(e){
				reject(e)
			}
		}

		fs.access(cache_dir, fs.constants.F_OK, function(err){
			if(err) return createTree()
			return resolve(file_dir)
		})
	})
	


}

var builtinModules = require("module").builtinModules
Module._resolveFilename= function(name,parent){

	//console.info(Mod._virtualfile)
	if(name.startsWith("___kawi__internal__")){
		return name 
	}
	else if(Mod._virtualfile[name]){
		return name 
	}
	else if(builtinModules.indexOf(name) >= 0){
		return name
	}
	else{
		
		if(parent && parent.filename && parent.filename.startsWith("/virtual")){
			// Allow resolve
			result= Mod.resolveVirtual(name,parent)
			if(!result){
				return Module._originalResolveFilename.apply(Module, arguments)			
			}
			return result
		}
	}
	return Module._originalResolveFilename.apply(Module, arguments)
}


Mod.resolveVirtual= function(name, parent){
	var possibles=[]
	var path,dirname, path1
	if(name.startsWith("/virtual")){
		possibles.push(name)
	}
	else{
		dirname= Path.dirname(parent.filename)
	
		if(name.startsWith("./") || name.startsWith("../")){
			path= Path.normalize(Path.join(dirname, name))
			possibles.push(path)
		}
		else{
			path= Path.join(dirname, "node_modules", name)
			possibles.push(path)
			path1= dirname 
			while(path1 && path1 != "/virtual" && path1 != "/"){
				path1= Path.dirname(path1)
				path= Path.join(path1, "node_modules", name)
				possibles.push(path)
			}
		}
	}
	var possiblesFromFile= function(name){
		var possibles=[] 
		for(var ext in Mod.extensions){
			possibles.push(name+ext)
		}
		return possibles
	}


	var possiblesFromFolder= function(name){
		var possibles={}, path, data, pjson, rpossibles=[]

		// package json?
		path= Path.join(name,"package.json")
		data= Mod._virtualfile[path]
		if(data){
			if(typeof data == "function")
				data= data()			
			
			pjson= data.content
			pjson= JSON.parse(data.content)
			if(pjson.main){
				path= Path.normalize(Path.join(name, pjson.main))
				possibles[path]= true 
				for(var ext in Mod.extensions){
					possibles[path+ext]= true 
				}
			}
		}


		possibles[Path.join(name,"index.js")]= true 
		for(var ext in Mod.extensions){
			possibles[Path.join(name,"index"+ext)]= true 
		}

		for(var id in possibles){
			rpossibles.push(id)
		}
		return rpossibles 
	}

	


	var processPossibles= function(possibles, deep=0){
		var possible, vfile, result, possibles1
		for(var i=0;i<possibles.length;i++){
			possible= possibles[i]
			vfile= Mod._virtualfile[possible]
			if(vfile){
				if(typeof vfile == "function")
					vfile= vfile()
				
				if(vfile.stat.isdirectory){
					possibles1= possiblesFromFolder(possible)
					result= processPossibles(possibles1, deep+1)
					if(result)
						return result
				}
				else{
					if(vfile.content){
						return possible
					}
				}
			}
			else{
				if(deep==0){
					possibles1= possiblesFromFile(possible)
					result= processPossibles(possibles1, deep+1)
					if(result)
						return result 
				}
			}
		}
	}


	path= processPossibles(possibles)
	//if(!path)
	//	throw new Error("Failed resolve " + name + " from " + parent.filename)

	return path
}





var validateFileUrl= function(file){
	var uri = Url.parse(file)
	if (uri.protocol) {
		if (uri.protocol != "http:" && uri.protocol != "https:" && uri.protocol != "file:") {
			throw new Error("Protocol " + uri.protocol + " not supported")
		}
	}
	return uri 
}


Mod.replaceSyncRequire= function(originalrequire, parent){
	return function(name){		
		if(builtinModules.indexOf(name) >= 0)
			return originalrequire(name)

		var file= Module._resolveFilename(name, parent)
		if(file.startsWith("/virtual/")){
			return Mod.requireVirtualSync(file)
		}else{
			return originalrequire(name,parent)
		}
	}
}

Mod.requireVirtualSync= function(file){
	var module= Mod._cacherequire[file]
	if(module){
		return module.exports
	}
	var ast= Mod.compileSync(file)
	var nmod= getKModule(file)

	module = new Module(file)
	module.exports = {}
	module.filename= file
	module.KModule= nmod 
	Module._cache[file] = module

	
	var code= "exports.__kawi= function(KModule){\n" +
	"\trequire= KModule.replaceSyncRequire(require,module);\n"
	+ ast.code + "\n}"
	
	module._compile(code, file)


	module.exports.__kawi(nmod)
	Mod._cacherequire[file] = module

	return module.exports
}



Mod.compileSync= function(file, options){
	var vfile= Mod._virtualfile[file]
	if(typeof vfile == "function"){
		vfile= vfile()
	}

	var ext= Path.extname(file)
	var cached2, stat1, stat2, compile , transpilerOptions, ast
	var uri = validateFileUrl(file)

	if(ext == ".json"){
		ast={
			"code": "module.exports=" + vfile.content
		}
		return ast
	}
	else{

		cached2= getCachedFilenameSync(uri,{
			virtual: true
		})
		try{
			stat1= fs.statSync(cached2)
		}catch(e){
			if(e.code != "ENOENT"){
				throw e 
			}
			stat1= null 
		}

		if(stat1){
			stat2= vfile.stat 
			if(!(stat2.mtime instanceof Date))
				stat2.mtime= new Date(stat2.mtime)
			
			if(stat1.mtime.getTime() < stat2.mtime.getTime())
				compile= true 

		}else{
			compile= true
		}

		if(compile){


			for(var ext in Mod.extensions){
				if(file.endsWith(ext)){
					if( typeof Mod.extensions[ext] == "function"){
						ast= Mod.extensions[ext](vfile.content, file, options)
						//value= ast.code
						
					}
				}
			}

			if(ast && ast.transpilerOptions){
				transpilerOptions= ast.transpilerOptions
			}else{
				transpilerOptions = {
					presets: ['es2015', 'es2016', 'es2017'],
					sourceMaps: true,
					comments: true,
					filename: file
				}	
				if(file.endsWith(".ts")){
					transpilerOptions.presets=['typescript']
				}
			}
			
			if(!ast || ast.transpile !== false)
				ast= Next.transpile(ast ? ast.code : vfile.content, transpilerOptions)
			
			if(ast){
				str= JSON.stringify(ast)
				fs.writeFileSync(cached2, str)
				delete ast.options
				ast.time= Date.now() 
				Mod._cache[file]= ast
			}
			return ast

		}
		else{
			ast= JSON.parse(fs.readFileSync(cached2, 'utf8'))
			return ast 
		}
	}
}





/** resolve a file in current module, and require */
exports.import= Mod.import= function(file, options){

	var uri2 , promise, original, filename
	original= file
	options= createDefault(options)


	if(builtinModules.indexOf(file) >= 0){
		return require(file)
	}


	var uri = validateFileUrl(file)
	filename = this.filename || "current"



	var getBetter= function(){

		if(file.startsWith("/virtual")){
			file= Mod.resolveVirtual(file,{
				filename: options.parent
			})
			if(!file){
				throw new Error("Cannot resolve " + original + " from " + filename)
			}
			return Mod.require(file,options)
		}
		
		promise = new Promise(function (resolve, reject) {
			var ids = Object.keys(Mod.extensions)
			var i = -1
			var f = function (file, ext) {
				var cfile = file
				if (ext) {
					cfile = file + ext
				}

				fs.access(cfile, fs.constants.F_OK, function (err) {
					if (err) {
						// test next
						i++
						ext = ids[i]
						if (!ext)
							return reject(new Error("Cannot resolve " + original + " from " + filename))

						return f(file, ext)
					}

					return resolve(Mod.require(cfile, options))
				})
			}
			f(file)
		})
		return promise
	}

	if(uri.protocol || Path.isAbsolute(file)){
		if(uri.protocol && uri.protocol != "file:"){
			return Mod.require(file, options)
		}
		else{
			if(uri.protocol)
				file= Url.fileURLToPath(file)
			file= Path.normalize(file)
		}
		return getBetter()
	}
	else{

		// create a path from parent 
		if(!this.filename){
			// is good get from cwd? 
			this.filename= options.parent
			if(!this.filename)
				throw new Error("Cannot resolve file or URL: " + file)
		}
		
		
		
		if (file.startsWith("./") || file.startsWith("../")) {
			uri2 = Url.parse(this.filename)
			if (uri2.protocol) {
				if(file.startsWith("./"))
					file= file.substring(2)

				file = Url.resolve(this.filename, file)
				return Mod.require(file, options)
			}
			else{

				// find this or with extensions
				file= Path.join(Path.dirname(this.filename), file)
				return getBetter()
			}
			

		}
		else {
			file= require.resolve(file)
			return Mod.require(file, options)
		}

	}

}

/** Allow create more extensions */
Mod.extensions= {
	".json": null,
	".js": null, 
	".es6": null
}



/** Allow importing modules in KModule way by default, with import keyword */
exports.injectImport= Mod.injectImport= function(){
	Mod.__injected= true 
}



Mod.__num= 0
var changeSource= function(source){
	var reg = /import\s+.+\s+from\s+(\"|\')(.+)(\"|\')(\;|\r|\n)/g	
	var num= Mod.__num++

	var mod, op
	var unq = "___kawi__internal__" + Date.now().toString(28) + num 
	var cid= -1
	var imports= {
		unq:unq,
		mods:[]
	}

	source= source.replace(reg, function (a, b, c, d) {
		try{
			var name = eval(b + c + d)
			if(builtinModules.indexOf(name) >= 0)
				return a 
			

			imports.mods.push(name)
			cid++
			return a.replace(b+c+d, "'"+ unq + "." + cid + ".js'")
		}catch(e){
			return a
		}
	})

	if(imports.mods && imports.mods.length){
		var morecode= ['var ___kawi__async= async function(KModule){']
		for(var i=0;i<imports.mods.length;i++){
			mod= imports.mods[i]
			op= {
				uid: unq + "." + i + ".js"
			}
			morecode.push("\tawait KModule.import("+JSON.stringify(mod)+", "+ JSON.stringify(op) +")")
		}
		morecode.push("}")
		imports.inject= morecode.join("\n")
		imports.source= source + "\n" + imports.inject 
	}
	else{
		imports.source= source
		//console.info("Source: ", source)
	}
	return imports 
}


var asynchelper = "function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }\n\nfunction _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"next\", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"throw\", err); } _next(undefined); }); }; }"
var loadInjectImportFunc= function(ast){

	
	var code, injectCode, ucode
	if(!ast.injectCode){
		var i= ast.code.indexOf("var ___kawi__async =")
		if(i >= 0){
			code= ast.code.substring(0,i)
			injectCode= ast.code.substring(i+20)
			ast.code = code 
			ast.injectCode= injectCode.trim()
			i= ast.injectCode.indexOf("function")
			ast.injectCode= ast.injectCode.substring(i)
		}
	}

	if(ast.injectCode && !ast.inject){		
		ucode= "(function(){" + asynchelper + "\n\nreturn " + ast.injectCode + ";\n})()"		
		ast.inject= eval(ucode)
	}

}




/** Remove a module from cache */
exports.removeCached= Mod.removeCached= function(file){
	var cached = Mod._cacherequire[file]
	if(cached){
		if (cached.__kawi_uid && cached.__kawi_uid.length){
			for (var i = 0; i < cached.__kawi_uid.length;i++){
				delete Module._cache[cached.__kawi_uid[i]]
			}
		}
		delete Module._cache[file]		
		delete Mod._cacherequire[file]
	}
	delete Mod._cache[file]
}


exports.addVirtualFile= Mod.addVirtualFile= function(file, data){
	var path= Path.join("/virtual", file)
	Mod._virtualfile[path]= data
	data.time= Date.now()
}




/** require a module (file or url) */
exports.require= Mod.require= function(file, options){
	options=options || {}
	var cached = Mod._cacherequire[file]
	
	var promise, promise2 , generate, module


	var generate= function(ast, resolve, reject){
		module = new Module(file)
		module.exports = {}
		module.filename= file

		var nmod = getKModule(file)		
		module.KModule = nmod
		module.__kawi_time= Date.now()


		var continue1 = function () {

			//console.info("exports.__kawi= function(KModule){" + ast.code + "}")
			module._compile("exports.__kawi= function(KModule){\n" +
				"\trequire= KModule.replaceSyncRequire(require,module);\n"
				+ ast.code + "\n}", file)

			// custom mod for each file 
			Module._cache[file] = module
			Mod._cacherequire[file] = module
			module.__kawi_uid = {}
			if (options.uid)
				module.__kawi_uid[options.uid] = true


			var maybePromise = module.exports.__kawi(nmod)
			
			
			if(module.exports && module.exports.then){
				module.exports.then(function(result){
					module.exports= result
					Module._cache[options.uid || "_internal_kawi_last.js"] = module			
					resolve(module.exports)
				}).catch(reject)
			}
			else{
				Module._cache[options.uid || "_internal_kawi_last.js"] = module			
				return resolve(module.exports)
			}
		}
		if (ast.injectCode && !ast.inject) {
			// inject the code 
			loadInjectImportFunc(ast)
		}

		if (ast.inject) {
			ast.inject(nmod).then(function () {
				continue1()
			}).catch(reject)
		} else {
			continue1()
		}
	}

	if(cached){
		var returnData= function(){
			Module._cache[file] = cached
			if (options.uid)
				cached.__kawi_uid[options.uid] = true

			Module._cache[options.uid || "_internal_kawi_last.js"] = cached
			return cached.exports
		}


		if (cached.exports.kawixDynamic && ((Date.now() - cached.__kawi_time) >
			(cached.exports.kawixDynamic.time || Mod.cachetime))){

			// exported as dynamicMethod 
			// get if changed ...
			options.ignoreonunchanged= true 
			promise = Mod.compile(file, options)
			promise2 = new Promise(function (resolve, reject) {
				promise.then(function(ast){
					if(!ast){
						return resolve(returnData()) 
					}else{
						Mod.removeCached(file)
						return generate(ast, function(){
							// this allow hot reloading modules 
							if(typeof module.exports.kawixDynamic.reload == "function"){
								return resolve(module.exports.kawixDynamic.reload(cached.exports, module.exports))
							}
							return resolve(module.exports)
						}, reject)
					}
				})
			})
			return promise2
		}else{
			return returnData()
		}	

	}


	promise= Mod.compile(file,options)
	promise2= new Promise(function(resolve, reject){
		promise.then(function(ast){
			return generate(ast,resolve,reject)			
		}).catch(reject)
	})

	return promise2

}


var readHttp= function(url){
	var xhttp= url.startsWith("http://") ? "http" : "https"
	var http= httpr[xhttp]
	if (!http)
		http = httpr[xhttp]= require(xhttp)
	
	var promise= new Promise(function(resolve, reject){
		var callback= function(resp){
			
			var buf = [], code
			if(resp.statusCode == 302){
				var loc= resp.headers.location
				if(!loc.startsWith("http:") && !loc.startsWith("https:")){
					loc= Url.resolve(url, loc)	
				}
				return resolve(readHttp(loc))				
			}
			else if(resp.statusCode != 200){
				return reject(new Error("Invalid response from "  + url))
			}
			else{
				
				resp.on("data",function(b){
					if(!Buffer.isBuffer(b))
						b= Buffer.from(b)
					buf.push(b)
				})
				resp.on("error", reject)
				resp.on("end", function(){
					buf= Buffer.concat(buf)
					code= buf.toString('utf8')
					
					return resolve({
						code: code,
						"type": resp.headers["content-type"]
					})
				})
			}
		}
		
		http.get(url, callback).on("error", reject)
	})
	return promise
}





/** Transpile moden es2017 code to old javascript */
exports.compile= Mod.compile= function(file, options){

	var source= ''
	
	options= createDefault(options)
	source= options.source
	if(options.injectImport === undefined){
		options.injectImport= Mod.__injected
	}

	var uri= validateFileUrl(file)
	if(uri.protocol == "file:"){
		file= Url.fileURLToPath(file)
		file= Path.normalize(file)
	}

	var basename= uri.pathname
	var transpilerOptions, cached1, cached2, fromHttp
	if (uri.protocol && uri.protocol != "file:") {
		fromHttp= true // remote 
	}

	var json, stat, statc, str, ucached, isjson, virtualFileCache

	var getstat= function(file, callback){
		if(Mod._virtualfile[file]){
			virtualFileCache= Mod._virtualfile[file]
			if(typeof virtualFileCache == "function")
				virtualFileCache= virtualFileCache()
			if(!(virtualFileCache.stat.mtime instanceof Date))
				virtualFileCache.stat.mtime= new Date(virtualFileCache.stat.mtime)
			return callback(null, virtualFileCache.stat)
		}else{
			return fs.stat(file, callback)
		}
	}

	var readfile= function(file, callback){
		if(!virtualFileCache){
			if(Mod._virtualfile[file]){
				virtualFileCache= Mod._virtualfile[file]
				if(typeof virtualFileCache == "function")
					virtualFileCache= virtualFileCache()
				if(!(virtualFileCache.stat.mtime instanceof Date))
					virtualFileCache.stat.mtime= new Date(virtualFileCache.stat.mtime)
				
			}
		}
		if(virtualFileCache){
			return callback(null, virtualFileCache.content)
		}
		else{
			return fs.readFile(file, 'utf8', callback)
		}
	}


	var promise= new Promise(function(resolv, reject){

		var resolve= function(value){
			if(value){
				value.time= Date.now() 
				Mod._cache[file]= value 
			}
			return resolv(value)
		}
		var action= ''
		var f 
		var ug = function (err, value) {
			
			if(!action){
				
				action= 'cached3'
				return getCachedFilename(uri, options).then(function(val){
					cached2= val 
					cached1= Path.dirname(val)
					return f()
				}).catch(reject)

			}

			else if(action == "cached"){
				
				action = "cached3"
				if (err) {					
					fs.mkdir(cached, f)
				}
				return f()

			}
			
			else if(action == "cached3"){
				action = "cached4"
				return fs.access(cached2, fs.constants.F_OK, f)
			}
			else if(action == "cached4"){
				if(!err){
					action= "stat"
				}
				else{
					action= "compile"
				}
			}			
			else if(action == "stat"){
				if(err)
					return reject(err)

				

				ucached= Mod._cache[file]
				if(ucached &&  (Date.now() - ucached.time <= Mod.cachetime)){
					if(options.ignoreonunchanged)
						return resolv(null)
					return resolv(ucached)
				}

				action= 'stat2'				
				return fs.stat(cached2, f)
			}
			else if (action == "stat2") {
				if (err)
					return reject(err)
				
				action = 'compare'
				statc = value
				if(fromHttp && !options.force){
					return f(null, statc)
				}
				else if(fromHttp && options.force){
					return f(null, {
						mtime: new Date()
					})
				}
				return getstat(file, f)
			}

			else if (action == "compare") {
				if (err)
					if(!source)
						return reject(err)
					else 
						stat= {mtime:new Date(options.mtime)}

				stat = value
				if(stat.mtime.getTime() > statc.mtime.getTime()){
					action= "compile"
					return f()
				}
				else{

					if(options.ignoreonunchanged)
						return resolve(null)

					
					// good, return the cached
					action= "json"
					return fs.readFile(cached2, 'utf8', f)

				}
			}
			else if (action == "json") {
				if (err) {
					return reject(err)
				}

				json= JSON.parse(value)
				return resolve(json)
			}
			else if(action == "compile"){
				if (err) {
					return reject(err)
				}

				action= "transpile"
				if(source){
					return f(null, source)
				}else{
					
					if(fromHttp){
						if (!process.env.DISABLE_COMPILATION_INFO) {
							console.info("Downloading: " + file + " ...")
						}
						
						return readHttp(file).then(function (value) {
							return f(null, value)
						}).catch(reject)
					}
					return readfile(file, f)

				}
			}
			else if (action == "transpile") {
				if (err) {
					return reject(err)
				}
				if(!process.env.DISABLE_COMPILATION_INFO){
					console.info("Compiling file: " + file)
				}

				if(value.type){
					
					isjson= value.type.startsWith("application/json")
					value= value.code 
				}
				else{
					isjson= file.endsWith(".json")
				}

				if(isjson){
					json={
						code: "module.exports= " + value
					}
				}
				else{
					

					for(var ext in Mod.extensions){
						if(basename.endsWith(ext)){
							if( typeof Mod.extensions[ext] == "function"){
								json= Mod.extensions[ext](value, file, options)
								value= json.code 
							}
						}
					}

					if (options.injectImport && (!json || json.transpile !== false)){
						imports= changeSource(value)	
						value= imports.source 
					}


					if(json && json.transpilerOptions){
						transpilerOptions = json.transpilerOptions
					}
					else{
						transpilerOptions = {
							presets: ['es2015', 'es2016', 'es2017'],
							sourceMaps: true,
							comments: true,
							filename: file
						}

						if(basename.endsWith(".ts")){
							transpilerOptions.presets= ["typescript"]
						}
					}

					if(!json || json.transpile !== false){
						json= Next.transpile(value, transpilerOptions)
						delete json.options
						if(options.injectImport){					
							loadInjectImportFunc(json)
						}
					}

				}

				str= JSON.stringify(json)
				action= "writecache"
				fs.writeFile(cached2, str, f)

			}
			else if (action == "writecache") {
				if(err){
					return reject(err)
				}
				// good return result 
				return resolve(json)
			}
			return f()
		}
		f= function(err, data){
			try{
				ug(err,data)
			}catch(e){
				
				return reject(e)
			}
		}
		f()
	})
	return promise 
}

