//
//  UserRole.swift
//  PermissionsExample
//
//  Created by Shunsuke Kondo on 2023/05/11.
//

import Foundation

enum UserRole: String {
    case customer, manager, employee

    var readPermission: Bool {
        return true
    }

    var writePermission: Bool {
        switch self {
        case .customer: return true
        case .manager: return true
        case .employee: return false
        }
    }
}
