#pragma once
#ifndef SERVER_DATA_H
#define SERVER_DATA_H

#include <iostream>
#include <map>
#include <string>

// === Log file configuration ===
constexpr const char* ACCESS_LOG_FILENAME = "access.log";

// === Response Time Analysis ===
constexpr double INITIAL_MAX_RESPONSE_TIME = 1e9;
constexpr double INITIAL_MIN_RESPONSE_TIME = -1.0;
constexpr double RESPONSE_TIME_THRESHOLD = 0.000001;  // Ignore near-zero values

// === Status Code Ranges ===
constexpr int STATUS_CODE_SUCCESS_START = 200;
constexpr int STATUS_CODE_SUCCESS_END = 299;

constexpr int STATUS_CODE_REDIRECT_START = 300;
constexpr int STATUS_CODE_REDIRECT_END = 399;

constexpr int STATUS_CODE_CLIENT_ERROR_START = 400;
constexpr int STATUS_CODE_CLIENT_ERROR_END = 499;

constexpr int STATUS_CODE_SERVER_ERROR_START = 500;
constexpr int STATUS_CODE_SERVER_ERROR_END = 599;

// === Default Port & Server Info ===
constexpr int DEFAULT_HTTP_PORT = 80;
constexpr int DEFAULT_HTTPS_PORT = 443;
constexpr const char* DEFAULT_SERVER_NAME = "LocalDevServer";

// === Development Toggles ===
constexpr bool ENABLE_DEBUG_LOGGING = true;
constexpr bool SHOW_TIMESTAMP_ANALYSIS = true;

// === Thresholds ===
constexpr double SLOW_REQUEST_THRESHOLD = 1.0; // seconds
constexpr int MAX_LOG_LINES_TO_READ = 10000;  // 0 = read all

// === File Output Options ===
constexpr const char* REPORT_OUTPUT_FILENAME = "log_report.txt";
constexpr bool WRITE_SUMMARY_TO_FILE = false;

// === Color Codes (optional for terminal output) ===
constexpr const char* COLOR_RESET  = "\033[0m";
constexpr const char* COLOR_RED    = "\033[31m";
constexpr const char* COLOR_GREEN  = "\033[32m";
constexpr const char* COLOR_YELLOW = "\033[33m";
constexpr const char* COLOR_BLUE   = "\033[34m";

// === Globals ===
inline double totalResponseTime = 0.0;
inline double minResponseTime = INITIAL_MIN_RESPONSE_TIME;
inline double maxResponseTime = INITIAL_MAX_RESPONSE_TIME;
inline int totalRequests = 0;
inline int slowRequests = 0;

inline int count2xx = 0, count3xx = 0, count4xx = 0, count5xx = 0;

inline std::string line;
inline int lineCount = 0;

inline std::map<int, int> clientErrorCodes;
inline std::map<int, int> serverErrorCodes;

#endif // SERVER_DATA_H
