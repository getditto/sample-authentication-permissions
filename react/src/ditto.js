import { Ditto } from '@dittolive/ditto'

let ditto
export default function get(token) {
  if (!ditto) {
    const authHandler = {
      authenticationRequired: async function (authenticator) {
        authenticator.loginWithToken(token, 'replit-auth')
      },
      authenticationExpiringSoon: function (authenticator, secondsRemaining) {
        authenticator.loginWithToken(token, 'replit-auth')
      },
    }
    const identity = {
      type: 'onlineWithAuthentication',
      appID: "f0862187-a16f-42c3-848e-48e1bb2d216a",
      authHandler: authHandler
    }
    ditto = new Ditto(identity, '/ditto')
    ditto.startSync()
  }
  return ditto
}
