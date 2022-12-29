# Neutrino WebFramework
Neutrino is a web framework made with typescript made by Ali Al Hadi Al Husseini

### Intalizing An App 
```javascript
const Neutrino = require("./neutrino")
const app = new  Neutrino() // intalizing  a port now is optional
```

### Routing and Routers

#### Adding A Route
```javascript
const Neutrino = require("./neutrino")
const app = new  Neutrino()

app.addroute("/main", (req, res) => {
     res.write("<h1>Hello World </h1>");
 });
 
```
#### Adding A Dynamic Route
```javascript
const Neutrino = require("./neutrino")
const app = new  Neutrino()

app.addroute("/<name>", (req, res,dynamicParts) => {
     res.write("<h1>Hello "+ dynamicParts.name + "</h1>");
 });//priority is always givin to None dynamic  routes
    
```
#### Route overwriting
```javascript
const Neutrino = require("./neutrino")
const app = new  Neutrino()

app.addroute("/main", (req, res) => {
     res.write("<h1>Hello World </h1>");
 });
 app.addroute("/main", (req, res) => {
     res.write("<h1>Hello World !</h1>");
 });
```
###### Re-initializing the route causes the route functions and methods to be overwritten 

#### Adding A Allowed Methods
```javascript
const Neutrino = require("./neutrino")
const app = new  Neutrino()

app.addroute("/main", (req, res) => {
     res.write("<h1>Hello World </h1>");
 },["GET","POST"]);
 
```
###### This method is used when you want to handle multiple methods within the same function.

#### Adding A Specfic route method
```javascript
const Neutrino = require("./neutrino")
const app = new  Neutrino()

app.get("/main", (req, res) => {
     res.write("<h1>Hello World </h1>");
 });
// there are also post,put,delete methods 
 
```
###### This method is used when you want to process one method at a time.


#### Adding A Router
```javascript
const Neutrino = require("./neutrino")
const Router = require("./neutrino")
const app = new  Neutrino()
const router = new Router(app,'/main',(req:any, res:any, dynamicpar:any) => {
       res.write("<h1>Hello World </h1>");
     })
router.addroute("/profile", (req, res) => {
     res.write("<h1>Hello World </h1>");
 });// then the route would be /main/profile
    // u ca
```
###### Added a requirement for the router to have an app argument during initialization, as this makes it easier to import a single file into multiple files rather than importing multiple files into a single file, particularly if the router is located in a different file


### Middlwares and Afterwares
#### Adding A middleware
```javascript
const Neutrino = require("./neutrino")
const app = new  Neutrino()
function middleware(req,res,next){
    //req and res are request and reponse object 
    //next is the next middleware
    //does something
    //you always should call the next function or the other middlwares will not excute
    console.log(req.ip)
    next()
}
app.addMiddlWare(middlware)
// or you can also use app.use method
app.use(middlware)
 
```
#### Adding A afterware
```javascript
const Neutrino = require("./neutrino")
const app = new  Neutrino()
function afterware(req,res,next){
    //req and res are request and reponse object 
    //next is the next middleware
    //does something
    //you always should call the next function or the other middlwares will not excute
    console.log(req.ip)
    next()
}
app.addAfterWare(afterware)

```
#### inserting middlware and after wares
```javascript
const Neutrino = require("./neutrino")
const app = new  Neutrino()
function afterware(req,res,next){
    console.log(req.ip)
    next()
}
app.insertAfterwares(afterware,0)

```
##### this makes the afterware be excuted at first you can use app.insertMiddleware for middlwares 

#### Skipping middlware and after wares
```javascript
const Neutrino = require("./neutrino")
const app = new  Neutrino()
function afterware(req,res,next){

    console.log(req.ip)
    // app.skipMiddlewares for middlwares
    if(req.ip == "0.0.0.0") app.skipAfterwares()
    next()
}
app.addAfterWare(afterware)

```
###### If you call the app.skipAfterwares/skipMiddlewares it makes the app skip all remaing middlwares




 ###### The module also has Request and Response classes that has a couple of functionality (parseing cookies,getting client ip, etc..)
 ###### and there are a number of general purpose functions  (reading html content)
 
 
