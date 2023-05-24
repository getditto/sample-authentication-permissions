//
//  CustomerView.swift
//  PermissionsExample
//
//  Created by Shunsuke Kondo on 2023/05/08.
//

import SwiftUI
import Combine

struct DocPage: View {
    @Environment(\.presentationMode) var presentationMode

    private let role: UserRole

    @State private var text: String
    @State private var showAlert = false

    private var cancellables = Set<AnyCancellable>()

    init(role: UserRole) {
        self.role = role
        self._text = State(initialValue: DittoManager.shared.doc001Text)
    }

    var body: some View {
        VStack {
            VStack(alignment: .leading) {
                Text("• Read Permission: \(String(describing: role.readPermission))")
                    .foregroundColor(role.readPermission ? .black : .red)
                Text("• Write Permmision: \(String(describing: role.writePermission))")
                    .foregroundColor(role.writePermission ? .black : .red)
            }
            .frame(maxWidth: .infinity, alignment: .topLeading)
            .padding(16)

            VStack {
                TextField("Text", text: $text)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding()

                Button("Save") {
                    save()
                }
                .buttonStyle(.borderedProminent)
            }

            Spacer()
        }
        .alert("No write permission!", isPresented: $showAlert) {
            Button("OK") {
                showAlert = false
            }
        }
        .onAppear {
            text = DittoManager.shared.doc001Text
        }
    }

    private func save() {
        if role.writePermission {
            DittoManager.shared.updateDoc(text)

            presentationMode.wrappedValue.dismiss()
        } else {
            showAlert = true
        }
    }
}
