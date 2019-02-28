# @kawi/core

### The next generation module loader for nodejs

**@kawi/core** allows requiring modules in async and more elegant way, and use last features of EcmaScript (for example async/await) without requiring a lot of dependencies, packagers or build scripts

```bash
npm install @kawi/core
``` 

## Get started 

Create a main.js file

```javascript
var Kawi= require("@kawi/core") 
var KModule= Kawi.KModule

// enable KModule import using `import` syntax
KModule.injectImport()

// this will be async 
KModule.import("https://raw.githubusercontent.com/voxsoftware/kawi-core/master/example/http.js")

``` 


If you run the previous example, you will see and HTTP server example running.
Look the https://raw.githubusercontent.com/voxsoftware/kawi-core/master/example/http.js content

```javascript

import httpServer from './http-async.js'

var server= new httpServer()
server.listen(8081)
console.info("Open in browser: 127.0.0.1:8081")

var handle= async function(){
	var conn
	while(conn = await server.acceptAsync()){
		conn.res.write("Hello world! from URL: " + conn.req.url)
		conn.res.end()
	}
	console.info("Http server stopped")
}

handle()

``` 

Yes, you can import from urls or files, and inside *Kawi required files* you can import relative urls or file in the normal way using **import** and access to all **async/await** features


```javascript

// require a url
import httpServer from 'https://raw.githubusercontent.com/voxsoftware/kawi-core/master/example/http-async.js'

// require a file
import test from './test.js'

``` 


