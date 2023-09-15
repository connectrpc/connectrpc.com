---
title: Governance
sidebar_position: 10
---

Simplicity, reliability, and interoperability are the core values of the
Connect RPC libraries. We'd like the same values to characterize the Connect
project's governance:

- Simple, open decision-making,
- Reliable, vendor-neutral stewardship, and
- Openness to community contributions.

To those ends, this document outlines the rules by which the [Connect
project][project] governs itself.

## Code of conduct

The Connect community abides by the CNCF [code of conduct][cncf-coc] and
[statement of values][cncf-charter]. We are open, curious, and collaborative
&mdash; with each other and with other communities.

## Making decisions

Connect is an open source project, so we make decisions in the open. Connect's
governance, protocols, APIs, and roadmap are defined in [GitHub][project], so
making decisions requires changing source code. Thus, all decisions follow the
same four steps:

1. Optionally, create an issue or discussion. Anyone can do this.
2. Open a pull request. Anyone can do this.
3. Discuss the pull request. Anyone can do this.
4. Merge or refuse the pull request. Only maintainers can do this.

Each repository lists the current maintainers in a `MAINTAINERS.md` file. (The
process for adding and removing maintainers is detailed below.)

We prefer to work out decisions among the involved community members, keeping
in mind Connect's values and code of conduct. If the involved community members
can't reach consensus, any community member may call for a vote among the
current maintainers:

- Votes are implemented as GitHub pull request reviews.
- Pull requests with an ongoing vote must have the `vote` tag and remain open
  for at least two weeks, unless a decision is reached sooner.
- Each maintainer may cast one vote, with a simple majority required for
  approval.
- Any decisions affecting multiple repositories must be discussed in an RFC,
  discussed below.

## Project-wide decisions

To make decisions affecting multiple repositories, Connect uses RFCs: pull
requests adding a public design document to the [website and governance
repository][governance-repo]. The process for opening an RFC is documented in
the [contribution guide][governance-contrib].

The decision-making process for RFCs is the same as it is for other pull
requests &mdash; discussion, followed by consensus or a formal vote among
maintainers. However, the list of maintainers for the governance repository is
handled specially: it includes all the maintainers of Connect implementations,
but not maintainers of standalone interceptors, testing utilities, and similar
ancillary projects. This policy considers the needs of each language-specific
Connect ecosystem, keeps the voting process lightweight, and lowers the bar
for creating small new projects. As detailed below, new Connect implementations
are identified during the repository creation process.

## Becoming a maintainer

Maintainers (or "committers" in CNCF parlance) are contributors devoted to the
long-term success of a Connect project. In addition to opening pull requests,
maintainers can:

- Triage pull requests, issues, and discussions, assigning labels and
  reviewers.
- Run continuous integration testing and merge pull requests.
- Cast a vote when the project must make a formal decision.

To become maintainers, contributors must:

- Contribute code, comment on pull requests, respond to issues, and answer
  ad-hoc user questions for a period comparable to other maintainers (and no
  less than 3 months),
- Predictably devote a portion of their time to Connect,
- Demonstrate deep understanding of the project they'd like to maintain, and
- Have two-factor authentication enabled on their GitHub account.

As always, the decision to add a maintainer is made by opening a pull request
&mdash; in this case, to `MAINTAINERS.md`. The current project maintainers then
reach consensus or vote on the pull request. If the project has no active
maintainers, the [governance repository][governance-repo] maintainers may vote
to approve the pull request. Generally, prospective maintainers discuss their
candidacy with the current maintainers before opening a pull request.

## Losing maintainer status

Maintainers may step down by opening a pull request to change `MAINTAINERS.md`
files in one or more repositories. If they wish, they may continue to list
themselves as former maintainers.

If a maintainer has stopped contributing for three months, any other maintainer
may open a pull request to remove them from the maintainers list. No prior
notice is required, but the pull request must @-mention the absent maintainer,
remain open for two weeks, and be approved by a majority of the project's
maintainers.

In the unusual case when a repository has no active maintainers, inactive
maintainers can be removed by a pull request approved by a majority of the
[governance repository][governance-repo] maintainers.

## Adding new repositories

The Connect project includes full-fledged RPC runtimes, but it also includes
smaller projects: testing utilities, middleware and interceptors, plugins for
other systems, and similar conveniences. As long as it adheres to the CNCF [code
of conduct][cncf-coc] and [charter][cncf-charter], any repository may be added
to the Connect GitHub organization by following the RFC process outlined above.
RFCs for new repositories must indicate whether the new repository is an RPC
runtime, whose maintainers will also become maintainers of Connect's
[governance repository][governance-repo].

## Amendments

Any change to Connect's governance must go through the voting process above:
either as a pull request to this document, or as an RFC.

[project]: https://github.com/connectrpc
[cncf-coc]: https://github.com/cncf/foundation/blob/main/code-of-conduct.md
[cncf-charter]: https://github.com/cncf/foundation/blob/main/charter.md
[governance-repo]: https://github.com/connectrpc/connectrpc.com
[governance-contrib]: https://github.com/connectrpc/connectrpc.com/blob/main/.github/CONTRIBUTING.md
