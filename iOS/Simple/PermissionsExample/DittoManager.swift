//
//  DittoManager.swift
//  PermissionsExample
//
//  Created by Shunsuke Kondo on 2023/05/04.
//

import Foundation
import DittoSwift
import Combine

// Please find the example auth webhook serverside code here: https://replit.com/@tester28/DittoPermissionsExample#index.js

final class DittoManager: ObservableObject {
    static let shared = DittoManager()

    private var ditto: Ditto? = nil

    private let dittoAppID = "7d6a558c-b30f-4860-8068-3e8eae29b0d4"
    private let authDelegate = AuthDelegate()

    private let collectionName = "docs"
    private let doc001ID = "doc001"
    private let customer01ID = "customer01"
    private lazy var docUserID = ["userID": customer01ID]

    private var subscription: DittoSubscription? = nil
    private var liveQuery: DittoLiveQuery? = nil

    @Published private(set) var doc001Text = ""

    private init() {
        DittoLogger.minimumLogLevel = .debug
    }

    func startDitto(loginToken: String) {
        authDelegate.loginToken = loginToken

        if let ditto = ditto, ditto.isSyncActive {
            authDelegate.logout(ditto: ditto)
            self.ditto = nil
        }

        let identity: DittoIdentity = .onlineWithAuthentication(appID: dittoAppID, authenticationDelegate: authDelegate)

        do {
            ditto = Ditto(identity: identity)
            try ditto!.startSync()
        } catch {
            assertionFailure(error.localizedDescription)
        }

        insertDoc()
        observeDoc()
    }

    func evictAll() {
        guard let ditto = ditto else { return }

        ditto.store.collectionNames().forEach {
            ditto.store.collection($0).findAll().evict()
        }
    }

    private func observeDoc() {
        guard let ditto = ditto else { return }

        let query = ditto.store[collectionName].findByID(docUserID)

        subscription = query.subscribe()

        liveQuery = query.observeLocal { [weak self] doc, _ in
            self?.doc001Text = doc?["text"].string ?? ""
        }
    }

    func insertDoc() {
        guard let ditto = ditto else { assertionFailure(); return }

        let doc: [String: Any?] = [
            "_id": docUserID,
            "text": "",
        ]

        do {
            try ditto.store[collectionName].upsert(
                doc,
                writeStrategy: .insertIfAbsent
            )
        } catch {
            print("Upsert error: \(error.localizedDescription)")
        }

    }

    func updateDoc(_ text: String) {
        guard let ditto = ditto else { assertionFailure(); return }

        ditto.store[collectionName].findByID(docUserID).update { doc in
            doc?["text"].set(text)
        }
    }
}


// MARK: - AuthDelegate

final class AuthDelegate: DittoAuthenticationDelegate {

    var loginToken: String? = nil
    private let loginProvider = "replit-auth" // This needs to setup in https://portal.ditto.live


    func authenticationRequired(authenticator: DittoAuthenticator) {
        login(authenticator)
    }

    func authenticationExpiringSoon(authenticator: DittoAuthenticator, secondsRemaining: Int64) {
        login(authenticator)
    }

    private func login(_ authenticator: DittoAuthenticator) {
        guard let loginToken = loginToken else { assertionFailure(); return }

        authenticator.loginWithToken(loginToken, provider: loginProvider)  { error in
            if let error = error {
                print("Login request failed. Error: \(error.localizedDescription))")
            } else {
                print("Login request succeeded. UserID: \(String(describing: authenticator.status.userID))")
            }
        }
    }

    fileprivate func logout(ditto: Ditto) {
        // This will stop sync, shut down all replication sessions, and remove any cached authentication credentials.
        ditto.auth?.logout() { _ in

            // This will evict local data after logout
            DittoManager.shared.evictAll()
        }
    }
}
