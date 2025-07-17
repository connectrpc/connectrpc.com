---
title: Security
sidebar_position: 20
---

This document outlines Connect's CVE (Common Vulnerabilities and Exposure)
process. We want this process to encourage responsible disclosure of
vulnerabilities, quick responses from project maintainers, and clear
communication with Connect users. In designing this process, we drew from
industry-standard CVE policies used by projects like Envoy and Kubernetes.

## Disclosures

### Private disclosures

Please disclose all suspected vulnerabilities privately and responsibly by
emailing the security@connectrpc.com list with all available details. We use
the same private list for all languages, so emails should include the impacted
language and any relevant platform information.

Please _do_ report a vulnerability if:
* You've discovered a potential security vulnerability in Connect.
* You're unsure how a vulnerability affects Connect.
* You've discovered a potential vulnerability in one of Connect's dependencies.

Please _don't_ report a vulnerability if:
* You need help applying security-related updates.
* You need helping tuning Connect security.
* You need help with something unrelated to security.

We commit to acknowledging and analyzing reports within 5 working days. Unless
we must work with another project to ship a fix, any vulnerability information
shared stays within the Connect project. We also commit to keeping the reporter
updated as reports move from triage, to an identified fix, to release planning.

Once a mitigation is available to users, we prefer to fully disclose the
vulnerability as soon as possible. Within reason, we work with the reporter to
set a mutually-agreeable disclosure date. We may delay when we don't yet
understand the vulnerability or fix fully, we haven't tested the fix
thoroughly, or we need time to coordinate with vendors. Most vulnerabilities
are disclosed in less than a month.

### Public disclosures

If you're aware of a publicly disclosed vulnerability, please email
security@connectrpc.com _immediately_ so that we can accelerate our typical
response process.

## Initial response

For each reported vulnerability, a Connect maintainer volunteers to coordinate
our response.

* The response coordinator makes a preliminary decision as to whether the
  report identifies a vulnerability. This may require asking the reporter for
  additional information.
* If the report may identify a vulnerability, the response coordinator selects
  relevant maintainers and includes them on the email thread for further
  triage. Typically, this happens within a day of the initial report.
* The response coordinator and selected maintainers work together to reproduce
  the report and make a final decision as to whether it identifies a
  vulnerability.
* If the report identifies a vulnerability, the response coordinator, selected
  maintainers, and other contributors (as appropriate) develop a fix.

## Fix development

At this stage, development occurs in a private fork, but fixes are still code
reviewed and thoroughly tested. Once a fix is prepared in private:

* The response coordinator and selected maintainers create a
  [CVSS](https://www.first.org/cvss/specification-document) using the [CVSS
  Calculator](https://www.first.org/cvss/calculator/3.0). They also
  determine the effect and severity of the vulnerability. The response
  coordinator makes the final call on the calculated risk, prioritizing rapid
  progress over perfect assessment.
* The response coordinator requests a [CVE from
  MITRE](https://cveform.mitre.org/) and includes the CVSS and release details.
* The response coordinator and selected maintainers then open a public pull
  request, review the fix again, and merge it to the main branch. The fix is
  also backported to any other supported branches.
* If the CVSS score is under 4.0 ([a low severity
  score](https://www.first.org/cvss/specification-document#i5)) or the assessed
  risk is low, the release coordinator may opt to slow the release process down
  in the face of holidays, limited maintainer availability, or other
  constraints. Any intentional slowdown is first discussed on the
  security@connectrpc.com list.

## Fix disclosure

During fix development, the response coordinator also drafts release notes for
the Connect community. Once maintainers have publicly committed patches to all
relevant branches, the response coordinator tags new patch releases. The notes
for each release must include the CVE number, severity, impact, the location of
released binaries (if any), and a mitigation guide for affected users.

GitHub release notes (and the associated notification emails) are the primary
method by which security patches are communicated to users. Where possible, the
response coordinator also posts announcements on relevant mailing lists, Slack
channels, and other community hubs.

## Retrospective

Within a week of releasing the fix, the response coordinator organizes a
blameless post-mortem with maintainers and any relevant contributors. Together,
they produce a document outlining the response timeline, the root cause of the
vulnerability, and steps to prevent similar vulnerabilities in the future. The
response coordinator then publishes the retrospective to the Connect project
website and updates the release notes with a link.
