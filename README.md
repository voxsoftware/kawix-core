# @kawix/core

### The next generation module loader for nodejs

**@kawix/core** allows requiring modules in async and more elegant way, and use last features of EcmaScript (for example async/await) without requiring a lot of dependencies, packagers or build scripts



## Get started 

**Option 1**. Install global and execute example directly from terminal

```bash
> npm install -g @kawix/core
> kwcore "https://raw.githubusercontent.com/voxsoftware/kawi-core/master/example/http.js"
``` 

**Option 2**. Install local and execute example from node_modules/.bin

```bash
> npm install @kawix/core
> node_modules/.bin/kwcore "https://raw.githubusercontent.com/voxsoftware/kawi-core/master/example/http.js"
``` 

**Option 3**. Create a *test.js* file

```bash
> npm install @kawix/core
``` 

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

All this examples can be imported with KModule, like *Get Started* example

### 1. Full Ecmascript 2017 (async/await)

Create an .es6 or .js with following content and import with KModule

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

Create an .ts with following content and import with KModule

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

Create an .es6 or .js with following content and import with KModule

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

**IMPORTANT:** 

1. *@kawix/core* doesn't resolve dependencies like node.js. For example, this code *import xx from 'request'* will fallback to *node.js* internal resolve method requiring package *request*. The idea of *@kawix/core* is be simplier, and inspired in *deno* allow imports from absolute, relative and URL paths. Also, like *@kawix/core* doesn't resolve dependencies like node.js, you cannot expect that importer search *package.json* or *index.js* if you import a folder. You should specify imports to files no folders 


2. *@kawix/core* execute imports before all other code. This means, that you should not call any function or make any operations between imports

Think in this code: 

```javascript 
// is native method, is untouched
import fs from 'fs' 
// is processed by kawix
import http from 'https://raw.githubusercontent.com/voxsoftware/kawi-core/master/example/http.js' 
// this is BAD, not recommended
makeAnyOperation() 

import other from './other.js'

export default function(){
	// any operation
	return action()
}
```

Will be translated to something like this (before transpiling): 

```javascript 
import fs from 'fs'
import http from 'cached_result_on_1'

makeAnyOperation()

import other from 'cached_result_on_2'


export default function(){
	// any operation
	return action()
}

// THIS will be executed before all file code 
var __kawi_async= async function(){
	await KModule.import('https://raw.githubusercontent.com/voxsoftware/kawi-core/master/example/http.js', {
		// this ensure create a cache for be usable later with import
		uid: 'cached_result_on_1' 
	})
	await KModule.import('./other.js', {
		// this ensure create a cache for be usable later with import
		uid: 'cached_result_on_2' 
	})
}
``` 