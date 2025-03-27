#include "Ditto.h"

#include <chrono>
#include <cstdlib>
#include <exception>
#include <filesystem>
#include <iostream>
#include <stdexcept>
#include <string>
#include <thread>

#include "CLI11.hpp" // command-line options parser

// Values specified by command-line options
struct CliOptions {
  std::string app_id;
  std::string persistence_dir = "/tmp/ditto/dittocpppauth";
  std::string log_level = "error";
  std::string export_logs_path;
  std::string device_name = "dittocppauth";
} cli_options;

// Convert string to LogLevel
ditto::LogLevel to_log_level(const std::string &level) {
  if (level == "error")
    return ditto::LogLevel::error;
  if (level == "warning")
    return ditto::LogLevel::warning;
  if (level == "info")
    return ditto::LogLevel::info;
  if (level == "debug")
    return ditto::LogLevel::debug;
  if (level == "verbose")
    return ditto::LogLevel::verbose;

  throw std::runtime_error("valid log levels are 'error', 'warning', 'info', "
                           "'debug', and 'verbose'");
}

// OfflinePlayground
void offline_playground_auth(const std::string &offline_only_license_token) {
  ditto::Log::set_minimum_log_level(to_log_level(cli_options.log_level));
  ditto::Log::set_logging_enabled(true);

  // Note: OfflinePlayground allows an optional `site_id` parameter, but it is
  // deprecated.
  auto identity = ditto::Identity::OfflinePlayground(cli_options.app_id);

  auto ditto = ditto::Ditto(identity, cli_options.persistence_dir);
  ditto.set_device_name(cli_options.device_name);
  ditto.disable_sync_with_v3();
  std::cerr
      << "info: Ditto instance initialized with offline-playground identity"
      << std::endl;

  if (!offline_only_license_token.empty()) {
    ditto.set_offline_only_license_token(offline_only_license_token);
    ditto.start_sync();
    std::cerr << "info: sync started" << std::endl;
  } else {
    std::cerr
        << "warning: cannot sync because no offline-only license token was "
           "provided"
        << std::endl;
  }

  // Let Ditto perform syncing activities in the background for a few seconds.
  std::this_thread::sleep_for(std::chrono::seconds(5));

  std::cerr << "info: cleaning up" << std::endl;
}

// OnlinePlayground
void online_playground_auth(const std::string &token, bool cloud_sync,
                            const std::string &custom_auth_url) {
  ditto::Log::set_minimum_log_level(to_log_level(cli_options.log_level));
  ditto::Log::set_logging_enabled(true);

  auto identity = ditto::Identity::OnlinePlayground(
      cli_options.app_id, token, cloud_sync, custom_auth_url);

  auto ditto = ditto::Ditto(identity, cli_options.persistence_dir);
  ditto.set_device_name(cli_options.device_name);
  ditto.disable_sync_with_v3();
  std::cerr
      << "info: Ditto instance initialized with online-playground identity"
      << std::endl;

  ditto.start_sync();
  std::cerr << "info: sync started" << std::endl;

  // Let Ditto perform syncing activities in the background for a few seconds.
  std::this_thread::sleep_for(std::chrono::seconds(5));

  std::cerr << "info: stopping sync and cleaning up" << std::endl;
  ditto.stop_sync();
}

// Concrete implementation of the abstract `ditto::AuthenticationCallback`
// class, used in `online_with_authentication_auth()`.
class AuthCallback : public ditto::AuthenticationCallback {
private:
  std::string provider;
  std::string token;
  std::string username;
  std::string password;

public:
  AuthCallback(std::string token, std::string provider, std::string username,
               std::string password)
      : provider(std::move(provider)), token(std::move(token)),
        username(std::move(username)), password(std::move(password)) {}

