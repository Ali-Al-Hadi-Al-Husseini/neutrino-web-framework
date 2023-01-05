const Route = require('../neutrino').Route;


describe('Route', () => {

  let routes;
  let urls;
  let methods
  let testRouteFunc;

  beforeEach(() => {
    routes = []
    urls = ['/route','/main','/<dynamic>','/st/hello','/place']
    methods = [['GET',"POST"],['GET'],['POST','PUT'],['GET',"POST",'PUT'],['GET',"POST",'PUT','DELETE']]
    testRouteFunc = ()=>{}

    for(let idx = 0 ; idx < urls.length ; idx++){
        routes.push(new Route(urls[idx],testRouteFunc,methods[idx]))
    }

  });

  test('constructor sets correct properties', () => {
    for(let idx = 0 ; idx < urls.length ; idx++){
        let route = routes[idx]
        let currentMethods = methods[idx]
        let currentUrl = urls[idx]
        
        
        expect(route.children).toEqual([]);
        expect(route.route).toEqual(currentUrl);
        expect(route.methods).toEqual(currentMethods);
        expect(route.fullRoute).toEqual(currentUrl);
        expect(route.isDynamic).toEqual(idx == 2);
        expect(route.parent).toBeNull();
        expect(route.dynamicRoute).toBeNull();

        let methodsFuncs = {}
        for(const method of currentMethods){methodsFuncs[method] = testRouteFunc}

        expect(route.methodsFuncs).toEqual(methodsFuncs);
    }
  });

})