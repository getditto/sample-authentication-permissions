//
//  AuthStub.swift
//  PermissionsExample
//
//  Created by Shunsuke Kondo on 2023/05/05.
//

import Foundation

// NOTE: This is just an example. Please consider using real authentication like Auth0.

final class AuthStub {

    static func login(userRole: UserRole, token: @escaping (String) -> Void) {
        switch userRole {
        case .customer:
            token("customer01")
        case .manager:
            token("manager01")
        case .employee:
            token("employee01")
        }
    }
}
