import typing
from urllib import request
import tornado.web
import tornado.routing
from asyncio import get_event_loop
from tornado.httputil import HTTPServerRequest


class Request:
    def __init__(self, request: HTTPServerRequest):
        self._request = request
        print(self._request.method)

    def _assert_is_method(self, method: str):
        assert self._request.method == method, f"Expected request to have method {method} but is {self._request.method}"
        return self._request.method == method

    def assert_is_get(self):
        return self._assert_is_method("GET")

    def assert_is_post(self):
        return self._assert_is_method("POST")

    def assert_is_put(self):
        return self._assert_is_method("PUT")



class MockJSONHandler(tornado.web.RequestHandler):
    def initialize(self, call_stack_getter, notify_callback):
        self.call_stack = call_stack_getter()
        self.notify_callback = notify_callback

    def prepare(self):
        self.call_stack.append(Request(self.request))
        self.set_status(200)
    
    def on_finish(self) -> None:
        super().on_finish()
        self.notify_callback()
        return 

    def get(self, add_args=None):
        self.finish()
        return
    
    def post(self, add_args=None):
        self.finish()
        return

    def put(self, add_args=None):
        self.finish()
        return

    def delete(self, add_args=None):
        self.finish()
        return




class Counter_Waiter:
    """A class to provide and trigger a future after a counting a specified amount of calls on the .trigger() function"""
    def __init__(self, loop, threshold) -> None:
        self.future = loop.create_future()
        self._threshold = threshold
        self._counter = 0
        self.done = False
    
    def trigger(self):
        if self.done:
            return
        self._counter+=1
        if self._counter >= self._threshold:
            self.future.set_result(None)
            self.done = True

def _inc_counter(counters: typing.List[Counter_Waiter]):
    def inner():
        for c in counters:
            c.trigger()
    return inner


class Api_Mock:
    def __init__(self) -> None:
        self.call_stack: typing.List[Request] = []
        self.get_call_stack = lambda: self.call_stack
        self._loop = get_event_loop()
        self._counters: typing.List[Counter_Waiter] = []

        self._application = tornado.web.Application([
            (tornado.routing.AnyMatches(), MockJSONHandler, dict(call_stack_getter=self.get_call_stack, notify_callback=_inc_counter(self._counters)) )
            ])
        
        
    def listen(self, port: int):
        assert port > 600, "Please specify non-sys port"
        self._server = self._application.listen(port)

    def get_request_future(self, threshold=1):
        """Return a future which resolves once any request was sent to the mock"""
        c_w = Counter_Waiter(self._loop, threshold)
        self._counters.append(c_w)
        return c_w.future

    def clean_stack(self):
        self.call_stack = []
    