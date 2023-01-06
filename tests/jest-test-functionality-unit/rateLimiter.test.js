const rateLimiter = require('../../build/Neutrino').rateLimiter;


describe('rateLimiter', () => {
    test('rate limits requests based on the IP address and time period', () => {
      const RateLimiter = new rateLimiter();
  
      // Mock the request and response objects
      const req = { ip: '127.0.0.1' };
      const res = {
        setStatusCode: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };
      const next = jest.fn();
  
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        RateLimiter.rateLimit(req, res, next);
      }
  
      // Make one more request
      RateLimiter.rateLimit(req, res, next);
  
      // The response should have a status code of 429 (Too Many Requests)
      expect(res.setStatusCode).toHaveBeenCalledWith(429);
      // The response should have a message saying "Too many requests. Please try again later."
      expect(res.write).toHaveBeenCalledWith('Too many requests. Please try again later.');
      // The response should have ended
    //   expect(res.end).toHaveBeenCalled();
    });
  });