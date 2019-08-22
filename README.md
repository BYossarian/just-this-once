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

Let's consider using just-this-once on the server to allow two-factor auth via a TOTP. The flow is:

- A user/client enables 2FA, so the server generates a secret and sends it to the client.
- The client puts the secret into a client-side TOTP generator such as Google Authenticator.
- Later on, when the client tries to log in or access some protected resource, the server requests a passcode.
- The client gets a passcode from their TOTP generator and sends it to the server.
- The server can then verify the passcode and allow/disallow access to the resource.

Ok, to enable 2FA for the client, let's generate a client-specific secret server-side:

```
const secret = generateSecret(16);  // <- 16 bytes for the secret

sendSecretToClient(secret);
saveSecretToDB(secret);
```

The client puts this secret into their TOTP passcode generator. Then, at some later point when the client requests access to some protected resource, we need to verify the passcode they send:
```
const secret = getFromDB();
const candidatePasscode = getFromClientRequest();

const isPasscodeValid = verifyTOTP(candidatePasscode, secret, Date.now());
```

If `isPasscodeValid` is `false` then the login/request should be rejected. And that's it!

## Usage

Just-this-once exposes 5 functions: `generateHOTP`, `verifyHOTP`, `generateTOTP`, `verifyTOTP`, and `generateSecret`.

### Secrets

`generateHOTP`, `verifyHOTP`, `generateTOTP`, and `verifyTOTP` all require a secret in order to generate/verify passcodes. The secret can be passed in as either a Buffer or an encoded string. The accepted encodings are 'base32', 'urlsafe-base64', 'base64', or 'hex'. The specific encoding used can be specified in the optional options object (see below), and the default is 'base32'.

### Options

`generateHOTP`, `verifyHOTP`, `generateTOTP`, and `verifyTOTP` all accept an optional `options` object. All fields in the options object are optional; and the defaults match those used by most popular implementations including Google Authenticator.


NB: All times passed into the TOTP functions should be numbers expressed in milliseconds.

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

`encoding` - this is the encoding used to decode the secret (if passing the secret as a Buffer, this will be ignored)

`codeLength` - this is the length of the passcode

`hashFunction` - this is the hash function used in the process of generating the passcodes

`startTime` - this is the start time in milliseconds used in TOTP in order to calculate the time-based counter

`timeStep` - this is the time-step in milliseconds used in TOTP in order to calculate the time-based counter

### generateHOTP(secret, counter, options)
### verifyHOTP(candidate, secret, counter, options)

Used to generate/verify a HOTP passcode.

`secret`, `options` - See above

`counter` - A non-negative integer used to generate the passcode. It should be incremented on each request.

`candidate` - A string containing the candidate passcode to be verified.

### generateTOTP(secret, time, options)
### verifyTOTP(candidate, secret, time, options)

Used to generate/verify a TOTP passcode.

`secret`, `options` - See above

`time` - The current time, expressed in milliseconds. (i.e. Unix time, except milliseconds are used rather than seconds)

`candidate` - A string containing the candidate passcode to be verified.

### generateSecret(numBytes, encoding)

Used to generate a cryptographically strong pseudo-random secret. Returns an encoded string.

`numBytes` - the number of bytes used to generate the secret

`encoding` - this is the encoding used to encode the secret. Can be one of 'base32', 'urlsafe-base64', 'base64', or 'hex'.

## TODO

- Use ArrayBuffer in place of Buffer so that this can be used outside of Node. For crypto functions:
https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
- Allow specification of 'time-step leeway' in verifyTOTP. Maybe just a boolean for strict/non-strict (non-strict === +1/-1 timestep)
- Use TypeScript to do input validation
