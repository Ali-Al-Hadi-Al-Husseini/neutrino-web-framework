
const http = require("http");
const fs = require('fs');

class Route{
    parent:any;
    children: Route[];
    func: Function;
    methods: string[];
    route:string;
    fullName:string;
    dynamic:boolean;
    // dynamicVar:string;

    constructor(route:string, func:Function,methods:string[]=["GET"]){

        this.parent = null;
        this.children = [];
        this.func = func;
        this.route = route;
        this.methods = methods;
        this.fullName = route;
        this.dynamic = route[0] === '<' ? true : false
        // this.dynamicVar = [route.slice(2,route.length -1)]
        

    }

    addChild(child:Route){
        child.setFullRoute(this.route + child.route)
        this.children.push(child);

    }
    setParent(parent: Route){
        this.parent = parent;
        this.setFullRoute(parent.route + this.route)
        parent.children.push(this)
    }
    setFullRoute(route:string){
        this.fullName = route;
    }
    bfs(){
        let callStack:any = [this];
        let allchildren = [this];
    
        while (callStack.length != 0) {
            let temp =   callStack[0];
            callStack.shift()
            for (const child of temp.children) {
                callStack.push(child);
                allchildren.push(child);
            }
        }
        return allchildren;
    }
    compareRoutes(route:string){
        let arr1 = this.fullName.split('/');
        let arr2 = route.split('/');

        let i = 0;
        while (i < arr2.length) {
            if (arr2[i] === "") {
              arr2.splice(i, 1);
            } else {
              ++i;
            }
          }

        if(arr1[0] == ""){
            arr1.shift()
        }
        if(arr2[0] == ""){
            arr2.shift()
        }
    
        let idx1 = 0;
        let idx2 = 0;
    
        let dynamicVars:any;
        dynamicVars = {};
    
        while (idx1 < arr1.length && idx2 < arr2.length ){
            if(arr1[idx1] === arr2[idx2]){

                idx1+=1;
                idx2+=1;
            }else if(arr1[idx1][0] === "<"){

                let temp = arr2[idx2].split('?')[0];
                dynamicVars[arr1[idx1].slice(1,arr1[idx1].length -1)] = temp
                idx1+=1;
                idx2 +=1;
            }else{
                idx1+=1
                break
            }

        }
    
        return [idx1 === idx2 , dynamicVars]
    }
}



class _Response{
    _req:any
    constructor(response:any){
        this._req = response
    }
}
class _Request{
    _res:any;
    params:any;

    constructor(request:any){
        this._res = request;
        this.params = {};

        let url = this._res.url.split('?');

        if (url[0] != this._res.url){
            let params = url[1].split('&');
            for(let param of params){

                let [varName, value] = param.split('=');
                this.params[varName] = value;

        }}

    }
}
class Router{
    _main:string;
    _subRoutes: string[];
    _subRouteObjs: any;
    _mainfunc: Function;

    constructor(main: string,mainFunc:Function){
        this._main = main;
        this._mainfunc = mainFunc;
        this._subRoutes = []
        this._subRouteObjs = {};
    
    }
    addroute(route:string, routeFunc: Function, methods:string[]= ["GET"]){
        route = this._main + route
        const newRoute:any= new Route(route, routeFunc, methods)
        this._subRoutes.push(route);
        this._subRouteObjs[route] = newRoute;
    }
}
  

