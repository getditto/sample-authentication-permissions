# Authentication and Permissions

Here you will find examples for how to implement authentication and permissions for Ditto, a peer-to-peer database.

Ditto does not come with an identity provider. Using "Online With Authentication" requires that you have your own identity provider already set up. Each app can use multiple identity providers.

The "Online With Authentication" identity type is geared towards apps that will be deployed in real world settings.

[For more information, read the documentation](https://docs.ditto.live/ios/common/security/authentication)

For support, please contact Ditto Support (support@ditto.live).

## Try it on repl.it

See an authentication example running on a server that handles three different permissions levels.

* https://replit.com/@tester28/DittoPermissionsExample#index.js

## What is in this repository

* [iOS](./iOS/Simple/): Basic example for using authentication on iOS.
* [Flutter](./flutter/): Basic example for using authentication on Flutter.
* [react](./react/): Basic example for authentication on Front-end React
* [cpp](./cpp/): Basic example for authentication on C++
* [iOS-Auth0](./iOS/iOS-auth0/): A more advanced example for integrating iOS with Auth0, the popular platform for third-party authentication.
* [server](./server/): Examples for deploying your webhook with server-side authentication.

## License

MIT
