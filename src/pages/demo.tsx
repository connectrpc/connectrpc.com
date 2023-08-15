import React from "react";
import { ElizaDemo } from "../components/eliza-demo";
import LayoutProviders from "@theme/Layout/Provider";
import SkipToContent from "@theme/SkipToContent";
import AnnouncementBar from "@theme/AnnouncementBar";
import Footer from "@theme/Footer";
import NavBar from "@theme/Navbar";

export default function Demo(): JSX.Element {
  return (
    <LayoutProviders>
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
