---
title: Testing & mocking
sidebar_position: 6
---

## Generating mocks

Testing generated Connect-Swift APIs is easily achieved
by using the [`connect-swift-mocks` plugin][connect-swift-mocks-plugin]
to generate mock client implementations from your Protobuf
definitions. This plugin supports all of the same
[options](./generating-code.md#generation-options) that the
production [`connect-swift` plugin][connect-swift-plugin] supports.

This `buf.gen.yaml` file demonstrates generating production
interfaces and implementations into the `Generated` folder, and a corresponding
set of mocks into the `GeneratedMocks` folder:

```yaml
version: v1
plugins:
  # Generated models
  - plugin: buf.build/apple/swift
    opt:
      - Visibility=Public
    out: Generated
  # Production generated services/methods
  - plugin: buf.build/bufbuild/connect-swift
    opt:
      - GenerateAsyncMethods=true
      - GenerateCallbackMethods=true
      - Visibility=Public
    out: Generated
  # Mock generated services/methods
  - plugin: buf.build/bufbuild/connect-swift-mocks
    opt:
      - GenerateAsyncMethods=true
      - GenerateCallbackMethods=true
      - Visibility=Public
    out: GeneratedMocks
```

**The `GenerateAsyncMethods` and
`GenerateCallbackMethods` [options](./generating-code.md#generation-options)
that you specify must match the option(s) you're using for production
clients.**

As an example, consider this Protobuf file:

```protobuf
syntax = "proto3";

package connectrpc.eliza.v1;

service ElizaService {
    rpc Say(SayRequest) returns (SayResponse) {}
    rpc Converse(stream ConverseRequest) returns (stream ConverseResponse) {}
}

message SayRequest {
    string sentence = 1;
}

message SayResponse {
    string sentence = 1;
}

message ConverseRequest {
    string sentence = 1;
}

message ConverseResponse {
    string sentence = 1;
}
```

When the production `connect-swift` plugin is invoked, it outputs
**2 things for each service**:

- A protocol interface ending with `*ClientInterface`
- A production implementation that conforms to the protocol and ends with `*Client`

<details><summary>Click to expand <code>eliza.connect.swift</code></summary>

```swift
import Connect
import Foundation
import SwiftProtobuf

public protocol Connectrpc_Eliza_V1_ElizaServiceClientInterface: Sendable {
    @discardableResult
    func `say`(request: Connectrpc_Eliza_V1_SayRequest, headers: Headers, completion: @escaping @Sendable (ResponseMessage<Connectrpc_Eliza_V1_SayResponse>) -> Void) -> Cancelable

    func `say`(request: Connectrpc_Eliza_V1_SayRequest, headers: Headers) async -> ResponseMessage<Connectrpc_Eliza_V1_SayResponse>

    func `converse`(headers: Headers, onResult: @escaping @Sendable (StreamResult<Connectrpc_Eliza_V1_ConverseResponse>) -> Void) -> any BidirectionalStreamInterface<Connectrpc_Eliza_V1_ConverseRequest>

    func `converse`(headers: Headers) -> any BidirectionalAsyncStreamInterface<Connectrpc_Eliza_V1_ConverseRequest, Connectrpc_Eliza_V1_ConverseResponse>
}

/// Concrete implementation of `Connectrpc_Eliza_V1_ElizaServiceClientInterface`.
public final class Connectrpc_Eliza_V1_ElizaServiceClient: Connectrpc_Eliza_V1_ElizaServiceClientInterface, Sendable {
    private let client: ProtocolClientInterface

    public init(client: ProtocolClientInterface) {
        self.client = client
    }

    @discardableResult
    public func `say`(request: Connectrpc_Eliza_V1_SayRequest, headers: Headers = [:], completion: @escaping @Sendable (ResponseMessage<Connectrpc_Eliza_V1_SayResponse>) -> Void) -> Cancelable {
        return self.client.unary(path: "connectrpc.eliza.v1.ElizaService/Say", request: request, headers: headers, completion: completion)
    }

    public func `say`(request: Connectrpc_Eliza_V1_SayRequest, headers: Headers = [:]) async -> ResponseMessage<Connectrpc_Eliza_V1_SayResponse> {
        return await self.client.unary(path: "connectrpc.eliza.v1.ElizaService/Say", request: request, headers: headers)
    }

    public func `converse`(headers: Headers = [:], onResult: @escaping @Sendable (StreamResult<Connectrpc_Eliza_V1_ConverseResponse>) -> Void) -> any BidirectionalStreamInterface<Connectrpc_Eliza_V1_ConverseRequest> {
        return self.client.bidirectionalStream(path: "connectrpc.eliza.v1.ElizaService/Converse", headers: headers, onResult: onResult)
    }

    public func `converse`(headers: Headers = [:]) -> any BidirectionalAsyncStreamInterface<Connectrpc_Eliza_V1_ConverseRequest, Connectrpc_Eliza_V1_ConverseResponse> {
        return self.client.bidirectionalStream(path: "connectrpc.eliza.v1.ElizaService/Converse", headers: headers)
    }
}
```

</details>

When the mock `connect-swift-mocks` plugin is invoked, it outputs a
`.mock.swift` file which includes an implementation ending with `*ClientMock`
that conforms to the same interface as the production client:

<details><summary>Click to expand <code>eliza.mock.swift</code></summary>

```swift
import Combine
import Connect
import ConnectMocks
import Foundation
import SwiftProtobuf

/// Mock implementation of `Connectrpc_Eliza_V1_ElizaServiceClientInterface`.
open class Connectrpc_Eliza_V1_ElizaServiceClientMock: Connectrpc_Eliza_V1_ElizaServiceClientInterface, @unchecked Sendable {
    private var cancellables = [Combine.AnyCancellable]()

    /// Mocked for calls to `say()`.
    public var mockSay = { (_: Connectrpc_Eliza_V1_SayRequest) -> ResponseMessage<Connectrpc_Eliza_V1_SayResponse> in .init(result: .success(.init())) }
    /// Mocked for async calls to `say()`.
    public var mockAsyncSay = { (_: Connectrpc_Eliza_V1_SayRequest) -> ResponseMessage<Connectrpc_Eliza_V1_SayResponse> in .init(result: .success(.init())) }
    /// Mocked for calls to `converse()`.
    public var mockConverse = MockBidirectionalStream<Connectrpc_Eliza_V1_ConverseRequest, Connectrpc_Eliza_V1_ConverseResponse>()
    /// Mocked for async calls to `converse()`.
    public var mockAsyncConverse = MockBidirectionalAsyncStream<Connectrpc_Eliza_V1_ConverseRequest, Connectrpc_Eliza_V1_ConverseResponse>()

    public init() {}

    @discardableResult
    open func `say`(request: Connectrpc_Eliza_V1_SayRequest, headers: Headers = [:], completion: @escaping @Sendable (ResponseMessage<Connectrpc_Eliza_V1_SayResponse>) -> Void) -> Cancelable {
        completion(self.mockSay(request))
        return Cancelable {}
    }

    open func `say`(request: Connectrpc_Eliza_V1_SayRequest, headers: Headers = [:]) async -> ResponseMessage<Connectrpc_Eliza_V1_SayResponse> {
        return self.mockAsyncSay(request)
    }

    open func `converse`(headers: Headers = [:], onResult: @escaping @Sendable (StreamResult<Connectrpc_Eliza_V1_ConverseResponse>) -> Void) -> any BidirectionalStreamInterface<Connectrpc_Eliza_V1_ConverseRequest> {
        self.mockConverse.$inputs.first { !$0.isEmpty }.sink { _ in self.mockConverse.outputs.forEach(onResult) }.store(in: &self.cancellables)
        return self.mockConverse
    }

    open func `converse`(headers: Headers = [:]) -> any BidirectionalAsyncStreamInterface<Connectrpc_Eliza_V1_ConverseRequest, Connectrpc_Eliza_V1_ConverseResponse> {
        return self.mockAsyncConverse
    }
}
```

</details>

## Using generated mocks

As mentioned in the [tutorial](getting-started.md), we recommend
having your application consume the `*ClientInterface` protocols rather than
the concrete types directly. Doing so allows for replacing the concrete
implementations with the generated mock implementations:

```swift
final class MessagingViewModel: ObservableObject {
    //highlight-next-line
    private let elizaClient: Connectrpc_Eliza_V1_ElizaServiceClientInterface

    //highlight-next-line
    init(elizaClient: Connectrpc_Eliza_V1_ElizaServiceClientInterface) {
        self.elizaClient = elizaClient
    }

    @Published private(set) var messages: [Message] {...}

    func send(_ sentence: String) async {
        let request = Connectrpc_Eliza_V1_SayRequest.with { $0.sentence = sentence }
        let response = await self.elizaClient.say(request: request, headers: [:])
        ...
    }
}
```

To use the [generated mocks](#generating-mocks), you will need to include the
`ConnectMocks` library which is available in the
[Connect-Swift repo][connect-swift] alongside the `Connect` library.

It can be integrated via either:

- Swift Package Manager, using the same [GitHub URL][connect-swift]
  and [instructions](./getting-started#add-the-connect-swift-package) as the
  main `Connect` library.
- CocoaPods, using the `Connect-Swift-Mocks` CocoaPod.

You can then write unit tests that inject the mock implementations instead of
the production implementations, making validating requests and providing mocked
response data easy:

```swift
import Connect
import ConnectMocks
@testable import ElizaApp // The target containing your application logic
import SwiftProtobuf
import XCTest

final class ElizaAppTests: XCTestCase {
    /// Example test that injects a mock generated client into a unary view model.
    @MainActor
    func testUnaryMessagingViewModel() async {
        let client = Connectrpc_Eliza_V1_ElizaServiceClientMock()
        client.mockAsyncSay = { request in
            XCTAssertEqual(request.sentence, "hello!")
            return ResponseMessage(result: .success(.with { $0.sentence = "hi, i'm eliza!" }))
        }

        let viewModel = MessagingViewModel(elizaClient: client)
        await viewModel.send("hello!")

        XCTAssertEqual(viewModel.messages.count, 2)
        XCTAssertEqual(viewModel.messages[0].message, "hello!")
        XCTAssertEqual(viewModel.messages[0].author, .user)
        XCTAssertEqual(viewModel.messages[1].message, "hi, i'm eliza!")
        XCTAssertEqual(viewModel.messages[1].author, .eliza)
    }
}
```

Similar tests can be written for streaming, assuming a
`BidirectionalStreamingMessagingViewModel` that uses the generated `async`
version of the `converse()` streaming method:

```swift
/// Example test that injects a mock generated client into a bidirectional stream view model.
@MainActor
func testBidirectionalStreamMessagingViewModel() async {
    let client = Connectrpc_Eliza_V1_ElizaServiceClientMock()
    client.mockAsyncConverse.outputs = [.message(.with { $0.sentence = "hi, i'm eliza!" })]

    let viewModel = BidirectionalStreamingMessagingViewModel(elizaClient: client)
    await viewModel.send("hello!")
    await viewModel.send("hello again!")

    XCTAssertEqual(viewModel.messages[0].message, "hello!")
    XCTAssertEqual(viewModel.messages[0].author, .user)

    XCTAssertEqual(viewModel.messages[1].message, "hi, i'm eliza!")
    XCTAssertEqual(viewModel.messages[1].author, .eliza)

    XCTAssertEqual(viewModel.messages[2].message, "hello again!")
    XCTAssertEqual(viewModel.messages[2].author, .user)
}
```

## Testing with `@Sendable` closures

If your codebase is not yet using `async`/`await` and is instead consuming
generated clients that provide completion/result closures which are annotated
with `@Sendable`, writing tests can prove challenging. For example:

```swift
func testGetUser() {
    let client = Users_V1_UsersMock()
    client.mockGetUserInfo = { request in
        return ResponseMessage(result: .success(...))
    }

    var receivedMessage: Users_V1_UserInfoResponse?
    client.getUserInfo(request: Users_V1_UserInfoRequest()) { response in
        //highlight-next-line
        // ERROR: Mutation of captured var 'receivedMessage' in concurrently-executing code
        //highlight-next-line
        receivedMessage = response.message
    }
    XCTAssertEqual(receivedMessage?.name, "jane")
}
```

One workaround for this is to wrap the captured type with a class
that conforms to `Sendable`. For example:

```swift
public final class Locked<T>: @unchecked Sendable {
    private let lock = NSLock()
    private var wrappedValue: T

    /// Thread-safe access to the underlying value.
    public var value: T {
        get {
            self.lock.lock()
            defer { self.lock.unlock() }
            return self.wrappedValue
        }
        set {
            self.lock.lock()
            self.wrappedValue = newValue
            self.lock.unlock()
        }
    }

    public init(_ value: T) {
        self.wrappedValue = value
    }
}
```

The above error can be solved by updating the test to use this wrapper:

```swift
func testGetUser() {
    let client = Users_V1_UsersMock()
    client.mockGetUserInfo = { request in
        return ResponseMessage(result: .success(...))
    }

    //highlight-next-line
    let receivedMessage = Locked<Users_V1_UserInfoResponse?>(nil)
    client.getUserInfo(request: Users_V1_UserInfoRequest()) { response in
        //highlight-next-line
        receivedMessage.value = response.message
    }
    //highlight-next-line
    XCTAssertEqual(receivedMessage.value?.name, "jane")
}
```

[connect-swift]: https://github.com/bufbuild/connect-swift
[connect-swift-plugin]: https://buf.build/bufbuild/connect-swift
[connect-swift-mocks-plugin]: https://buf.build/bufbuild/connect-swift-mocks
