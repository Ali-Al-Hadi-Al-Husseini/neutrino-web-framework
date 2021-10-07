const http = require("http");
const fs = require('fs');

class Router{
    _main:String;
    _subRoutes: object[];

    constructor(main: string){
        this._main = main;
        this._subRoutes = []
    
    }
    addroute(route:string, routeFunc: Function, methods:string[]= ["GET"]){
        const newRoute:any= {
                        route:route,
                        routeFunc:routeFunc,
                        methods:methods
                    }
        this._subRoutes.push(newRoute);
    }
}

class route{
    routes:string[];
    func: Function;
    methods: string[];
    dynamic: boolean;
    dynamicIdx: number[]

    constructor(route: string,func:Function = ()=>{}, methods:string[] = ["GET"]){

    this.routes = route.split('/');
    this.func = func
    this.methods = methods;
    this.dynamic = false; 
    this.dynamicIdx = []

    for(let idx =0; idx < this.routes.length;idx++ ){
        if(this.routes[idx][0] == '<'){
            this.dynamic = true
            this.dynamicIdx.push(idx)
        }
    }
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
                            '/': new route('/',(req:any,res:any)=>{res.write("<h1>Neutrino</h1>")})
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
        
        const currentRoute =   new route(url,routeFunc,methods);


        if(currentRoute.dynamic){

            const urlBeforeDynamic = url.split("/<")[0];
            this._routes.push(urlBeforeDynamic)
            this._routesobjs[urlBeforeDynamic] = currentRoute;

        }else{
            this._routesobjs[url] = currentRoute;
            this._routes.push(url)
        }


    }
    // addRouter(router:Router){

    //     for (let i =0 ; i < router._subRoutes.length; i++){
    //         let routeObj = router._subRoutes[i]
    //         let route    = router._main + routeObj["route"]

    //         this._routes.push(route)
    //         this._routesFuncs[route] = routeObj["routeFunc"]
    //         this._routesMethods[route] = routeObj["methods"]
    //     }
    // }
    readhtmlfile(path: string){
        try{
            const data = fs.readFileSync(path,'utf8')
            return data
        }catch (error){
            throw error
        }
        
    }

    checkIfDynamic(url:string):any{
        
        if(this._routes.includes(url)){
            return [false,null]
        }else{
        for(let idx=url.length-1; idx >=0 ;idx-- ){
            if(url[idx] === '/'){
                let possibleUrl = url.slice(0,idx)
                if(this._routes.includes(possibleUrl)){
                    return [true,possibleUrl]
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

        this._server.on('request', (request:typeof http.request, response:typeof http.request) => {

            const url = request.url;
            const method = request.method;
            console.log("got a " + method + " request on " + url);
            const ifDynamic = this.checkIfDynamic(url);

            let urlObj;
            let newUrl = url;
            if (ifDynamic[0]){
                urlObj = _this._routesobjs[ifDynamic[1]];
                newUrl = ifDynamic[1]
            }
            else{
                urlObj = _this._routesobjs[url];
            }
            if (  _this._routes.includes(newUrl)){

                if(urlObj.methods.includes(method)){

                
                    if (urlObj.dynamic){
                        const dynamicPart = url.split("/")[urlObj.dynamicIdx]
                        console.log("dynamic part is", dynamicPart)
                        urlObj.func(request,response,dynamicPart.slice(1,dynamicPart.length-1))
                        response.end()
                        console.log("reponse sent")

                    }else {
                    urlObj.Func(request,response)
                    response.end()
                    console.log("reponse sent")
                    }
                }else{
                    //method noy allowed
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











const app = new Neutrino(5000);
app.addroute("/ali/<hsein>", function (req:any, res:any,hsein:String) {
    res.write("<h1>ALi is  here" + hsein + ' </h1>');
});
console.log(app._routes)
app.start()
