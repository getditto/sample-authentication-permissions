//
//  PermissionsExampleApp.swift
//  PermissionsExample
//
//  Created by Shunsuke Kondo on 2023/05/04.
//

import SwiftUI

@main
struct PermissionsExampleApp: App {
    private let dittoManager = DittoManager.shared

    var body: some Scene {
        WindowGroup {
            LoginView()
        }
    }
}
