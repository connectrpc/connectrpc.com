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

import SelectActivityScreenshot from './android-studio-select-empty-activity.png';
import NewProjectScreenshot from './android-studio-new-project.png';

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

## Define a Protobuf service

In the shell, create a proto directory to keep the `.proto` files in.

```bash
$ mkdir proto
$ cd proto
```

Next, scaffold a basic [`buf.yaml`][buf.yaml] by running `buf mod init`.

```bash
$ buf mod init
```

We have already defined the `ElizaService` and have
it [hosted on the Buf Schema Registry][eliza-proto] to use in this example.
Export the Protobuf schema to use in our project.

```bash title="~/.../Eliza/proto"
$ buf export buf.build/bufbuild/eliza -o .
```

Our new `proto` directory should look like this:

```
proto
├── buf
│   └── connect
│       └── demo
│           └── eliza
│               └── v1
│                   └── eliza.proto
└── buf.yaml
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

```bash
$ cd ..
$ touch buf.gen.yaml
```

We will use [_remote plugins_][remote-plugins], a feature of the [Buf Schema Registry][bsr] for generating code. Tell `buf`
how to generate code by putting this into [`buf.gen.yaml`][buf.gen.yaml]:

```yaml title=buf.gen.yaml
version: v1
plugins:
  - plugin: buf.build/protocolbuffers/java
    out: app/src/main/java
  - plugin: buf.build/bufbuild/connect-kotlin
    out: app/src/main/java
```

The above `buf.gen.yaml` config does two things:

1. Executes the [protocolbuffers/java](https://buf.build/protocolbuffers/java) plugin to generate Java specific code
   for the .proto files and places its
   output in the gen directory.
   :::note
   If the javalite option is desired, simply add `opt: javalite` to the yaml block.
   :::

2. Executes the [bufbuild/connect-kotlin](https://buf.build/bufbuild/connect-kotlin) plugin to generates clients for
   connect-kotlin. Compatible with the gRPC,
   gRPC-Web, and Connect RPC protocols into the specified directory. Connect is an RPC protocol which supports gRPC —
   including streaming! They interoperate seamlessly with Envoy, grpcurl, gRPC Gateway, and every other gRPC
   implementation. Connect servers handle gRPC-Web requests natively, without a translating proxy.

With those configuration files in place, generating Kotlin code
can be easily done:

```bash
$ buf generate proto
```

In the `app/src/main/java` directory, there should now be some generated Java and Kotlin files:

```
app/src/main/java
├── buf
│   └── connect
│       └── demo
│           └── eliza
│               └── v1
│                   ├── Eliza.java
│                   ├── ElizaServiceClient.kt
│                   └── ElizaServiceClientInterface.kt
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

:::note there exists two `build.gradle` files in the project.
Use the `build.gradle` located in `./app/build.gradle` and **not** the one in the root directory.
:::

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="apple" label="java" default>

```
dependencies {
  ...
  implementation 'androidx.recyclerview:recyclerview:1.2.1'
  implementation "androidx.lifecycle:lifecycle-runtime-ktx:2.5.1"
  implementation "com.squareup.okhttp3:okhttp:4.10.0"
  implementation "build.buf:connect-kotlin-okhttp:0.1.4"
  // Java specific dependencies.
  implementation "build.buf:connect-kotlin-google-java-ext:0.1.4"
  implementation "com.google.protobuf:protobuf-java:3.22.0"
}
```

  </TabItem>
  <TabItem value="orange" label="javalite">

```
dependencies {
  ...
  implementation 'androidx.recyclerview:recyclerview:1.2.1'
  implementation "androidx.lifecycle:lifecycle-runtime-ktx:2.5.1"
  implementation "com.squareup.okhttp3:okhttp:4.10.0"
  implementation "build.buf:connect-kotlin-okhttp:0.1.4"
  // Javalite specific dependencies.
  implementation "build.buf:connect-kotlin-google-javalite-ext:0.1.4"
  implementation "com.google.protobuf:protobuf-javalite:3.22.0"
}
```

  </TabItem>
</Tabs>

Once all the dependencies are declared, make sure Gradle is synced up.

:::note
The Protobuf dependency can be what the current project is already using. Make sure to have consistent
versions between the runtime and the Google Java plugin version. Here we are using the latest version.
:::

<details><summary>Having trouble with Gradle files? Here is what one might look like: </summary>

