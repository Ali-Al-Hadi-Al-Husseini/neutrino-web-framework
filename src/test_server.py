from requests import get
import unittest 


class testServer(unittest.TestCase):

    def test_get(self):
        test_cases = [
                    ('/','<h1>Neutrino</h1>'),
                    ('/me','||||||||||||||||||||||||||||||'),
                    ('/me/john',"||||||||||||||" + "john"+ "||||||||||||||||"),
                    ('/hola',"<h1>ALi is  here " + 'hola' + ' </h1>'),
                    ('/ali',"<h1>ALi is  here" + "alllllllll" + ' </h1>'),
                    ('/ali/hello',"<h1>ALi is  here " + 'hello' + ' </h1>'),
                    ('/ali/hello/ali',"<h1>ALi is  here " + 'hello ' + "ali" + ' </h1>'),
                    ('/there/newyork',"<h1>there newyork/h1>"),
                    ('/there',"<h1> there </h1>")
        ]

        for route,expected_respone in test_cases:
            response = get('http://127.0.0.1:5500' + route)
            
            self.assertEqual(response.text,expected_respone)


if __name__ == "__main__":
    unittest.main()