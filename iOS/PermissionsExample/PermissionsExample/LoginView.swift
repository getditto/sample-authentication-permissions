//
//  LoginView.swift
//  PermissionsExample
//
//  Created by Shunsuke Kondo on 2023/05/04.
//

import SwiftUI

struct LoginView: View {

    @State private var userRole: UserRole? = nil
    @State private var pushToMain = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 32) {

                HStack {
                    Text("Role:")

                    Menu(userRole?.rawValue.capitalized ?? "Pick a role") {
                        Button("Customer") {
                            userRole = .customer
                        }
                        Button("Manager") {
                            userRole = .manager
                        }
                        Button("Employee") {
                            userRole = .employee
                        }
                    }
                }

                Button("Login") {
                    login()
                }
                .buttonStyle(.borderedProminent)
            }

            // MARK: Navigation
            .navigationDestination(isPresented: $pushToMain) {
                if let userRole = userRole {
                    MainView(role: userRole)
                }
            }
        }
    }
}


// MARK: Private access methods

extension LoginView {

    private func login() {
        guard let userRole = userRole else { return }

        AuthStub.login(userRole: userRole) { token in
             DittoManager.shared.startDitto(loginToken: token)

            pushToMain = true
        }
    }

}
