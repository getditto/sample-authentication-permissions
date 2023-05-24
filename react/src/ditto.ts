import { Ditto, IdentityOfflinePlayground } from '@dittolive/ditto'

let ditto: Ditto
export default function get() {
  if (!ditto) {
    const identity: IdentityOfflinePlayground = {
      type: 'offlinePlayground',
      appID: "dql-demo"
    }
    ditto = new Ditto(identity, '/ditto')
    ditto.startSync()
    ditto.setOfflineOnlyLicenseToken("o2d1c2VyX2lka0NoaWNrLWZpbC1BZmV4cGlyeXgYMjAyMy0wNC0wOVQwNjo1OTo1OS45OTlaaXNpZ25hdHVyZXhYUmg1TUVSZE12TWxhYWZkNkp4T2VPZFE5cXBleXh2a1FLQlhXZlIrcXQvRXBtOUFqOUwvRGRxOFEvcmdEelB4anRndXJwL2lyandsaDlic3A3T1JMZVE9PQ==")
  }
  return ditto
}