```groovy title="app/build.gradle"
plugins {
  id 'com.android.application'
  id 'org.jetbrains.kotlin.android'
}

android {
  namespace 'com.example.eliza'
  compileSdk 33

  defaultConfig {
    applicationId "com.example.eliza"
    minSdk 24
    targetSdk 33
    versionCode 1
    versionName "1.0"

    testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
  }

  buildTypes {
    release {
      minifyEnabled false
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
  compileOptions {
    sourceCompatibility JavaVersion.VERSION_1_8
    targetCompatibility JavaVersion.VERSION_1_8
  }
  kotlinOptions {
    jvmTarget = '1.8'
  }
}

dependencies {
  implementation 'androidx.core:core-ktx:1.7.0'
  implementation 'androidx.appcompat:appcompat:1.6.1'
  implementation 'com.google.android.material:material:1.8.0'
  implementation 'androidx.constraintlayout:constraintlayout:2.1.4'

  implementation "androidx.recyclerview:recyclerview:1.2.1"
  implementation "androidx.lifecycle:lifecycle-runtime-ktx:2.5.1"

  implementation "com.squareup.okhttp3:okhttp:4.10.0"
  implementation "build.buf:connect-kotlin-okhttp:$version"

  implementation "build.buf:connect-kotlin-google-java-ext:$version"
  implementation "com.google.protobuf:protobuf-java:3.22.0"
}
```

:::note

The default for my Android Studio isn't set up with Gradle `kts`. The examples here will is using
classic Gradle with Groovy. With Gradle `kts`, the changes are pretty similar for the dependency
declarations.

:::

</details>

## Set up and Android application

### Set up resources and Android XML

First, set up the `res` directory files by creating and copying the following files to the
project:

Create a new file in the `layout` directory called `item.xml` for a chat view item.

```bash
$ touch app/src/main/res/layout/item.xml
```

The following layout XML is going to be used as the chat list item.
It's the XML representation of what a single chat entry looks like.

```xml title="app/src/main/res/layout/item.xml"
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
              android:orientation="vertical"
              android:layout_width="match_parent"
              android:layout_height="wrap_content"
              android:padding="5dp"
>
  <TextView
    android:id="@+id/sender_name_text_view"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:gravity="left"
    android:text="Eliza"
    android:textColor="#161EDE"
    android:visibility="gone"
  />
  <TextView
    android:id="@+id/message_text_view"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:textColor="@android:color/black"
  />
</LinearLayout>
```

Next, we'll need to set up our main view's XML. This will be the view displayed on app launch.

```xml title="app/src/main/res/layout/activity_main.xml"
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
  xmlns:android="http://schemas.android.com/apk/res/android"
  xmlns:app="http://schemas.android.com/apk/res-auto"
  xmlns:tools="http://schemas.android.com/tools"
  android:layout_width="match_parent"
  android:layout_height="match_parent"
  android:padding="5dp"
  tools:context=".MainActivity"
>
  <TextView
    android:id="@+id/title_text_view"
    android:layout_width="match_parent"
    app:layout_constraintTop_toTopOf="parent"
    android:gravity="center"
    android:layout_height="40dp"
  />
  <androidx.recyclerview.widget.RecyclerView
    android:id="@+id/recycler_view"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    app:layoutManager="LinearLayoutManager"
    app:layout_constraintTop_toBottomOf="@+id/title_text_view"
    app:layout_constraintBottom_toTopOf="@+id/edit_text_view"
  />
  <EditText
    android:id="@+id/edit_text_view"
    android:layout_height="wrap_content"
    android:layout_width="match_parent"
    app:layout_constraintBottom_toBottomOf="parent"
    android:inputType="text"/>
  <Button
    android:id="@+id/send_button"
    android:layout_width="50dp"
    android:layout_height="50dp"
    app:layout_constraintBottom_toBottomOf="parent"
    app:layout_constraintRight_toRightOf="parent"
  />
</androidx.constraintlayout.widget.ConstraintLayout>
```

:::note
Android Studio likes to show the rendered UI by default when an XML file is opened.
To view the raw code, click the button `Code` in the top right corner.
:::

Lastly, make sure the `AndroidManifest.xml` declares the right permissions to make a network request.
Configure the application with network permissions by adding the following to  `AndroidManifest.xml`

```xml title="app/src/main/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
          package="com.example.eliza">

  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>

  <application
    android:allowBackup="true"
    android:label="Eliza Connect App"
    android:theme="@style/Theme.AppCompat.Light"
  >
    <activity
      android:name=".MainActivity"
      android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
      <meta-data
        android:name="android.app.lib_name"
        android:value=""/>
    </activity>
  </application>
</manifest>
```

That is it for our resource files for our application!

### Android Kotlin view scaffolding

Before we start on making a network request, we'll need to set up some plumbing.
In order to display a dynamic list of chat messages, we'll need to construct a
`RecyclerView` along with some of it's scaffolding and boilerplate.

