const request = require('supertest');
const lib = require('../../build/Neutrino')
const Neutrino = lib.Neutrino

describe('Neutrino', () => {
    let app;
  
    beforeEach(() => {
      app = new Neutrino();
      app.post('/',(req,res)=>{res.write("hello")})
      app.addStaticPath('/home')

      app.start(9901);
    });
  
    afterEach(() => {
      app._server.close();
    });

    test('', async () => {
        let response = await request(app._server).get('/static/home');
        

      });

})