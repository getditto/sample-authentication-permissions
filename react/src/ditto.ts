import { Ditto, IdentityOnlinePlayground } from '@dittolive/ditto'

let ditto: Ditto
export default function get() {
  if (!ditto) {
    const identity: IdentityOnlinePlayground = {
      type: 'onlinePlayground',
      appID: "REPLACE_WITH_YOUR_APP_ID",
      token: "REPLACE_WITH_YOUR_TOKEN"
    }
    ditto = new Ditto(identity, '/ditto')
    ditto.startSync()
  }
  return ditto
}
