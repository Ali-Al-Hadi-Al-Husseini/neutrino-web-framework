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

  test('should handle different http methods', async () => {
    const route = '/test-route';
    const expectedGetResponse = 'Hello from test route!';
    const expectedPostResponse = 'Post request to test route';
    app.addRoute(route, (req, res) => {
      res.send(expectedGetResponse);
    }, ['GET']);

    app.addRoute(route, (req, res) => {
      res.send(expectedPostResponse + "!");
    }, ['POST']);

    const getResponse = await request(app._server).get(route);
    expect(getResponse.status).toBe(200);
    expect(getResponse.text).toBe(expectedGetResponse);

    const postResponse = await request(app._server).post(route);
    expect(postResponse.status).toBe(200);
    expect(postResponse.text).toBe(expectedPostResponse + "!");
  });

  test('should add route for multiple methods', async () => {
    const route = '/test-route';
    const expectedResponse = 'Hello from test route!';
    app.addRoute(route, (req, res) => {
      res.send(expectedResponse);
    }, ['GET', 'POST']);

    let response = await request(app._server).get(route);
    expect(response.status).toBe(200);
    expect(response.text).toBe(expectedResponse);

    response = await request(app._server).post(route);
    expect(response.status).toBe(200);
    expect(response.text).toBe(expectedResponse);
  });

  test('should add dynamic route', async () => {
    const route = '/test-route/<id>';
    const expectedResponse = 'Hello from test route with id!';
    app.addRoute(route, (req, res) => {
      res.write(`${expectedResponse} ${req.dynamicParts.id}`);
    });

    const id = '123';
    const response = await request(app._server).get(`/test-route/${id}`);
    expect(response.status).toBe(200);
    expect(response.text).toBe(`${expectedResponse} ${id}`);
  });

//   test('should return 404 for non-existing route', async () => {
//     const response = await request(app._server).get('/non-existing-route');
//     expect(response.status).toBe(404);
//     expect(response.text).toBe(app._default404);
//   });
});