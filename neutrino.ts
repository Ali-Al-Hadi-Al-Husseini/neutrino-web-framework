
const http = require("http");
const fs = require('fs');

class Route{
    route:string;
    routes:string[];
    func: Function;
    methods: string[];
    dynamic: boolean;
    dynamicIdx: number[];
    _continue:boolean;

    constructor(route: string,func:Function = ()=>{}, methods:string[] = ["GET"]){

        this.route = route
        this.routes = route.split('/');
        this.func = func
        this.methods = methods;
        this.dynamic = false; 
        this.dynamicIdx = []
        this._continue = false;

        for(let idx =0; idx < this.routes.length;idx++ ){

            if(this.routes[idx][0] == '<'){
                this.dynamic = true
                this.dynamicIdx.push(idx)

                if (idx != (this.routes.length-1) ){
                    this._continue = true
                }
            }
        }
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
    _routes:string[];
    _routesobjs: any;
    _default404:string;
    constructor(port: number){
        
        this._server = http.createServer();
        this._port   = port;
        this._routes = [];
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
                                <div style="display: block;">  
                                Page Not Found
                                </div>
                            </div>`

    }
    addroute(url: string, routeFunc:Function,methods: string[]= ["GET"]):void{
        
        const currentRoute =   new Route(url,routeFunc,methods);


        if(currentRoute.dynamic){

            const urlBeforeDynamic = url.split("/<")[0] + '/<';
            this._routes.push(urlBeforeDynamic)
            this._routesobjs[urlBeforeDynamic] = currentRoute;


        }else{
            this._routesobjs[url] = currentRoute;
            this._routes.push(url)
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

    start(port: number = this._port):void {
        let _this = this;
        this._port = port
        this._server.listen(this._port)
        console.log("Neutrino Server live at https://127.0.0.1:" + this._port)

        this._server.on('request', (request:any, response:any) => {

            console.log(typeof request)
            let url:string = request.url;
            let possibleParams = url.split('?');
            const _request = new _Request(request)
            if(possibleParams[0] != url){
                url = possibleParams[0];
            }

            const method = request.method;
            console.log("got a " + method + " request on " + url);
            const ifDynamic = this.checkIfDynamic(url);

            let urlObj;
            let newUrl = url;
            const sameUrls = url.localeCompare(ifDynamic[1]) == 0 ? true : false

            if (ifDynamic[0] ){
                urlObj = _this._routesobjs[ifDynamic[1]];
                newUrl = ifDynamic[1]
            }
            else{
                urlObj = _this._routesobjs[url];
            }
            if (  _this._routes.includes(newUrl)){

                if(urlObj.methods.includes(method)){

                
                    if (urlObj.dynamic){
                        
                        try{
                            const dynamicPart = url.split("/")[urlObj.dynamicIdx]
                            console.log("dynamic part is", dynamicPart)
                            urlObj.func(_request,response,dynamicPart)
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


// function routes(){
//     this._routes = []
//     this.push = (route: string)=>{
//         this._routes.push(route);
//     }
//     // this.include = (route: string)=>{
//     //     return this,
//     // }
// }





//rember to do asunc





var app = new Neutrino(5000);
let router = new Router('/ali',(req:any,res:any)=>{res.write("hello from my main")})
router.addroute("/<hsein>", (req:any, res:any, hsein:any) => {
    res.write("<h1>ALi is  here" + hsein + ' </h1>');
});
router.addroute("/ali",  (req:any, res:any )=> {
    console.log(req.params["name"])
    res.write("<h1>ALi is  here" + "alllllllll" + ' </h1>');
});
app.setRouter(router)
app.start();
