// Copyright 2022-2023 The Connect Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import { ElizaDemo } from "../components/eliza-demo";
import LayoutProviders from "@theme/Layout/Provider";
import SkipToContent from "@theme/SkipToContent";
import AnnouncementBar from "@theme/AnnouncementBar";
import Footer from "@theme/Footer";
import NavBar from "@theme/Navbar";
import Head from "@docusaurus/Head";

export default function Demo(): JSX.Element {
  return (
    <LayoutProviders>
      <Head>
        <title>Demo | Connect</title>
      </Head>
      <SkipToContent />
      <AnnouncementBar />
      <NavBar />
      <div style={{ flexGrow: 1, padding: "15px" }}>
        <div
          style={{ marginTop: "45px", marginRight: "auto", marginLeft: "auto", maxWidth: "700px" }}
        >
          <div style={{ marginBottom: "60px" }}>
            <ElizaDemo focusOnMount />
          </div>
          <p>
            You are chatting with the <a href="https://github.com/connectrpc/examples-go">ELIZA demo service</a>,
            which is implemented in <a href="https://github.com/connectrpc/connect-go">connect-go</a>.
            <br /><br />
            This front-end client was built using <a href="https://github.com/connectrpc/connect-es">connect-web</a>,
            and you can follow <a href="/docs/web/getting-started">this guide</a> to implement it yourself.
            <br /><br />
            There is also a <a href="/docs/swift/getting-started">guide</a> to creating a similar ELIZA chat app
            for iOS (or macOS) using <a href="https://github.com/bufbuild/connect-swift">connect-swift</a>.
          </p>
        </div>
      </div>
      <Footer />
    </LayoutProviders>
  );
}
