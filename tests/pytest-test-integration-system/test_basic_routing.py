from requests import get
import unittest 


class testServer(unittest.TestCase):

    def test_get(self):
        test_cases = [
                    ('/','<h1>Neutrino</h1>'),
                    ('/me','||||||||||||||||||||||||||||||'),
                    ('/me/john',"||||||||||||||" + "john"+ "||||||||||||||||"),
                    # ('/me/ali',"<h1>ALi is  here" + "alllllllll" + ' </h1>'     ),
                    ('/hola',"<h1>ALi is  here " + 'hola' + ' </h1>'),
                    ('/ali',"<h1>ALi is  here" + "alllllllll" + ' </h1>'),
                    ('/ali/hello',"<h1>ALi is  here " + 'hello' + ' </h1>'),
                    ('/ali/hello/ali',"<h1>ALi is  here " + 'hello ' + "ali" + ' </h1>'),
                    ('/there/newyork',"<h1>there newyork/h1>"),
                    ('/there',"<h1> there </h1>"),
                    ('/halo',"""<p>This is paragraph number 0</p> <p>This is paragraph number 1</p> <p>This is paragraph number 2</p> <p>This is paragraph number 3</p> <p>This is paragraph number 4</p> """)
        ]

        for route,expected_respone in test_cases:
            url = 'http://127.0.0.1:5500' + route
            response = get(url)

            headers = response.headers

            self.assertEqual(response.status_code,200)
            self.assertEqual(response.url,url)
            self.assertEqual(headers['Content-Type'],'text/html')
            self.assertEqual(response.text,expected_respone)


if __name__ == "__main__":
    unittest.main()