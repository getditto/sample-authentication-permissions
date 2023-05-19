# Authentication and Permissions

Here you will find examples for how to implement authentication and permissions for Ditto, a peer-to-peer database.


 <img align="left" src="Ditto_logo.png" alt="Ditto Logo" width="150">  
 <br />  
 <br />  
 <br />  

 ## Authentication
 
Ditto does not come with an identity provider. Using "Online With Authentication" requires that you have your own identity provider already set up. Each app can use multiple identity providers.

The "Online With Authentication" identity type is geared towards apps that will be deployed in real world settings.

[For more information, read the documentation](https://docs.ditto.live/ios/common/security/authentication)

## What is in this repository

* [iOS](./iOS/Simple/): Various examples for using authentication on the iOS platform. 
* [iOS-Auth0](./iOS/iOS-auth0/): A more advanced example for integrating iOS with Auth0, the popular platform for third-party authentication. 
* [server](./server/): Examples for deploying your webhook with server-side authentication.

## License

MIT
