# Self-Sovereign Blog

The self-sovereign blog is a showcase of "paywall without intermediaries".

This blog is handcrafted by SvelteKit and can be hosted anywhere. Payments for paywall use Bitcoin which is the border-less internet native money, specifically Lightning Network which is the layer2 of Bitcoin and realizes fast finality and micro payments. The proof of payment is shared between buyers and sellers through messaging using the Nostr protocol.

Both Bitcoin and Nostr are the people's networks without specific authorities. So, this paywall is "Self-Sovereignty", with no middlemen involved.

The demo is [here](posts/002_ligtning-nostr/after.webm).

## Overview

![](doc/overview.png)

The front server is responsible for:

1.  delivering blog posts that are markdown-based
2.  unlocking paywalled content
3.  delivering invoices to remove the paywall
4.  setting up to subscribe to encypted messages to share the payment proof
5.  asking payment authentication/authorization related to all of the above to the API server

Payment authentication/authorization for paywall follows the [Lightning HTTP 402 Protocol (L402 protocol)](https://github.com/lightning/blips/pull/26) that repurposes the `HTTP 402 Payment Required` error code and is a standardized way of adding micropayments to any existing HTTP-REST or gRPC API.

The API server coodinates two networks that are Lightning Network for payments and Nostr protocol for messagings, and executes L402 protocol. You can check the [sample implementation](https://github.com/studioTeaTwo/simple-l402-server) for this blog which wraps the L402 API Key proxy called [Aperture](https://github.com/lightninglabs/aperture).

Lightning Network is Bitcoin's layer2 used for payment network. Bitcoin is decentralized internet money, so users can pay from any wallet that supports Lightning Network.

Nostr protocol is a decentralized network similar to Bitcoin, which is used on this blog to share the proof of payment safety and securely without the need for any counterparty. To achieve this, we adopt [NIP-04](https://github.com/nostr-protocol/nips/blob/master/04.md) to exchange direct message encrypted with AES-256-CBC.

## L402 protocol flow

![](doc/challenge-response.sequence.png)

TODO
