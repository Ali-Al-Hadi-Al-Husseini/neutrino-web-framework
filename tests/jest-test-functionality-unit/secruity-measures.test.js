const request = require('supertest');
const lib = require('../../build/Neutrino');
const Neutrino = lib.Neutrino

describe('Neutrino', () => {
    let app;
  
    beforeEach(() => {
      app = new Neutrino();
      app.post('/',(req,res)=>{res.write("hello")})
      app.addStrictSecruityMeasures(["self"])

      app.start(9901);
    });
  
    afterEach(() => {
      app._server.close();
    });

    test('should add strict security measures', async () => {
    
        let response = await request(app._server).get('/');
        expect(response.headers['x-frame-options']).toEqual("SAMEORIGIN");
        expect(response.headers['x-content-type-options']).toEqual('nosniff');
        expect(response.headers['content-security-policy']).toBeDefined();
        expect(response.headers['x-xss-protection']).toEqual('1; mode=block');

        expect(response.status).toBe(200);
    
        response = await request(app._server).post('/');
        expect(response.headers['x-frame-options']).toEqual('SAMEORIGIN');
        expect(response.headers['x-content-type-options']).toEqual('nosniff');
        expect(response.headers['content-security-policy']).toBeDefined();
        expect(response.headers['x-xss-protection']).toEqual('1; mode=block');

        expect(response.status).toBe(200);
      });

})