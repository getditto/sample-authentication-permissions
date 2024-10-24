
import 'dart:io';
import 'package:ditto_live/ditto_live.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter/material.dart';

class DittoManager {
  late Ditto ditto;
  StoreObserver? storeObserver;
  late AuthenticationHandler _authHandler;

  // Toggle this value to swith the user status:
  final userID = "123456789";
  final isUserRegistered = true;

  DittoManager() {
    _initialize();
  }

  Future<void> _initialize() async {
    await _setupPermissions();
    await _setupDitto();
  }

  _setupPermissions() async {
    await [
      Permission.bluetoothConnect,
      Permission.bluetoothAdvertise,
      Permission.nearbyWifiDevices,
      Permission.bluetoothScan
    ].request();
  }

  _setupDitto() async {
    //// ⚠️ You can get your own App ID from https://portal.ditto.live
    const appID = "<Your_Ditto_App_ID>";

    await _setupAuthHandler();

    final identity = await OnlineWithAuthenticationIdentity.create(
      appID: appID,
      authenticationHandler: _authHandler,
    );

    final directory = await getApplicationDocumentsDirectory();
    final dittoDirectory = Directory('${directory.path}/ditto');
    if (!dittoDirectory.existsSync()) {
      dittoDirectory.createSync(recursive: true);
    }
    ditto =
        await Ditto.open(identity: identity, persistenceDirectory: directory);
    await ditto.startSync();
  }

  _setupAuthHandler() {
    _authHandler = AuthenticationHandler(
      authenticationRequired: (authenticator) {
        _loginToDitto(authenticator);
      },
      authenticationExpiringSoon: (authenticator, secondsRemaining) {
        _loginToDitto(authenticator);
      },
    );
  }

  _loginToDitto(Authenticator authenticator) async {
    // You can set your own auth webhook and set the URL with your provider name in the Ditto Portal.
    const provider = "auth-provider-01";

    final token = await ExampleIdentity.generateJWT(userID, isUserRegistered);

    await authenticator.login(
      token: token,
      provider: provider,
    );
  }
}

// This is just an example to return identities.
// In your app, please use a real identity provider such as Auth0.
class ExampleIdentity {
  static Future<String> generateJWT(String userID, bool isUserRegistered) async {
    Map<String, dynamic> payload = {
      "sub": userID,
      "userInfo": {
        "registered": isUserRegistered,
      }
    };

    /* In your app, please use a JWT library to encode.
    const jwt = JWT(
      payload: payload,
    )
    */
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkiLCJ1c2VyX2luZm8iOnsicmVnaXN0ZXJlZCI6dHJ1ZX19.sj-6LKjmrdAbKoYB5jFCiq4ZrI73p7wcm-P-YnEnoyI";

    return jwt;
  }
}


void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  final DittoManager dittoManager = DittoManager();

  MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Flutter Demo',
    );
  }
}