class Neutrino{
    _server;
    _port:number;
    _routes:any;//fix this to list of routes
    _routesobjs: any;
    _default404:string;
    _mainDynammic:any;
    constructor(port: number){
        
        this._server = http.createServer();
        this._port   = port;
        this._routes = [];
        this._mainDynammic = null;
        this._routesobjs = {
                            '/': new Route('/',(req:any,res:any)=>{res.write("<h1>Neutrino</h1>")})
                        }
        
        this._default404 = `    <div style=" display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    width: 100%;
                                    height: 100%;"
                                    >
                                <div style=" font-size:100px;
                                        display:block;"
                                        >
                                        404
                                        </div>
                                <br>
                                <div style="display: block;
                                    font-size:100px;">  
                                Page Not Found
                                </div>
                            </div>`

    }
    findRoute(url:string,runetime:boolean=false){
        let urls = url.split('/');
        url = urls[1];
        if(!runetime){
            for(const route of this._routes){
                    if (route.route === url){
                        return  route
                    }

            } 
            return null
        }else{
            for(const route of this._routes){
                if (route.route === url){
                    return  route
                }

        } 
            return this._mainDynammic
        }
    }
    findMatch(url:string,possibleRoutes:Route[]):any{
        for(const route of possibleRoutes){
            if (route.route == url){
                return route
            }
        }
    }
    MatchRoute(url:string,possibleRoutes:Route[]):any{
        let urls = url.split('/')
        let last = urls[url.length]
        urls = urls.slice(1,url.length-1)
        url = urls.join("/");
        return  [this.findMatch(url,possibleRoutes),last]

    }
    addroute(url: string, routeFunc:Function,methods: string[]= ["GET"]):void{
        const urls = url.split('/');
        if(urls.length <= 2 && urls[1][0] == '<'){
            this._mainDynammic = new Route(urls[1],routeFunc,methods)
        }else{
        let mainRoute = this.findRoute(url);

        if (mainRoute != null){
            let possibleRoutes = mainRoute.bfs();
            let [match,newRoute] = this.MatchRoute(url,possibleRoutes)
    
            match.addChild(new Route(newRoute,routeFunc,methods))

        }else{

            const currentRoute =   new Route(url.slice(1,url.length),routeFunc,methods);

            this._routes.push(currentRoute)
        }
    }

    }
    setRouter(router:Router){
        this._routes.push(router._main)
        this._routesobjs[router._main] = new Route(router._main,router._mainfunc)
        for (let i =0 ; i < router._subRoutes.length; i++){
            const route = router._subRoutes[i]
            this.addroute(route,router._subRouteObjs[route].func,router._subRouteObjs[route].methods)
        
        }
    }
    readhtmlfile(path: string,res:any){

        try{
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            const data = fs.readFileSync(path,'utf8')
            return data
        }catch (error){
            throw error
        }
        
    }

    set404(html:string){
        this._default404 = html;
    }
    checkIfDynamic(url:string):any{
        
        if(this._routes.includes(url)){
            return [false,null]
        }else{
        for(let idx=url.length-1; idx >=0 ;idx-- ){
            if(url[idx] === '/'){
                let possibleUrl = url.slice(0,idx)
                if(this._routes.includes(possibleUrl+'/<')){
                    return [true,possibleUrl+'/<']
                }
            }
            }
        return [false,null]
        }


    }

    start(port: number = this._port) {
        let _this = this;
        this._port = port
        this._server.listen(this._port)
        console.log("Neutrino Server live at https://127.0.0.1:" + this._port)

        this._server.on('request', (request:any, response:any) => {

            let url:string = request.url;
            let possibleParams = url.split('?');
            const _request = new _Request(request)

            if(possibleParams[0] != url){
                url = possibleParams[0];
            }

            const method = request.method;
            console.log("Got a " + method + " request on " + url);


            let mainRoute = this.findRoute(url.slice(0,url.length),true)
            let possibleRoutes;
            let urlObj:any={};
            let dynamicVars ;
            if (mainRoute != null){
                possibleRoutes = mainRoute.bfs()
                for(const route of possibleRoutes){
                    if(route.compareRoutes(url)[0]){
                        urlObj = route;
                        dynamicVars= urlObj.compareRoutes(url)[1];
                    }
                }
            }
      
            if ( mainRoute != {} && urlObj != {}){

                if(urlObj.methods.includes(method)){
                
                    if (urlObj.dynamic){
                        
                        try{

                            urlObj.func(_request,response,dynamicVars)
                            response.statusCode = 200;
                            response.end()
                            console.log("reponse sent")

                        }catch(err){

                            response.statusCode = 500;
                            response.end()
                        }

                    }else {
                        try{

                            urlObj.func(_request,response)
                            response.statusCode = 200;
                            response.end()
                            console.log("reponse sent")

                        }catch(err){

                            response.statusCode = 500;
                            response.end()
                        }
                        
                    }
                }else{
                    response.statusCode =  405
                    console.log("a "+request.method + " request on "+request.url + " not allowed ")
                    response.write("method not allowed")
                    response.end()
                }
            }else{
                response.statusCode =  404
                console.log("repsonse on " + request.url + " failed")
                response.write(_this._default404)
                response.end()
            }
        
          });
        

    }


    

}





var app = new Neutrino(5500);
app.addroute("/<hsein>", (req:any, res:any, dynamicpar:any) => {
    console.log(dynamicpar,"dynamic part")
    res.write("<h1>ALi is  here" + dynamicpar["hsein"] + ' </h1>');
});
app.addroute("/ali",  (req:any, res:any )=> {
    res.write("<h1>ALi is  here" + "alllllllll" + ' </h1>');
});

app.start();


