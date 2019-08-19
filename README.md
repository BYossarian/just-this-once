# just-this-once
A dependency-free HOTP and TOTP implementation that can be used for Two-Factor Auth.

Uses/requires Node v8+.

## HOTP/TOTP 101

HOTP and TOTP are protocols used for generating and verifying one-time passwords. They are often used for 2FA (e.g. Google Authenticator). In both cases, a secret is shared between the server and the client. This secret is then used to generate a passcode client-side which can be independently verified by the server.
HOTP makes use of the secret together with a counter in order to generate the passcode. The counter should be incremented every time that a passcode is generated/verified, and thus prevents replay attacks. However, this leads to issues around keeping the server's counter synced with the client's counter.
TOTP improves on HOTP by replacing the counter with the current time - or, more precisely, the number of time-steps that have passed since some start time - in order to avoid having to keep the counter synced between client and server.

HOTP Spec: https://tools.ietf.org/html/rfc4226

TOTP Spec: https://tools.ietf.org/html/rfc6238

## Example

Let's consider using just-this-once on the server.

First, as part of enabling 2FA for the client, let's generate a secret server-side and share it:

```
const secret = generateSecret(16);

sendSecretToClient(secret);
saveSecretToDB(secret);
```

Then, at some later point when the client logs in, we need to verify the passcode they send:
```
const secret = getFromDB();
const candidatePasscode = getFromClientRequest();

const isPasscodeValid = verifyTOTP(candidatePasscode, secret, Date.now());
```

If `isPasscodeValid` is `false` then the login/request should be rejected. And that's it!

## Usage

Just-this-once exposes 5 functions: `generateHOTP`, `verifyHOTP`, `generateTOTP`, `verifyTOTP`, and `generateSecret`.

## TODO

- Use ArrayBuffer in place of Buffer so that this can be used outside of Node. For crypto functions:
https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
