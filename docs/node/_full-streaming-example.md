

Putting all of the above together, we can now add these handlers to our server.  An example for doing so with
the `http2` package in Node would look as follows:

```typescript
import http2 from "http2";

import { createHandlers, Handler, mergeHandlers } from "@connectrpc/connect-node";
import { ElizaService } from "./gen/proto/eliza_service_connectweb.js";
import type { ConverseRequest, IntroduceRequest, SayRequest, VentRequest } from "./gen/proto/eliza_service_pb.js";
import { ConverseResponse, IntroduceResponse, SayResponse, VentResponse } from "./gen/proto/eliza_service_pb.js";

function say(req: SayRequest): SayResponse {
    return new SayResponse({
        sentence: `You said ${req.sentence}`,
    });
}

async function vent(reqs: AsyncIterable<VentRequest>): Promise<VentResponse> {
    let sentences: string[] = [];
    for await (const req of reqs) {
        sentences.push(`'${req.sentence}'`);
    }
    return new VentResponse({
        sentence: `You said ${sentences.join(" and ")}`,
    });
}

async function *introduce(req: IntroduceRequest): AsyncGenerator<IntroduceResponse> {
    yield new IntroduceResponse({ sentence: `Hi ${req.name}, I'm eliza` });
    yield new IntroduceResponse({ sentence: `Before we begin, ${req.name}, let me tell you something about myself.`});
    yield new IntroduceResponse({ sentence: `I'm a Rogerian psychotherapist.` });
    yield new IntroduceResponse({ sentence: `How are you feeling today?` });
}

async function *converse(reqs: AsyncIterable<ConverseRequest>): AsyncGenerator<ConverseResponse> {
    for await (const req of reqs) {
        yield new ConverseResponse({
            sentence: `You said ${req.sentence}`,
        });
    }
}

const handlers: Handler[] = createHandlers(ElizaService, {
    say,
    vent,
    introduce,
    converse
});

http2.createServer({}, mergeHandlers(handlers)).listen(8080, () => console.log("Server listening on localhost:8080"));
```


