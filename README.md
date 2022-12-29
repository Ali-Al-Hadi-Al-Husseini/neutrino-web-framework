# Neutrino WebFramework
Neutrino is a web framework made with typescript made by Ali Al Hadi Al Husseini

#### Intalizing An App 
```javascript
const Neutrino = require("./neutrino")
const app = new  Neutrino() // intalizing  a port now is optional
```
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
#### Adding A Allowed Methods
```javascript
const Neutrino = require("./neutrino")
const app = new  Neutrino()

app.addroute("/main", (req, res) => {
     res.write("<h1>Hello World </h1>");
 },["GET","POST"]);
 
```
#### Adding A middleware
```javascript
const Neutrino = require("./neutrino")
const app = new  Neutrino()
function middleware(req,res,next){
    //req and res are request and reponse object 
    //next is the next middleware
    //does something
    //you always should call the next function or the other middlwares will not excute
}
app.addMiddlWare(middlware)
// or you can also use app.use method
app.use(middlware)
 
```

#### Adding A Router
```javascript
const Neutrino = require("./neutrino")
const Router = require("./neutrino").Router
const app = new  Neutrino()
const router = new Router(app,'/main',(req:any, res:any, dynamicpar:any) => {
       res.write("<h1>Hello World </h1>");
     })
router.addroute("/profile", (req, res) => {
     res.write("<h1>Hello World </h1>");
 });// then the route would be /main/profile
    // u can add middlware and methods the same way before
 ```
 ###### The module also has Request and Response classes that has a couple of functionality (parseing cookies,getting client ip, etc..)
 ###### and there are a number of general purpose functions  (reading html content)
 
 
