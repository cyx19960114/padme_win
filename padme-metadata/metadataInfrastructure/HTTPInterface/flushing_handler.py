"""Contains a handler for flushing the buffer to the endpoint(s)"""

from tornado import web

class FlushingHandler(web.RequestHandler):
    """
    Handler for flushing the buffer to the endpoints by calling a given flush_method
    """

    def initialize(self, flushing_method):
        self.flushing_method = flushing_method

    async def post(self, *kwargs):
        """
        On Post this handler just calls the flushing method
        """
        await self.flushing_method()

def create_app(flushing_method):
    return web.Application([
        (r"(.*)", FlushingHandler, dict(flushing_method=flushing_method))
    ])