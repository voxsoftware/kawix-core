# @kawix/core

### The next generation module loader for nodejs

**@kawix/core** allows requiring modules in async and more elegant way, and use last features of EcmaScript (for example async/await) without requiring a lot of dependencies, packagers or build scripts

```bash
npm install @kawix/core
``` 

## Get started 

Create a *test.js* file

```javascript
var Kawi= require("@kawix/core") 
var KModule= Kawi.KModule

// enable KModule import using `import` syntax
KModule.injectImport()

// this will be async 
KModule.import("https://raw.githubusercontent.com/voxsoftware/kawi-core/master/example/http.js")

// or if you want force ignore cache and always download before import
/*
KModule.import("https://raw.githubusercontent.com/voxsoftware/kawi-core/master/example/http.js", {
	"force": true
})
*/

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


## Features 

### 1. Full Ecmascript 2017 (async/await)

```javascript 

let value1= 7 ** 2
let arr= [10,23,4,NaN]

console.log(value1)
console.log(arr.includes(4))

let cars= {
	"BMW": 3,
	"Tesla": 2,
	"Toyota": 1
}
let values= Object.values(cars)
console.log(values)


for(let [key,value] of Object.entries(cars)){
	console.log(`key: ${key} value: ${value}`)
}


printInfo(1)


function getUser(userId){
	return new Promise((resolve)=>{
		setTimeout(resolve.bind(null, 'John'), 1000)
	})
}

async function printInfo(userId){
	let user= await getUser(userId)
	console.log(user)
}

```


### 2. Typescript support out of the box 

```typescript
function greeter(person: string) {
	return "Hello, " + person;
}


function sleep(timeout?: number){
	timeout= timeout || 0
	return new Promise(function(resolve, reject){
		setTimeout(resolve, timeout)
	})
}


async function foo() {
    try {
        var val = greeter("World!");
		console.log(val);
		
		console.log("Simulating async action... please wait 1 second")
		await sleep(1000)
		console.log("Finished")

    }
    catch(err) {
        console.log('Error: ', err.message);
    }
}

foo()
```


### 3. Imports are async, imports from URL

```javascript

import httpServer from 'https://raw.githubusercontent.com/voxsoftware/kawi-core/master/example/http-async.js'

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

