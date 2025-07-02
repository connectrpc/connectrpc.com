# 004: Python Implementation

I would like to propose adding an official Python ConnectRPC implementation. I propose a full server and client implementation that supports both threaded I/O and asyncio, targeting modern Python (TBD what versions, but as of today Python 3.12 is current).

Server implementation will target [WSGI](https://peps.python.org/pep-3333/) and [ASGI](https://asgi.readthedocs.io/en/latest/) specifications.

## Why

Python is another quite popular programming language used for web development, so first class support for Python would help adoption in that ecosystem.

## Anticipated complications

Python ecosystem has a number of pros and cons for us with implementation, and questions and concerns for each.

At a high level, Python has two primary I/O implementation, asyncio and normal threaded I/O. `asyncio` and threaded I/O have little to share in implementation, and need to be targeted separately. Choosing one or the other would, I believe, make adopting our library difficult. It's expected to be able to use in both implementations in modern Python.

### Client

In the current POC, the client is implemented using [`httpcore`](https://www.encode.io/httpcore/) which is a low level HTTP/1.2 and HTTP/2 client.

This implementation though will prove to be difficult to implement a gRPC-compatible client due to not enough low level HTTP/2 features, e.g. access to HTTP Trailers.

The alternative is to directly use something like [`hyper`](https://python-hyper.org/projects/hyper-h2/en/stable/index.html) which is strictly a protocol parser, which would require us to build a purpose-built HTTP client to be able to leverage and expose all of the underlying features we'd need. If we go this route, we'd also need an equivalent HTTP/1.1 compatible client based on [`h11`](https://h11.readthedocs.io/en/latest/) most likely. This very low level client would get us every primitive we need, with the extra burden of maintaining the higher abstraction of managing all lifecycles of an HTTP TCP connection. I have not investigated this route or explore this yet.

#### Supported protocols

* Connect RPC
  * Easy with `httpcore`, implemented in POC
* gRPC
  * Would require using `hyper` to access lower level h2 information
* gRPC-Web
  * Should be easy with `httpcore`, not implemented in POC

#### Supported features

* Unary requests
  * Easy with `httpcore`, implemented in POC
* Server stream
  * Easy with `httpcore`, implemented in POC
* Client stream
  * Should be easy with `httpcore`, not implemented in POC
* Bidi stream
  * Fairly confident not possible to implement without something lower level, but I might be wrong, haven't attempted.

### Server

Python ecosystem provides abstractions for writing web servers, with interfaces for WSGI and ASGI. I am proposing we implement both, but implementing these comes with some challenges.

WSGI is strictly for threaded I/O, while ASGI is for asyncio. WSGI and ASGI are preferred because this allows a very common pattern of being able to leverage existing HTTP server implementations, either paired with `nginx` or something like `gunicorn`, `uvicorn`, etc. The benefits of implementing these specifications is because this allows developers to easily embed a ConnectRPC based application alongside other WSGI/ASGI based applications, just served at their respective endpoints. Alternatively, it'd require running as a dedicated server and would limit it's ability to interop well. I strongly feel we should favor being able to interop, because anecdotally, this is one of the appealing features of the connect-go implementation, being able to serve ConnectRPC endpoints alongside other non-RPC endpoints.

Implementing to WSGI and ASGI though then come with their own tradeoffs since these specifications don't expose the underlying HTTP streams and the abstraction of HTTP/1.1 and HTTP/2 are handled by the WSGI/ASGI server.

Alternatively, we can choose to support a full HTTP/2 based server, but I would strongly prefer we not do this, and support what we are capable of supporting within these specifications until proven otherwise.

#### Supported protocols

* Connect RPC
  * Easy with WSGI and ASGI, WSGI is implemented in POC
* gRPC
  * TBD on if this is capable of being supported in either WSGI or ASGI without investigation and research. Very unlikely without access to being able to support specific HTTP/2 features like setting Trailers.
* gRPC-Web
  * Should be easy in both WSGI and ASGI, not implemented in POC


#### Supported features

* Unary responses
  * Easy with WSGI and ASGI, WSGI implemented in POC
* Server stream
  * Easy with WSGI and ASGI, WSGI implemented in POC
* Client stream
  * I don't anticipate this being difficult in either WSGI or ASGI, not implemented in POC
* Bidi stream
  * I think this will be difficult, if not impossible, but have not tried. ASGI would be more likely to work, but investigation is needed here. 

## Alternatives

Choose not to support Python officially and leave to the community.

## References

* [WIP implementation](https://github.com/mattrobenolt/connect-python)
* [`httpcore`](https://www.encode.io/httpcore/)
* [ASGI](https://asgi.readthedocs.io/en/latest/)
* [WSGI](https://peps.python.org/pep-3333/)
* [`hyper`](https://python-hyper.org/projects/hyper-h2/en/stable/index.html)
* [`h11`](https://h11.readthedocs.io/en/latest/)