  void authentication_required(
      std::shared_ptr<ditto::Authenticator> authenticator) override {
    try {
      std::cerr << "info: authentication_required callback" << std::endl;
      if (!token.empty()) {
        // TODO: For SDK 4.11 and newer, can use `login()` instead
        authenticator->login_with_token(
            token, provider, [](std::unique_ptr<ditto::DittoError> error) {
              if (error) {
                std::cerr << "error: login_with_token: " << error->what()
                          << std::endl;
              }
            });
      } else if (!username.empty()) {
        authenticator->login_with_credentials(
            username, password, provider,
            [](std::unique_ptr<ditto::DittoError> error) {
              if (error) {
                std::cerr << "error: login_with_credentials: " << error->what()
                          << std::endl;
              }
            });
      }
    } catch (const std::exception &e) {
      std::cerr << "error: authentication_required: " << e.what() << std::endl;
    }
  }

  void authentication_expiring_soon(
      std::shared_ptr<ditto::Authenticator> authenticator,
      std::int64_t seconds_remaining) override {
    std::cerr << "info: authentication_expiring_soon callback" << std::endl;
  }

  void authentication_status_did_change(
      std::shared_ptr<ditto::Authenticator> authenticator) override {
    try {
      auto status = authenticator->get_status();
      std::cerr << "info: authentication_status_did_change; is_authenticated="
                << status.is_authenticated()
                << "; user_id=" << status.get_user_id() << std::endl;
    } catch (const std::exception &e) {
      std::cerr << "error: authentication_status_did_change: " << e.what()
                << std::endl;
    }
  }
};

// OnlineWithAuthentication
void online_with_authentication_auth(const std::string &provider,
                                     const std::string &token,
                                     const std::string &username,
                                     const std::string &password,
                                     bool cloud_sync,
                                     const std::string &custom_auth_url) {
  ditto::Log::set_minimum_log_level(to_log_level(cli_options.log_level));
  ditto::Log::set_logging_enabled(true);

  auto auth_callback = std::shared_ptr<ditto::AuthenticationCallback>(
      new AuthCallback(provider, token, username, password));
  auto identity = ditto::Identity::OnlineWithAuthentication(
      cli_options.app_id, auth_callback, cloud_sync, custom_auth_url);

  auto ditto = ditto::Ditto(identity, cli_options.persistence_dir);
  ditto.set_device_name(cli_options.device_name);
  ditto.disable_sync_with_v3();
  std::cerr << "info: Ditto instance initialized with online-with- identity"
            << std::endl;

  ditto.start_sync();
  std::cerr << "info: sync started" << std::endl;

  // Let Ditto perform syncing activities in the background for a few seconds.
  std::this_thread::sleep_for(std::chrono::seconds(5));

  std::cerr << "info: stopping sync and cleaning up" << std::endl;
  ditto.stop_sync();
}

void export_logs(const std::string &path) {
  try {
    if (std::filesystem::exists(path)) {
      std::filesystem::remove(path);
    }
    ditto::Log::export_to_file(path).get();
    std::cerr << "info: exported log to " << path << std::endl;
  } catch (const std::exception &err) {
    std::cerr << "error: unable to export log dump: " << err.what()
              << std::endl;
  }
}

