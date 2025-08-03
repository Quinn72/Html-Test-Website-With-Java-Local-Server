#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <iomanip>
#include <limits>

#include "Server_data.h"

int main() {
    std::ifstream logFile(ACCESS_LOG_FILENAME);
    if (!logFile.is_open()) {
        std::cerr << COLOR_RED << "Error: Cannot open " << ACCESS_LOG_FILENAME << COLOR_RESET << "\n";
        return 1;
    }

    while (std::getline(logFile, line)) {
        if (MAX_LOG_LINES_TO_READ > 0 && lineCount >= MAX_LOG_LINES_TO_READ) break;
        lineCount++;

        std::istringstream iss(line);
        std::string timestamp, method, path, statusStr, dash1, dash2, responseTimeStr, msStr, ip;

        iss >> timestamp >> method >> path >> statusStr >> dash1 >> dash2 >> responseTimeStr >> msStr >> ip;
        if (iss.fail()) {
            if (ENABLE_DEBUG_LOGGING) {
                std::cerr << COLOR_YELLOW << "Skipping malformed line: " << line << COLOR_RESET << "\n";
            }
            continue;
        }

        int statusCode;
        double responseTime;
        try {
            statusCode = std::stoi(statusStr);
            responseTime = std::stod(responseTimeStr);
        } catch (...) {
            if (ENABLE_DEBUG_LOGGING) {
                std::cerr << COLOR_YELLOW << "Skipping malformed values: " << line << COLOR_RESET << "\n";
            }
            continue;
        }

        if (responseTime < RESPONSE_TIME_THRESHOLD) continue;

        totalRequests++;
        totalResponseTime += responseTime;
        if (responseTime > maxResponseTime) maxResponseTime = responseTime;
        if (responseTime < minResponseTime || minResponseTime < 0.0) minResponseTime = responseTime;
        if (responseTime >= SLOW_REQUEST_THRESHOLD) slowRequests++;

        if (statusCode >= STATUS_CODE_SUCCESS_START && statusCode <= STATUS_CODE_SUCCESS_END) {
            count2xx++;
        } else if (statusCode >= STATUS_CODE_REDIRECT_START && statusCode <= STATUS_CODE_REDIRECT_END) {
            count3xx++;
        } else if (statusCode >= STATUS_CODE_CLIENT_ERROR_START && statusCode <= STATUS_CODE_CLIENT_ERROR_END) {
            count4xx++;
            clientErrorCodes[statusCode]++;
        } else if (statusCode >= STATUS_CODE_SERVER_ERROR_START && statusCode <= STATUS_CODE_SERVER_ERROR_END) {
            count5xx++;
            serverErrorCodes[statusCode]++;
        }
    }

    logFile.close();

    if (totalRequests == 0) {
        std::cout << COLOR_RED << "No valid requests found.\n" << COLOR_RESET;
        return 0;
    }

    double avgResponseTime = totalResponseTime / totalRequests;

    std::cout << COLOR_BLUE << "\n==== Server Log Summary ====\n" << COLOR_RESET;
    std::cout << "Total requests:     " << totalRequests << "\n";
    std::cout << "Average time:       " << std::fixed << std::setprecision(4) << avgResponseTime << "s\n";
    std::cout << "Minimum time:       " << minResponseTime << "s\n";
    std::cout << "Maximum time:       " << maxResponseTime << "s\n";
    std::cout << "Slow requests (>" << SLOW_REQUEST_THRESHOLD << "s): " << slowRequests << "\n\n";

    std::cout << "Status Code Summary:\n";
    std::cout << "  2xx (Success):    " << count2xx << "\n";
    std::cout << "  3xx (Redirects):  " << count3xx << "\n";
    std::cout << "  4xx (Client Err): " << count4xx << "\n";
    std::cout << "  5xx (Server Err): " << count5xx << "\n";

    if (!clientErrorCodes.empty()) {
        std::cout << "\nDetailed 4xx Errors:\n";
        for (const auto& [code, count] : clientErrorCodes) {
            std::cout << "  " << code << ": " << count << "\n";
        }
    }

    if (!serverErrorCodes.empty()) {
        std::cout << "\nDetailed 5xx Errors:\n";
        for (const auto& [code, count] : serverErrorCodes) {
            std::cout << "  " << code << ": " << count << "\n";
        }
    }

    if (WRITE_SUMMARY_TO_FILE) {
        std::ofstream out(REPORT_OUTPUT_FILENAME);
        out << "=== Server Log Report ===\n";
        out << "Total requests:     " << totalRequests << "\n";
        out << "Average time:       " << avgResponseTime << "s\n";
        out << "Minimum time:       " << minResponseTime << "s\n";
        out << "Maximum time:       " << maxResponseTime << "s\n";
        out << "Slow requests:      " << slowRequests << "\n";
        out << "\nStatus Code Summary:\n";
        out << "  2xx: " << count2xx << "\n";
        out << "  3xx: " << count3xx << "\n";
        out << "  4xx: " << count4xx << "\n";
        out << "  5xx: " << count5xx << "\n";

        if (!clientErrorCodes.empty()) {
            out << "\nDetailed 4xx Errors:\n";
            for (const auto& [code, count] : clientErrorCodes) {
                out << "  " << code << ": " << count << "\n";
            }
        }

        if (!serverErrorCodes.empty()) {
            out << "\nDetailed 5xx Errors:\n";
            for (const auto& [code, count] : serverErrorCodes) {
                out << "  " << code << ": " << count << "\n";
            }
        }

        out.close();
    }

    return 0;
}
