Contributing
============

We'd love your help making Connect better! This repository houses Connect's
website and governance documentation &mdash; if you're trying to improve our
documentation, amend our governance, or submit an RFC, you're in the right
place.

If you'd like to make substantial changes (including opening an RFC), please
[open an issue][open-issue] describing your proposal &mdash; discussing large
changes ahead of time makes pull request review much smoother. In your issue,
pull request, and any other communications, please remember to treat your
fellow contributors with respect!

Note that for a contribution to be accepted, you must sign off on all commits
in order to affirm that they comply with the [Developer Certificate of Origin][dco].
Make sure to configure `git` with the same name and E-Mail as your GitHub account,
and run `git commit` with the `-s` flag to sign. If necessary, a bot will remind
you to sign your commits when you open your pull request, and provide helpful tips.

## Documentation changes

Most documentation changes only require updating or adding Markdown. Fork, then
clone the repository, and make your changes locally. If you have Node.js
installed locally, you can preview your changes with `npm install && npm run
start`. More complex changes may require consulting the
[Docusaurus][docusaurus] documentation and understanding [this project's
component swizzling][swizzling]. When you're satisfied with your changes, [open
a pull request](https://github.com/connectrpc/connectrpc.com/compare).

At this point, you're waiting on us to review your changes. We *try* to respond
to issues and pull requests within a few business days, and we may suggest some
improvements or alternatives. Once your changes are approved, one of the
project maintainers will merge them. After your pull request is merged,
[Vercel][vercel] will update the production website automatically.

## RFCs

To propose a change that affects multiple Connect projects (for example, a
significant change to the protocol), open a pull request that adds a proposal
to `docs/governance/rfc`. Use a kebab-case filename with a three-digit prefix,
like `047-websocket-streaming.md`. Choose the next available number, and use
the [RFC template](/RFC_TEMPLATE.md) to structure your proposal.

When writing your RFC, be brief but complete. Get right to the point! Assume
that readers are familiar with Connect, HTTP, gRPC, and (if applicable)
Protocol Buffers. If context on other systems is helpful, include links to
references.

Once your pull request is open, the Connect maintainers will review it as
quickly as possible. Expect multiple rounds of review as maintainers ask you to
provide more detail, clarify, or amend your proposal. If merged, your proposal
will become part of the Connect project's official documentation and any
required work in other repositories can begin.

[fork]: https://github.com/connectrpc/connectrpc.com/fork
[open-issue]: https://github.com/connectrpc/connectrpc.com/issues/new
[dco]: https://developercertificate.org
[docusaurus]: https://docusaurus.io
[vercel]: https://vercel.com
[swizzling]: swizzling.md
