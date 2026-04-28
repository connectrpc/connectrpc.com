---
title: Getting started
sidebar_position: 1
---

Connect-Kotlin is a thin library that provides support for using
generated, type-safe, and idiomatic Kotlin APIs to communicate with the app's
servers using [Protobuf][protobuf].

In this guide, we'll use Connect-Kotlin to create a chat app for
[ELIZA](https://en.wikipedia.org/wiki/ELIZA),
a very simple natural language processor built in the 1960s to represent a
psychotherapist. **The ELIZA service is
[implemented using Connect-Go][go-demo], is
[already up and running](https://connectrpc.com/demo) in production, and
supports the [gRPC][grpc], [gRPC-Web][grpc-web], and [Connect](../protocol.md)
protocols - all of which can be used with Connect-Kotlin for this tutorial.**
The APIs we'll be using are defined in a Protobuf schema that we'll use
to generate a Connect-Kotlin client.

## Prerequisites

* [Android Studio][android-studio] installed.
* [The Buf CLI][buf-cli] installed, and include it in the `$PATH`.
* Set up [Virtual Device Configuration][android-studio-virtual-device] on Android Studio, or
use a physical device.

## Create a new Android project from Android Studio

Once Android Studio is set up, go through the setup wizard and select an
empty Activity to start building an application:

import SelectActivityScreenshot from './android-studio-select-empty-activity-new.png';
import NewProjectScreenshot from './android-studio-new-project-new.png';

1. Create a new project with Android Studio.
2. Select an empty activity for the project and click "Next".<br/>
<img src={SelectActivityScreenshot} width="800px" />
3. For the project name, name it `Eliza`.
4. Make sure the package is `com.example.eliza`, and leave the rest as default.<br/>
<img src={NewProjectScreenshot} width="800px" />

:::note
By default, Android Studio's project name is `My Application` and the package is `com.example.myapplication`. If that
is not overridden, the rest of the example will need to replace `com.example.eliza` with
`com.example.myapplication` within the code snippets.
:::

Create an Android application with Gradle and Android Studio. Now we can start
defining a new API for talking with Eliza!

## Define a service

First, we need to add a Protobuf file that includes our service definition. For this tutorial, we are going to construct a unary endpoint for a service that is a stripped-down implementation of ELIZA, the famous natural language processing program.

```shell-session
$ mkdir -p proto/connectrpc/eliza/v1 && touch proto/connectrpc/eliza/v1/eliza.proto
```

Open up the above file and add the following service definition:

```protobuf
syntax = "proto3";

package connectrpc.eliza.v1;

message SayRequest {
  string sentence = 1;
}

message SayResponse {
  string sentence = 1;
}

service ElizaService {
  rpc Say(SayRequest) returns (SayResponse) {}
}
```

Open the newly created `eliza.proto` file in the editor.
This file declares a `connectrpc.eliza.v1` Protobuf package,
a service called `ElizaService`, and a single method
called `Say`. Under the hood, these components will be used to form the path
of the API's HTTP URL.

The file also contains two models, `SayRequest` and `SayResponse`, which
are the input and output for the `Say` RPC method.

## Generate code

We're going to generate our code using [`buf`][buf], a modern replacement for
Google's protobuf compiler.

First, scaffold a basic [`buf.yaml`][buf.yaml] by running `buf config init` at the root of your repository. Then, edit `buf.yaml`
to use our `proto` directory:

```yaml title=buf.yaml
version: v2
// highlight-next-line
modules:
// highlight-next-line
  - path: proto
lint:
  use:
    - DEFAULT
breaking:
  use:
    - FILE
```

We will use [_remote plugins_][remote-plugins], a feature of the [Buf Schema Registry][bsr] for generating code. Tell `buf`
how to generate code by creating a [`buf.gen.yaml`][buf.gen.yaml]:

```shell-session
$ touch buf.gen.yaml
```

```yaml title=buf.gen.yaml
version: v2
plugins:
  - remote: buf.build/protocolbuffers/java
    out: app/src/main/java
  - remote: buf.build/connectrpc/kotlin
    out: app/src/main/java
```

The above `buf.gen.yaml` config does two things:

1. Executes the [protocolbuffers/java](https://buf.build/protocolbuffers/java) plugin to generate Java specific code
   for the .proto files and places its
   output in the gen directory.
   :::note
   If the javalite option is desired, simply add `opt: javalite` to the yaml block.
   :::

2. Executes the [connectrpc/kotlin](https://buf.build/connectrpc/kotlin) plugin to generates clients for
   connect-kotlin. Compatible with the gRPC,
   gRPC-Web, and Connect RPC protocols into the specified directory. Connect is an RPC protocol which supports gRPC —
   including streaming! They interoperate seamlessly with Envoy, grpcurl, gRPC Gateway, and every other gRPC
   implementation. Connect servers handle gRPC-Web requests natively, without a translating proxy.

With those configuration files in place, generating Kotlin code
can be easily done:

```shell-session
$ buf lint
$ buf generate
```

In the `app/src/main/java` directory, there should now be some generated Java and Kotlin files:

```text
app/src/main/java
├── connectrpc
│   └── eliza
│       └── v1
│           ├── Eliza.java
│           ├── ElizaServiceClient.kt
│           └── ElizaServiceClientInterface.kt
└── com
    └── example
        └── eliza
            └── MainActivity.kt
```

The `ElizaServiceClientInterface.kt` file contains the interface for the
`ElizaServiceClient`, and the `ElizaServiceClient.kt` file contains the implementation that conforms
to this interface.

The `.java` file is generated by Google's
[Java plugin][google-java-protobuf] and contains the corresponding Java
models for the `SayRequest` and `SayResponse` we defined in our Protobuf file.

## Update the application dependencies

Now, let's bootstrap the Android application. Declare the following additional dependencies in our
app's `build.gradle`.

:::note there exists two `build.gradle.kts` files in the project.
Use the `build.gradle.kts` located in `./app` and **not** the one in the root directory.
:::

build.gradle.kts:

```kotlin
dependencies {
    // Compose
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.lifecycle.runtime.compose)

    // Connect-Kotlin (latest as of writing: 0.8.0)
    implementation(libs.okhttp)
    implementation(libs.connect.kotlin.okhttp)
    implementation(libs.connectrpc.connect.kotlin.google.java.ext)
    implementation(libs.protobuf.java)
}
```

libs.versions.toml:
```toml
[versions]
#...
connectKotlinGoogleJavaExt = "0.8.0"
connectKotlinOkhttp = "0.8.0"
okhttp = "5.3.2"
protobufJava = "4.34.1"
lifecycleViewmodelCompose = "2.10.0"
lifecycleRuntimeCompose = "2.10.0"

[libraries]
#...
androidx-lifecycle-viewmodel-compose = { module = "androidx.lifecycle:lifecycle-viewmodel-compose", version.ref = "lifecycleViewmodelCompose" }
connect-kotlin-okhttp = { module = "com.connectrpc:connect-kotlin-okhttp", version.ref = "connectKotlinOkhttp" }
connectrpc-connect-kotlin-google-java-ext = { module = "com.connectrpc:connect-kotlin-google-java-ext", version.ref = "connectKotlinGoogleJavaExt" }
lifecycle-runtime-compose = { module = "androidx.lifecycle:lifecycle-runtime-compose", version.ref = "lifecycleRuntimeCompose" }
okhttp = { module = "com.squareup.okhttp3:okhttp", version.ref = "okhttp" }
protobuf-java = { module = "com.google.protobuf:protobuf-java", version.ref = "protobufJava" }
```

Once all the dependencies are declared, make sure Gradle is synced up.

:::note
The Protobuf dependency can be what the current project is already using. Make sure to have consistent
versions between the runtime and the Google Java plugin version. Here we are using the latest version.
:::

<details>
<summary>Having trouble with Gradle files? Here is what one might look like: </summary>

```kotlin title="app/build.gradle.kts"
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.example.eliza"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "com.example.eliza"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)

    // Compose
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.lifecycle.runtime.compose)

    // Connect-Kotlin (latest as of writing: 0.8.0)
    implementation(libs.okhttp)
    implementation(libs.connect.kotlin.okhttp)
    implementation(libs.connectrpc.connect.kotlin.google.java.ext)
    implementation(libs.protobuf.java)

    testImplementation(libs.junit)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.androidx.junit)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
    debugImplementation(libs.androidx.compose.ui.tooling)
}
```

```toml title="gradle/libs.versions.toml"
[versions]
agp = "9.2.0"
connectKotlinGoogleJavaExt = "0.8.0"
connectKotlinOkhttp = "0.8.0"
coreKtx = "1.18.0"
junit = "4.13.2"
junitVersion = "1.3.0"
espressoCore = "3.7.0"
lifecycleRuntimeCompose = "2.10.0"
lifecycleRuntimeKtx = "2.10.0"
activityCompose = "1.13.0"
kotlin = "2.3.21"
composeBom = "2026.04.01"
lifecycleViewmodelCompose = "2.10.0"
okhttp = "5.3.2"
protobufJava = "4.34.1"


[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-viewmodel-compose = { module = "androidx.lifecycle:lifecycle-viewmodel-compose", version.ref = "lifecycleViewmodelCompose" }
connect-kotlin-okhttp = { module = "com.connectrpc:connect-kotlin-okhttp", version.ref = "connectKotlinOkhttp" }
connectrpc-connect-kotlin-google-java-ext = { module = "com.connectrpc:connect-kotlin-google-java-ext", version.ref = "connectKotlinGoogleJavaExt" }
junit = { group = "junit", name = "junit", version.ref = "junit" }
androidx-junit = { group = "androidx.test.ext", name = "junit", version.ref = "junitVersion" }
androidx-espresso-core = { group = "androidx.test.espresso", name = "espresso-core", version.ref = "espressoCore" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-compose-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-compose-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-compose-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-compose-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-compose-ui-test-manifest = { group = "androidx.compose.ui", name = "ui-test-manifest" }
androidx-compose-ui-test-junit4 = { group = "androidx.compose.ui", name = "ui-test-junit4" }
androidx-compose-material3 = { group = "androidx.compose.material3", name = "material3" }
lifecycle-runtime-compose = { module = "androidx.lifecycle:lifecycle-runtime-compose", version.ref = "lifecycleRuntimeCompose" }
okhttp = { module = "com.squareup.okhttp3:okhttp", version.ref = "okhttp" }
protobuf-java = { module = "com.google.protobuf:protobuf-java", version.ref = "protobufJava" }


[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
```

:::note

The default for Android Studio is now Gradle `kts`. For classic Gradle with Groovy, the changes are similar for the dependency declarations, but there is no `libs.versions.toml` file.

:::

</details>

## Set up an Android application

### Create the View and Model

Now we are ready to write the Kotlin code to speak with Eliza!

Create a new Kotlin file in the `app/src/main/java/com/example/eliza` directory called `ElizaViewModel.kt`. First, we will create the model classes for the UI state and the Eliza service client.

```kotlin
data class MessageData(
    val message: String,
    val isEliza: Boolean
)

data class ElizaUiState(
    val messages: List<MessageData> = emptyList(),
    val input: String = "I feel good.",
    val isSending: Boolean = false
)
```

The `MessageData` class is used to represent the messages that are displayed in the UI. The `ElizaUiState` class is used to represent the state of the UI.

Next we define the `ElizaViewModel` class and the state it manages.

```kotlin
class ElizaViewModel : ViewModel() {
    private val _state = MutableStateFlow(ElizaUiState())
    val state = _state.asStateFlow()

    fun onInputChange(new: String) {
        _state.update { it.copy(input = new) }
    }
}
```
The `onInputChange` method is used to update the input value of the UI. We will use this method to update the input value when the user types in the input field.

Next we write the code to communicate with Eliza using a `com.connectrpc.impl.ProtocolClient`. The `ProtocolClient` constructor requires a `com.connectrpc.ProtocolClientConfig` to be instantiated. The required parameters are the host, serialization strategy, and protocol:

- `host`: The host of the request (e.g `https://demo.connectrpc.com`).
- `serializationStrategy`: Configures the `ProtocolClient` to use a specified base data type and encoding
  (e.g., Google's Java and Google's JavaLite).
- `networkProtocol`: The underlying network protocol to use (e.g., Connect, gRPC, or gRPC-Web).

In the `ElizaViewModel` class, create a `ProtocolClient` and a `ElizaServiceClient` to talk with the Eliza service.

```kotlin
private val client = ProtocolClient(
    httpClient = ConnectOkHttpClient(),
    ProtocolClientConfig(
        host = "https://demo.connectrpc.com",
        serializationStrategy = GoogleJavaProtobufStrategy(),
        networkProtocol = NetworkProtocol.CONNECT,
    ),
)

private val eliza = ElizaServiceClient(client)
```

Next, write the `talkToEliza` method to send a sentence to the Eliza service and return the response.

```kotlin
    private suspend fun talkToEliza(sentence: String): String? {
        val response = eliza.say(
            Eliza.SayRequest.newBuilder().setSentence(sentence).build()
        )
        val reply = response.success { it.message.sentence }
        response.failure { Log.e("ElizaViewModel", "Failed to talk to eliza", it.cause) }
        return reply
    }
```

To make the network request, we call a simple method from the generated code: `ElizaServiceClient.say(request: SayRequest)`. 
With that result, we are able to appropriately handle the success and failure cases of the network request.

Finally, add a `send` method to the `ElizaViewModel` to send a sentence to the Eliza service when the user
clicks the send button. (The send button is created in the next step.)

```kotlin
    fun send() {
        val sentence = _state.value.input.trim()
        if (sentence.isEmpty() || _state.value.isSending) return

        _state.update {
            it.copy(
                messages = it.messages + MessageData(sentence, isEliza = false),
                input = "",
                isSending = true,
            )
        }

        viewModelScope.launch {
            val reply = withContext(Dispatchers.IO) { talkToEliza(sentence) }
            _state.update {
                it.copy(
                    messages = it.messages + MessageData(
                        message = reply ?: "...No response from Eliza...",
                        isEliza = true,
                    ),
                    isSending = false,
                )
            }
        }
    }
```

The complete code for `ElizaViewModel.kt` is as follows:

```kotlin title=app/src/main/java/com/example/eliza/ElizaViewModel.kt
package com.example.eliza

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.connectrpc.ProtocolClientConfig
import com.connectrpc.extensions.GoogleJavaProtobufStrategy
import com.connectrpc.impl.ProtocolClient
import com.connectrpc.okhttp.ConnectOkHttpClient
import com.connectrpc.protocols.NetworkProtocol
import connectrpc.eliza.v1.Eliza
import connectrpc.eliza.v1.ElizaServiceClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class MessageData(
    val message: String,
    val isEliza: Boolean
)

data class ElizaUiState(
    val messages: List<MessageData> = emptyList(),
    val input: String = "I feel good.",
    val isSending: Boolean = false
)

class ElizaViewModel : ViewModel() {

    private val client = ProtocolClient(
        httpClient = ConnectOkHttpClient(),
        ProtocolClientConfig(
            host = "https://demo.connectrpc.com",
            serializationStrategy = GoogleJavaProtobufStrategy(),
            networkProtocol = NetworkProtocol.CONNECT,
        ),
    )
    private val eliza = ElizaServiceClient(client)

    private val _state = MutableStateFlow(ElizaUiState())
    val state = _state.asStateFlow()

    fun onInputChange(new: String) {
        _state.update { it.copy(input = new) }
    }

    fun send() {
        val sentence = _state.value.input.trim()
        if (sentence.isEmpty() || _state.value.isSending) return

        _state.update {
            it.copy(
                messages = it.messages + MessageData(sentence, isEliza = false),
                input = "",
                isSending = true,
            )
        }

        viewModelScope.launch {
            val reply = withContext(Dispatchers.IO) { talkToEliza(sentence) }
            _state.update {
                it.copy(
                    messages = it.messages + MessageData(
                        message = reply ?: "...No response from Eliza...",
                        isEliza = true,
                    ),
                    isSending = false,
                )
            }
        }
    }

    private suspend fun talkToEliza(sentence: String): String? {
        val response = eliza.say(
            Eliza.SayRequest.newBuilder().setSentence(sentence).build()
        )
        val reply = response.success { it.message.sentence }
        response.failure { Log.e("ElizaViewModel", "Failed to talk to eliza", it.cause) }
        return reply
    }
}
```

#### Serialization Strategies

When configuring the `ProtocolClient` in the `ElizaViewModel.kt`, it is also possible to configure what type
of Google generated base data type to use via the `ProtocolClientConfig.serializationStrategy`.
In the example, we use `GoogleJavaProtobufStrategy` which is the Google generated Java data types with the
Protobuf serialization.

To use alternative serialization strategies or protocols, the `ProtocolClientConfig` can be instantiated with different
parameters. To use JSON with the Google generated Java data types, the `GoogleJavaJSONStrategy` can be used.

Additionally, the `GoogleJavaLiteProtobufStrategy` is for when there are binary size requirements where
the underlying data types are the Google generated data types with the `javalite` option.

### Build the UI
Open up the `MainActivity.kt` file and replace its contents with the following:

```kotlin title="app/src/main/java/com/example/eliza/MainActivity.kt"
package com.example.eliza

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

class MainActivity : ComponentActivity() {

    private val viewModel: ElizaViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    ElizaScreen(viewModel)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ElizaScreen(viewModel: ElizaViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val listState = rememberLazyListState()

    // Auto-scroll to bottom when new messages arrive.
    LaunchedEffect(state.messages.size) {
        if (state.messages.isNotEmpty()) {
            listState.animateScrollToItem(state.messages.size - 1)
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Chat with Eliza") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(8.dp)
        ) {
            LazyColumn(
                state = listState,
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                items(state.messages) { msg -> MessageRow(msg) }
            }

            Spacer(Modifier.height(8.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = state.input,
                    onValueChange = viewModel::onInputChange,
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    enabled = !state.isSending,
                )
                Spacer(Modifier.width(8.dp))
                Button(
                    onClick = viewModel::send,
                    enabled = !state.isSending && state.input.isNotBlank(),
                ) {
                    Text(if (state.isSending) "…" else "Send")
                }
            }
        }
    }
}

@Composable
private fun MessageRow(msg: MessageData) {
    val alignment = if (msg.isEliza) Alignment.Start else Alignment.End
    val bubbleColor = if (msg.isEliza)
        MaterialTheme.colorScheme.surfaceVariant
    else
        MaterialTheme.colorScheme.primaryContainer

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = alignment,
    ) {
        if (msg.isEliza) {
            Text(
                text = "Eliza",
                color = Color(0xFF161EDE),
                fontWeight = FontWeight.SemiBold,
            )
        }
        Surface(
            color = bubbleColor,
            shape = RoundedCornerShape(12.dp),
        ) {
            Text(
                text = msg.message,
                modifier = Modifier
                    .background(bubbleColor)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
            )
        }
    }
}
```

The `ElizaScreen` composable is the main UI of the app. It displays the messages that have been sent to Eliza and allows the user to send a new message. The `MessageRow` composable is used to display each message in the chat. When the user clicks the send button, the `viewModel.send()` method is called, which sends the message to Eliza and updates the UI accordingly. The `MessageRow` composable is also used to display the messages that have been sent to Eliza.

## Run the app

Now the app can be built and run via the play button on Android Studio. This will allow us to chat with Eliza!

import ElizaChatScreenshot from './success-request-finish-new.png';

<img src={ElizaChatScreenshot} width="300px" alt="Chat with Eliza!"/>

## Using the gRPC or gRPC-Web protocol

Connect-Kotlin supports the [Connect protocol](../protocol.md), the
[gRPC protocol][grpc], and the [gRPC-Web protocol][grpc-web].
Instructions for switching between the three can be found [here](./using-clients.md).

We recommend using Connect-Kotlin over [gRPC-java][grpc-java] even when
using the gRPC-Web protocol for a few reasons:

- **Idiomatic, typed APIs.** No more hand-writing REST/JSON endpoints and
  data types. Connect-Kotlin [generates](./using-clients.md#using-generated-clients)
  idiomatic APIs that utilize Kotlin's language features and ergonomic improvements.
- **Easy-to-use tooling.** Connect-Kotlin integrates with the Buf CLI,
  enabling running all necessary Protobuf plugins without having to install
  or configure them as local dependencies.
- **Flexibility.** Connect-Kotlin uses `Okhttp`. The library provides
  the option to [swap this out](./using-clients.md#http-stack).

## Choosing a Protobuf runtime: Java vs. JavaLite
Connect-Kotlin doesn't define its own message types. It generates Kotlin client interfaces (such as `ElizaServiceClient`) but delegates the actual request/response message classes (like `SayRequest`, and `SayResponse`) to Google's Protobuf runtime. Google ships two flavors for the JVM, and you need to pick one before adding dependencies.

- `protobuf-java` is the full runtime. It supports reflection, descriptors, dynamic messages, text format, and the full Protobuf feature set. It's what you'd use on a server or in a JVM tool. The tradeoff is size: the runtime jar is several MB and adds thousands of methods to your app.
- `protobuf-javalite` is a stripped-down runtime built specifically for Android and other size-constrained environments. Generated message classes are smaller, the runtime itself is a fraction of the size, and the method count is dramatically lower. The cost is that reflection-based features are gone — no DynamicMessage, no descriptor-based parsing, no text format, no JsonFormat from `protobuf-java-util`. For a typical mobile app that just sends and receives generated message types, you never miss them.

### Which should you pick?
For most Android apps, JavaLite is the right default. You're shipping an APK to user devices, binary size and method count are real constraints, and you almost certainly aren't doing reflection over Protobuf messages at runtime.

Reach for the full protobuf-java runtime when you actually need one of its features:
- You're sharing the proto-generated code between your Android app and a JVM backend that needs the full runtime.
- You're using JsonFormat to convert between Protobuf and JSON outside of what Connect-Kotlin's GoogleJavaJSONStrategy handles.
- You depend on a third-party library that requires protobuf-java (some observability and serialization libraries do).
- You need DynamicMessage or descriptor-based parsing — for instance, if you're building tooling that handles messages whose schema isn't known at compile time.

### How to switch between them
You need to make three coordinated changes to swap from Java to Javalite. They have to match or you'll get cryptic linker errors at runtime.

1. `buf.gen.yaml` — tell the codegen plugin which runtime to target:

```yaml
version: v2
plugins:
    - remote: buf.build/protocolbuffers/java
      out: app/src/main/java
      opt: lite              # add this line for JavaLite
    - remote: buf.build/connectrpc/kotlin
      out: app/src/main/java
```
Note that the `lite` option is only valid for the `java` plugin.

2. `app/build.gradle.kts` — swap the two artifacts that are runtime-flavor-specific:

```kotlin
    // JavaLite
   implementation("com.connectrpc:connect-kotlin-google-javalite-ext:0.8.0")
   implementation("com.google.protobuf:protobuf-javalite:4.28.2")
```

or

```kotlin
    // Full Java
    implementation("com.connectrpc:connect-kotlin-google-java-ext:0.8.0")
    implementation("com.google.protobuf:protobuf-java:4.28.2")
```

3. `ElizaViewModel.kt` — swap the serialization strategy passed to `ProtocolClientConfig`:

```kotlin
   // JavaLite
   serializationStrategy = GoogleJavaLiteProtobufStrategy()
```

or

```kotlin
    // Full Java
    serializationStrategy = GoogleJavaProtobufStrategy()
```

Everything else is identical. The generated `SayRequest.newBuilder().setSentence(...).build()` API looks the same in both flavors. The only thing changing is what's running underneath.

One gotcha: mixing them silently is a common mistake. If `buf.gen.yaml` generates Lite code but your dependencies pull in `protobuf-java`, or vice versa, the project compiles fine and then crashes at runtime with `NoClassDefFoundError` or `AbstractMethodError` the first time a message is serialized. If you switch flavors, do all three steps in one commit and run a clean build (`./gradlew clean assembleDebug`) before testing.

## More examples

There are more [detailed examples][more-examples] within
the Connect-Kotlin repository on GitHub. These examples demonstrate:

- Using [streaming APIs][streaming-example-kotlin].
- Integrating with [Google's Java][pgjava-example] and [JavaLite Protobuf][pgjavalite-example].
- Using the [Connect protocol](../protocol.md).
- Using the [gRPC protocol][grpc].
- Using the [gRPC-Web protocol][grpc-web].

[android-studio]: https://developer.android.com/studio

[android-studio-virtual-device]: https://developer.android.com/studio/run/managing-avds

[bsr]: https://buf.build/docs/tutorials/getting-started-with-bsr

[buf]: https://buf.build/docs/

[buf-cli]: https://buf.build/docs/installation

[buf.gen.yaml]: https://buf.build/docs/configuration/v2/buf-gen-yaml

[buf.yaml]: https://buf.build/docs/configuration/v2/buf-yaml

[connect-go]: https://github.com/connectrpc/connect-go

[connect-kotlin]: https://github.com/connectrpc/connect-kotlin

[connect-kotlin-releases]: https://github.com/connectrpc/connect-kotlin/releases

[eliza-proto]: https://buf.build/connectrpc/eliza/file/main:connectrpc/eliza/v1/eliza.proto

[go-demo]: https://github.com/connectrpc/examples-go

[google-java-protobuf]: https://buf.build/protocolbuffers/java

[grpc]: https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md

[grpc-java]: https://github.com/grpc/grpc-java

[grpc-web]: https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md

[more-examples]: https://github.com/connectrpc/connect-kotlin/tree/main/examples

[okhttp]: https://github.com/square/okhttp

[protobuf]: https://developers.google.com/protocol-buffers

[protobuf-releases]: https://github.com/protocolbuffers/protobuf/releases

[pgjava-example]: https://github.com/connectrpc/connect-kotlin/blob/main/examples/kotlin-google-java/src/main/kotlin/com/connectrpc/examples/kotlin/Main.kt

[pgjavalite-example]: https://github.com/connectrpc/connect-kotlin/blob/main/examples/kotlin-google-javalite/src/main/kotlin/com/connectrpc/examples/kotlin/Main.kt

[remote-plugins]: https://buf.build/docs/bsr/remote-plugins/usage

[streaming-example-kotlin]: https://github.com/connectrpc/connect-kotlin/blob/main/examples/kotlin-google-java/src/main/kotlin/com/connectrpc/examples/kotlin/Main.kt#L55-L71
