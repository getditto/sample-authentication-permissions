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

void online_playground_authentication(const std::string &token, bool cloud_sync,
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

  std::this_thread::sleep_for(std::chrono::seconds(5));

  std::cerr << "info: stopping sync and cleaning up" << std::endl;
  ditto.stop_sync();
}

void offline_playground_authentication(
    const std::string &offline_only_license_token) {
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

  std::this_thread::sleep_for(std::chrono::seconds(5));

  std::cerr << "info: cleaning up" << std::endl;
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

    auto online_playground = app.add_subcommand("online-playground");
    std::string online_playground_token;
    online_playground
        ->add_option("-t,--online-playground-token", online_playground_token,
                     "Online playground token")
        ->required()
        ->envname("DITTO_PLAYGROUND_TOKEN");
    bool online_playground_cloud_sync = true;
    online_playground->add_flag("--cloud-sync,!--no-cloud_sync",
                                online_playground_cloud_sync,
                                "Enable Ditto cloud sync");
    std::string online_playground_custom_auth_url;
    online_playground
        ->add_option("--custom-auth-url", online_playground_custom_auth_url)
        ->envname("DITTO_CUSTOM_AUTH_URL");

    online_playground->callback([&] {
      online_playground_authentication(online_playground_token,
                                       online_playground_cloud_sync,
                                       online_playground_custom_auth_url);
    });

    std::string offline_only_license_token;
    auto offline_playground = app.add_subcommand("offline-playground");
    offline_playground
        ->add_option("-t,--offline-only-license-token",
                     offline_only_license_token)
        ->envname("DITTO_OFFLINE_ONLY_LICENSE_TOKEN");
    offline_playground->callback(
        [&] { offline_playground_authentication(offline_only_license_token); });

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
