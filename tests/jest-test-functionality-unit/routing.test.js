const request = require('supertest');
const lib = require('../../build/Neutrino');
const Neutrino = lib.Neutrino

describe('Neutrino', () => {
  let app;

  beforeEach(() => {
    app = new Neutrino();
    app.start();
  });

  afterEach(() => {
    app._server.close();
  });

  test('should add route', async () => {
    const route = '/test-route';
    const expectedResponse = 'Hello from test route!';
    app.addRoute(route, (req, res) => {
      res.send(expectedResponse);
    });

    const response = await request(app._server).get(route);
    expect(response.status).toBe(200);
    expect(response.text).toBe(expectedResponse);
  });

  test('should handle dynamic routes', async () => {
    const route = '/user/<id>';
    app.addRoute(route, (req, res) => {
      res.send(`User id: ${req.dynamicParts.id}`);
    });

    const userId = '123';
    const response = await request(app._server).get(`/user/${userId}`);
    expect(response.status).toBe(200);
    expect(response.text).toBe(`User id: ${userId}`);
  });


});