Create a `RecyclerView.ViewHolder` and `RecyclerView.Adapter` in a file called `ChatRecycler.kt`.
We'll be defining the `MessageData` data class to help manage the external usage in the next section.

```bash
$ touch app/src/main/java/com/example/eliza/ChatRecycler.kt
```

and add the following:

```kotlin title="app/src/main/java/com/example/eliza/ChatRecycler.kt"
package com.example.eliza

import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView


class Adapter : RecyclerView.Adapter<ViewHolder>() {

  private val messages = mutableListOf<MessageData>()

  fun add(message: MessageData) {
    messages.add(message)
    notifyItemInserted(messages.size - 1)
  }

  override fun onCreateViewHolder(viewGroup: ViewGroup, viewType: Int): ViewHolder {
    val view = LayoutInflater.from(viewGroup.context)
      .inflate(R.layout.item, viewGroup, false)
    return ViewHolder(view)
  }

  override fun onBindViewHolder(viewHolder: ViewHolder, position: Int) {
    val messageViewModel = messages[position]
    viewHolder.textView.setText(messageViewModel.message)
    val layoutParams = viewHolder.textView.layoutParams as LinearLayout.LayoutParams
    layoutParams.gravity = if (messageViewModel.isEliza) Gravity.LEFT else Gravity.RIGHT
    viewHolder.textView.layoutParams = layoutParams

    if (messageViewModel.isEliza) {
      viewHolder.senderNameTextView.visibility = View.VISIBLE
    }
  }

  override fun getItemCount(): Int {
    return messages.size
  }
}

class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
  val senderNameTextView: TextView
  val textView: TextView

  init {
    textView = view.findViewById(R.id.message_text_view)
    senderNameTextView = view.findViewById(R.id.sender_name_text_view)
  }
}

data class MessageData(
  val message: String,
  val isEliza: Boolean
)
```

### Talk with Eliza on Android

Now we are ready to dive into actual Kotlin code to speak with Eliza!

The `ProtocolClient` constructor requires a `ProtocolClientConfig` to be instantiated.
The required parameters are the host, serialization strategy, and protocol:

- `host`: The host of the request (e.g `https://buf.build`).
- `serializationStrategy`: Configures the `ProtocolClient` to use a specified base data type and encoding
  (e.g., Google's Java and Google's Javalite).
- `protocol`: The underlying network protocol to use (e.g., Connect, gRPC, or gRPC-Web).

To use alternative serialization strategies or protocols, the `ProtocolClientConfig` can be instantiated with different
parameters:

```kotlin
val client = ProtocolClient(
  httpClient = ConnectOkHttpClient(OkHttpClient()),
  ProtocolClientConfig(
    host = host,
    serializationStrategy = GoogleJavaProtobufStrategy(),
    protocol = Protocol.CONNECT,
  ),
)
```

### Use the generated Eliza client code

With the `ProtocolClient`, we will be able to create an instance of `ElizaServiceClient` to talk with
the Eliza service.

By using the `lifecycleScope`, the underlying network request will be tied to the coroutine context provided.
To make the network request, we can call a simple method from the generated code:
`ElizaServiceClient.say(request: SayRequest)`. With that result, we will be able to appropriately handle the
success and failure cases of the network request.

Open up the `MainActivity.kt` file and replace its contents with the following:

```kotlin title="app/src/main/java/com/example/eliza/MainActivity.kt"
package com.example.eliza

import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.RecyclerView
import connectrpc.eliza.v1.Eliza
import connectrpc.eliza.v1.ElizaServiceClient
import build.buf.connect.ProtocolClientConfig
import build.buf.connect.extensions.GoogleJavaProtobufStrategy
import build.buf.connect.impl.ProtocolClient
import build.buf.connect.okhttp.ConnectOkHttpClient
import build.buf.connect.protocols.NetworkProtocol
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

  private val adapter: Adapter = Adapter()
  private lateinit var titleTextView: TextView
  private lateinit var editTextView: EditText
  private lateinit var buttonView: Button
  private lateinit var elizaServiceClient: ElizaServiceClient

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)
    editTextView = findViewById(R.id.edit_text_view)
    titleTextView = findViewById(R.id.title_text_view)
    buttonView = findViewById(R.id.send_button)
    // Default question to ask as a pre-fill.
    editTextView.setText("I feel good.")
    val recyclerView = findViewById<RecyclerView>(R.id.recycler_view)
    recyclerView.adapter = adapter

    // Create a ProtocolClient.
    val client = ProtocolClient(
      httpClient = ConnectOkHttpClient(),
      ProtocolClientConfig(
        host = "https://demo.connectrpc.com",
        serializationStrategy = GoogleJavaProtobufStrategy(), // Or GoogleJavaJSONStrategy for JSON.
        networkProtocol = NetworkProtocol.CONNECT,
      ),
    )
    // Create the Eliza service client.
    elizaServiceClient = ElizaServiceClient(client)

    // Set up click listener to make a request to Eliza.
    buttonView.setOnClickListener {
      val sentence = editTextView.text.toString()
      adapter.add(MessageData(sentence, false))
      editTextView.setText("")

      lifecycleScope.launch(Dispatchers.IO) {
        // Ensure IO context for unary requests.
        val elizaSentence = talkToEliza(sentence)
        lifecycleScope.launch(Dispatchers.Main) {
          // Display the result
          displayElizaResponse(elizaSentence)
        }
      }
    }
  }

  private fun talkToEliza(sentence: String): String? {
    // Make unary request to Eliza.
    val response = elizaServiceClient.say(Eliza.SayRequest.newBuilder().setSentence(sentence).build())
    val elizaSentence = response.success { success ->
      // Get Eliza's reply from the response.
      success.message.sentence
    }
    response.failure { failure ->
      Log.e("MainActivity", "${failure.error}")
    }
    return elizaSentence
  }

  private fun displayElizaResponse(sentence: String) {
    if (elizaSentence!!.isNotBlank()) {
      adapter.add(MessageData(elizaSentence, true))
    } else {
      adapter.add(MessageData("...No response from Eliza...", true))
    }
  }
}
```

