#include <fstream>
#include <string>
#include <sstream>
#include <limits>
#include <iomanip>

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
        std::string ip, dash1, user, datetime, request, statusStr;
        double responseTime = 0.0;
        int statusCode = 0;

        // Example log format: 127.0.0.1 - - [time] "GET /path" 200 1234 0.123
        iss >> ip >> dash1 >> user >> datetime;
        std::getline(iss, request, '"'); // skip to opening quote
        std::getline(iss, request, '"'); // actual request
        iss >> statusStr;

        try {
            statusCode = std::stoi(statusStr);
            iss >> std::ws >> responseTime;
        } catch (...) {
            if (ENABLE_DEBUG_LOGGING) {
                std::cerr << COLOR_YELLOW << "Skipping malformed line: " << line << COLOR_RESET << "\n";
            }
            continue;
        }

        if (responseTime < RESPONSE_TIME_THRESHOLD) continue;

        // Track stats
        totalRequests++;
        totalResponseTime += responseTime;
        if (responseTime > maxResponseTime) maxResponseTime = responseTime;
        if (responseTime < minResponseTime) minResponseTime = responseTime;
        if (responseTime >= SLOW_REQUEST_THRESHOLD) slowRequests++;

        // Categorize by status code
        if (statusCode >= STATUS_CODE_SUCCESS_START && statusCode <= STATUS_CODE_SUCCESS_END) count2xx++;
        else if (statusCode >= STATUS_CODE_REDIRECT_START && statusCode <= STATUS_CODE_REDIRECT_END) count3xx++;
        else if (statusCode >= STATUS_CODE_CLIENT_ERROR_START && statusCode <= STATUS_CODE_CLIENT_ERROR_END) count4xx++;
        else if (statusCode >= STATUS_CODE_SERVER_ERROR_START && statusCode <= STATUS_CODE_SERVER_ERROR_END) count5xx++;
    }

    logFile.close();

    if (totalRequests == 0) 
    {
        std::cout << COLOR_RED << "No valid requests found.\n" << COLOR_RESET;
    }

    double avgResponseTime = totalResponseTime / totalRequests;

    // Output
    std::cout << COLOR_BLUE << "\n==== Server Log Summary ====\n" << COLOR_RESET;
    std::cout << "Total requests:     " << totalRequests << "\n";
    std::cout << "Average time:       " << std::fixed << std::setprecision(4) << avgResponseTime << "s\n";
    std::cout << "Minimum time:       " << minResponseTime << "s\n";
    std::cout << "Maximum time:       " << maxResponseTime << "s\n";
    std::cout << "Slow requests (>" << SLOW_REQUEST_THRESHOLD << "s): " << slowRequests << "\n";

    std::cout << "\nStatus Code Summary:\n";
    std::cout << "  2xx (Success):    " << count2xx << "\n";
    std::cout << "  3xx (Redirects):  " << count3xx << "\n";
    std::cout << "  4xx (Client Err): " << count4xx << "\n";
    std::cout << "  5xx (Server Err): " << count5xx << "\n";

    if (WRITE_SUMMARY_TO_FILE) {
        std::ofstream out(REPORT_OUTPUT_FILENAME);
        out << "=== Server Log Report ===\n";
        out << "Total requests:     " << totalRequests << "\n";
        out << "Average time:       " << avgResponseTime << "s\n";
        out << "Minimum time:       " << minResponseTime << "s\n";
        out << "Maximum time:       " << maxResponseTime << "s\n";
        out << "Slow requests:      " << slowRequests << "\n";
        out << "2xx: " << count2xx << ", 3xx: " << count3xx << ", 4xx: " << count4xx << ", 5xx: " << count5xx << "\n";
        out.close();
    }

    return 0;
}
