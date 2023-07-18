

```ts
import { Code, ConnectError } from "@bufbuild/connect";
import { ElizaService } from "./gen/eliza_connect";
import { LocalizedMessage } from "./gen/google/rpc/error_details_pb";

function say() {
  const details = [
    new LocalizedMessage({
      locale: "fr-CH",
      message: "Je n'ai plus de mots.",
    }),
    new LocalizedMessage({
      locale: "ja-JP",
      message: "もう言葉がありません。",
    }),
  ];
  const metadata = new Headers({
    "words-left": "none"
  });
  throw new ConnectError(
    "I have no words anymore.",
    Code.ResourceExhausted,
    metadata,
    details
  );
}
```

We are using the protobuf message [`google.rpc.LocalizedMessage`](https://buf.build/googleapis/googleapis/file/main:google/rpc/error_details.proto#L241)
in this example, but any protobuf message can be transmitted as error details.