## Serialization Strategies

When configuring the `ProtocolClient` in the `MainActivity.kt`, it is also possible to configure what type
of Google generated base data type to use via the `ProtocolClientConfig.serializationStrategy`.
In the example, we use `GoogleJavaProtobufStrategy` which is the Google generated Java data types with the
Protobuf serialization.

To use JSON with the Google generated Java data types, the `GoogleJavaJSONStrategy` can be used.

Additionally, the `GoogleJavaLiteProtobufStrategy` is for when there are binary size requirements where
the underlying data types are the Google generated data types with the `javalite` option.

## Run the app

Now the app can be built and run via the play button on Android Studio. This will allow us to chat with Eliza!

import ElizaChatScreenshot from './success-request-finish.png';

<img  src={ElizaChatScreenshot} width="300px" alt="Chat with Eliza!"/>

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

## More examples

There are more [detailed examples][more-examples] within
the Connect-Kotlin repository on GitHub. These examples demonstrate:

- Using [streaming APIs][streaming-example-kotlin].
- Integrating with [Google's Java][pgjava-example] and [Javalite Protobuf][pgjavalite-example].
- Using the [Connect protocol](../protocol.md).
- Using the [gRPC protocol][grpc].
- Using the [gRPC-Web protocol][grpc-web].

[android-studio]: https://developer.android.com/studio

[android-studio-virtual-device]: https://developer.android.com/studio/run/managing-avds

[bsr]: https://buf.build/docs/tutorials/getting-started-with-bsr

[buf]: https://buf.build/docs/

[buf-cli]: https://buf.build/docs/installation

[buf.gen.yaml]: https://buf.build/docs/configuration/v1/buf-gen-yaml

[buf.yaml]: https://buf.build/docs/configuration/v1/buf-yaml

[connect-go]: https://github.com/connectrpc/connect-go

[connect-kotlin]: https://github.com/bufbuild/connect-kotlin

[connect-kotlin-releases]: https://github.com/bufbuild/connect-kotlin/releases

[eliza-proto]: https://buf.build/connectrpc/eliza/file/main:connectrpc/eliza/v1/eliza.proto

[go-demo]: https://github.com/connectrpc/examples-go

[google-java-protobuf]: https://buf.build/protocolbuffers/java

[grpc]: https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md

[grpc-java]: https://github.com/grpc/grpc-java

[grpc-web]: https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md

[more-examples]: https://github.com/bufbuild/connect-kotlin/tree/main/examples

[okhttp]: https://github.com/square/okhttp

[protobuf]: https://developers.google.com/protocol-buffers

[protobuf-releases]: https://github.com/protocolbuffers/protobuf/releases

[pgjava-example]: https://github.com/bufbuild/connect-kotlin/blob/main/examples/kotlin-google-java/src/main/kotlin/build/buf/connect/examples/kotlin/Main.kt

[pgjavalite-example]: https://github.com/bufbuild/connect-kotlin/blob/main/examples/kotlin-google-javalite/src/main/kotlin/build/buf/connect/examples/kotlin/Main.kt

[remote-plugins]: https://buf.build/docs/bsr/remote-plugins/usage

[streaming-example-kotlin]: https://github.com/bufbuild/connect-kotlin/blob/main/examples/kotlin-google-java/src/main/kotlin/build/buf/connect/examples/kotlin/Main.kt#L55-L71
