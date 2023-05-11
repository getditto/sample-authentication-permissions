//
//  MainView.swift
//  PermissionsExample
//
//  Created by Shunsuke Kondo on 2023/05/08.
//

import SwiftUI

struct MainView: View {

    private let role: UserRole

    init(role: UserRole) {
        self.role = role
    }

    var body: some View {

        Text("Role: \(role.rawValue.capitalized)")


        List {
            NavigationLink("Doc") {
                DocPage(role: role)
            }
        }
    }

    
}