int main(int argc, const char **argv) {
  try {
    CLI::App app("Ditto C++ SDK Authentication Sample", "dittocppauth");
    app.set_help_all_flag("--help-all", "Expand all help");
    app.option_defaults()
        ->ignore_case()
        ->ignore_underscore()
        ->configurable()
        ->always_capture_default();
    app.get_formatter()->column_width(60);
    app.require_subcommand();

    // Global options
    //
    // These set values of the `cli_options` structure.

    app.add_option("-a,--app-id", cli_options.app_id)
        ->envname("DITTO_APP_ID")
        ->required();

    app.add_option("-p,--persistence-directory", cli_options.persistence_dir)
        ->envname("DITTO_PERSISTENCE_DIR");

    app.add_option("-l,--log-level", cli_options.log_level,
                   "error, warning, info, debug, or verbose")
        ->option_text("LEVEL")
        ->envname("DITTO_LOG_LEVEL");

    app.add_option("--export-logs", cli_options.export_logs_path,
                   "Export collected logs to this path")
        ->option_text("PATH")
        ->envname("DITTO_EXPORT_LOGS_PATH");

    app.add_option("-n,--device-name", cli_options.device_name, "Device name")
        ->envname("DITTO_DEVICE_NAME");

    // Subcommands
    //
    // Each subcommand gets argument values and then calls one of the xxx_auth()
    // functions above.

    auto offline_playground = app.add_subcommand("offline-playground");
    std::string offline_only_license_token;
    offline_playground
        ->add_option("-t,--offline-only-license-token",
                     offline_only_license_token)
        ->envname("DITTO_OFFLINE_ONLY_LICENSE_TOKEN");
    offline_playground->callback(
        [&] { offline_playground_auth(offline_only_license_token); });

    auto online_playground = app.add_subcommand("online-playground");
    std::string online_playground_token;
    online_playground
        ->add_option("-t,--online-playground-token", online_playground_token,
                     "Online playground token")
        ->required()
        ->envname("DITTO_PLAYGROUND_TOKEN");
    bool online_playground_cloud_sync = true;
    online_playground
        ->add_flag("--cloud-sync,!--no-cloud_sync",
                   online_playground_cloud_sync, "Enable Ditto cloud sync")
        ->envname("DITTO_CLOUD_SYNC");
    std::string online_playground_custom_auth_url;
    online_playground
        ->add_option("--custom-auth-url", online_playground_custom_auth_url)
        ->envname("DITTO_CUSTOM_AUTH_URL");
    online_playground->callback([&] {
      online_playground_auth(online_playground_token,
                             online_playground_cloud_sync,
                             online_playground_custom_auth_url);
    });

    auto online_with_authentication =
        app.add_subcommand("online-with-authentication");
    std::string online_with_authentication_provider;
    online_with_authentication->add_option("--provider",
                                           online_with_authentication_provider);
    std::string online_with_authentication_token;
    online_with_authentication
        ->add_option("-t,--online-token", online_with_authentication_token,
                     "Authentication token")
        ->envname("DITTO_ONLINE_TOKEN");
    std::string online_with_authentication_username;
    online_with_authentication
        ->add_option("--username", online_with_authentication_username,
                     "User name")
        ->envname("DITTO_USERNAME");
    std::string online_with_authentication_password;
    online_with_authentication
        ->add_option("--password", online_with_authentication_password,
                     "Password")
        ->envname("DITTO_PASSWORD");
    bool online_with_authentication_cloud_sync = true;
    online_with_authentication
        ->add_flag("--cloud-sync,!--no-cloud_sync",
                   online_with_authentication_cloud_sync,
                   "Enable Ditto cloud sync")
        ->envname("DITTO_CLOUD_SYNC");
    std::string online_with_authentication_custom_auth_url;
    online_with_authentication
        ->add_option("--custom-auth-url",
                     online_with_authentication_custom_auth_url,
                     "Custom authentication URL")
        ->envname("DITTO_CUSTOM_AUTH_URL");
    online_with_authentication->callback([&] {
      online_with_authentication_auth(
          online_with_authentication_provider, online_with_authentication_token,
          online_with_authentication_username,
          online_with_authentication_password,
          online_with_authentication_cloud_sync,
          online_with_authentication_custom_auth_url);
    });

    CLI11_PARSE(app, argc, argv);

    if (!cli_options.export_logs_path.empty()) {
      export_logs(cli_options.export_logs_path);
    }
  } catch (const std::exception &e) {
    std::cerr << "error: " << e.what() << std::endl;
    if (!cli_options.export_logs_path.empty()) {
      export_logs(cli_options.export_logs_path);
    }
    std::exit(EXIT_FAILURE);
  }

  return 0;
}
