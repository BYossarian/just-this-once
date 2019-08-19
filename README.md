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

The client can then put this secret into a TOTP passcode generator like Google Authenticator in order to generate passcodes whenever requested.
Then, at some later point when the client logs in, we need to verify the passcode they send:
```
const secret = getFromDB();
const candidatePasscode = getFromClientRequest();

const isPasscodeValid = verifyTOTP(candidatePasscode, secret, Date.now());
```

If `isPasscodeValid` is `false` then the login/request should be rejected. And that's it!

## Usage

Just-this-once exposes 5 functions: `generateHOTP`, `verifyHOTP`, `generateTOTP`, `verifyTOTP`, and `generateSecret`.

### Options

`generateHOTP`, `verifyHOTP`, `generateTOTP`, and `verifyTOTP` all accept an optional `options` object as described below. All fields in the options object are optional; and the defaults match those used by most popular implementations including Google Authenticator.

```
{
    encoding: <string - one of 'base32', 'urlsafe-base64', 'base64', 'hex'; default: 'base32'>,
    codeLength: <positive integer; default: 6>,
    // these are only used for TOTP:
    hashFunction: <string - one of 'sha1', 'sha256', 'sha512'; default: 'sha1'>,
    startTime: <positive integer; default: 0>,
    timeStep: <positive integer; default: 30000>
}
```

`encoding` - this is the encoding used to encode the secret into a string

`codeLength` - this is the length of the passcode

`hashFunction` - this is the hash function used in the process of generating the passcodes

`startTime` - this is the start time in milliseconds used in TOTP in order to calculate the time-based counter

`timeStep` - this is the time-step in milliseconds used in TOTP in order to calculate the time-based counter

### generateHOTP(secret, counter, options)

// TODO

### verifyHOTP(candidate, secret, counter, options)

// TODO

### generateTOTP(secret, time, options)

// TODO

### verifyTOTP(candidate, secret, time, options)

// TODO

### generateSecret(numBytes, encoding)

// TODO

## TODO

- Use ArrayBuffer in place of Buffer so that this can be used outside of Node. For crypto functions:
https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
- Allow specification of 'time-step leeway' in verifyTOTP. Maybe just a boolean for strict/non-strict (non-strict === +1/-1 timestep)
