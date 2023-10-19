import { Ditto, IdentityOnlinePlayground } from '@dittolive/ditto'

let ditto: Ditto
export default function get() {
  if (!ditto) {
    const identity: IdentityOnlinePlayground = {
      type: 'onlinePlayground',
      appID: "",
      token: ""
    }
    ditto = new Ditto(identity, '/ditto')
    ditto.startSync()
  }
  return ditto
}
