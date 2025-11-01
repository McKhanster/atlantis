MCP Logging Tutorial: A Comprehensive Implementation Guide
==========================================================

2025-05-31 • Zaheer Ahmad

MCPLoggingJSON-RPCStructured LoggingNode.jsPythonObservabilitymcpevals

* * *

Get the latest on MCP

Introduction
------------

Logging in modern AI-driven systems has evolved beyond debugging to become essential for observability, reliability, and governance. Traditional logging methods often lack the detail required for applications utilizing large language models (LLMs). These advanced systems involve complex interactions, stateful conversations, dynamic prompts, and external integrations, necessitating specialized logging solutions.

The **[Model Context Protocol (MCP)](https://www.mcpevals.io/blog/what-is-the-model-context-protocol-mcp)** addresses these challenges by standardizing structured logging for AI clients (like Claude and Cursor AI) and backend models or tools. This document explains MCP's logging mechanism, outlines its key concepts, and provides practical guidance for implementation.

Table of Contents
-----------------

- [MCP Logging Tutorial: A Comprehensive Implementation Guide](#mcp-logging-tutorial-a-comprehensive-implementation-guide)
  - [Introduction](#introduction)
  - [Table of Contents](#table-of-contents)
  - [Key Concepts and Terminology](#key-concepts-and-terminology)
  - [MCP Logging Overview](#mcp-logging-overview)
    - [Interaction Workflow:](#interaction-workflow)
  - [Implementation Guide](#implementation-guide)
    - [Enabling and Configuring Logging](#enabling-and-configuring-logging)
    - [Log Delivery Mechanism](#log-delivery-mechanism)
  - [Practical Usage Example](#practical-usage-example)
    - [Project Directory Structure](#project-directory-structure)
    - [Install Dependencies](#install-dependencies)
    - [Build the Project](#build-the-project)
    - [Testing with MCP Inspector](#testing-with-mcp-inspector)
  - [Node.js Logging Libraries](#nodejs-logging-libraries)
    - [Pino](#pino)
    - [Winston](#winston)
    - [Bunyan](#bunyan)
  - [Python Logging Libraries](#python-logging-libraries)
    - [Loguru](#loguru)
    - [Structlog](#structlog)
    - [Standard `logging` with JSONFormatter](#standard-logging-with-jsonformatter)
  - [Best Practices](#best-practices)
  - [Conclusion](#conclusion)

Key Concepts and Terminology
----------------------------

Understanding the following key terms and concepts is crucial for implementing MCP logging:

*   **Log Levels**: Standardized severity levels defined by [RFC 5424](https://www.rfc-editor.org/rfc/rfc5424.html) (`debug`, `info`, `notice`, `warning`, `error`, `critical`, `alert`, `emergency`).
*   **Logger Names**: Optional identifiers tagging log messages by subsystem or module.
*   **Capabilities Declaration**: Servers declare logging support using the `logging` capability.
*   **Minimum Log Level**: Clients dynamically set this threshold to control log verbosity.
*   **Structured Data**: JSON-serializable context within logs, providing detailed and actionable information.
*   **Notification Method**: JSON-RPC `notifications/message` method used for asynchronous log delivery.

MCP Logging Overview
--------------------

The Model Context Protocol (MCP) logging uses structured interactions between a client and server, enabling real-time delivery of logs and dynamic control over verbosity.

### Interaction Workflow:

**1\. Configure Logging:**

*   The client initiates logging by sending a `logging/setLevel` request specifying the desired log level (e.g., `info`).
*   The server responds with an empty result, confirming the logging level has been set.

**2\. Server Activity:**

*   After logging is configured, the server begins sending structured log notifications (`notifications/message`) back to the client.
*   Notifications include messages at or above the specified verbosity level, such as `info`, `warning`, and `error`.

**3\. Dynamic Log Level Change:**

*   Clients can adjust verbosity dynamically by issuing another `logging/setLevel` request (e.g., changing from `info` to `error`).
*   The server acknowledges the change with an empty response.
*   Subsequent logs are filtered based on this new level, with the server now only sending logs at the new level (`error`) or higher, excluding less severe messages.

This logging strategy ensures efficient, structured communication tailored to client needs, providing clear, real-time visibility into MCP interactions.

![mcp_logging_architecture](../../public/images/mcp_logging_architecture.png)

Implementation Guide
--------------------

This section provides practical guidance on implementing and using MCP logging effectively.

### Enabling and Configuring Logging

Servers declare logging capability explicitly during the MCP handshake:

    "capabilities": {
      "logging": {}
    }
    

Clients can set log verbosity dynamically via the `logging/setLevel` request:

    {
      "method": "logging/setLevel",
      "params": {"level": "info"}
    }
    

### Log Delivery Mechanism

Logs are delivered using JSON-RPC notifications (`notifications/message`). The log message structure typically includes:

    {
      "level": "error",
      "logger": "router",
      "data": {"error_code": 500, "details": "Internal Server Error"}
    }
    

Supported transport mechanisms include:

*   **Stdio:** Ideal for local setups. Your AI runs the server as a subprocess and communicates through standard input/output.
*   **Server-Sent Events (SSE)**: Suitable for real-time web-based dashboards.
*   **Streamable HTTP/WebSockets**: Effective for authenticated and high-throughput environments.

> **Note:** Avoid logging via STDIO when running MCP servers. Writing logs to STDIO can disrupt the MCP protocol stream, since MCP itself relies on STDIO for structured communication between the client and server. Mixing logs with protocol messages can lead to parsing errors, unexpected disconnections, or even server crashes.

Practical Usage Example
-----------------------

This section walks you through how to set up and run an MCP-compliant server with detailed logging controls. You'll see how to adjust log levels while the server is running, use JSON-RPC requests to talk to the server, and check out how the log output changes based on what you've set.

### Project Directory Structure

Before you get started, make sure your project folder is set up like this:

    .
    ├── package.json
    ├── src
    │   └── main.ts
    └── tsconfig.json
    

This structure ensures a clean, maintainable codebase and aligns with standard TypeScript/Node.js project layouts.

*   `package.json`

    {
      "name": "mcp-sum-server",
      "version": "1.0.0",
      "type": "module",
      "scripts": {
        "build": "tsc",
        "start": "node build/main.js"
      },
      "dependencies": {
        "@modelcontextprotocol/sdk": "^1.12.0",
        "zod": "^3.22.4"
      },
      "devDependencies": {
        "@types/node": "^20.17.32",
        "typescript": "^5.3.3"
      }
    }
    
    

*   `tsconfig.json`

    {
      "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "moduleResolution": "node",
        "strict": true,
        "esModuleInterop": true,
        "outDir": "build"
      },
      "include": ["src"]
    }
    

*   `main.ts`

    // src/main.ts
    import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
    import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
    import { z } from "zod";
    
    // Log levels (lower is more severe)
    const LogLevelMap = {
      emergency: 0,
      alert: 1,
      critical: 2,
      error: 3,
      warning: 4,
      notice: 5,
      info: 6,
      debug: 7,
    } as const;
    
    const validLogLevels = Object.keys(LogLevelMap) as (keyof typeof LogLevelMap)[];
    
    type McpLogLevel = keyof typeof LogLevelMap;
    type LogLevelValue = typeof LogLevelMap[McpLogLevel];
    
    // Define the request schema for setLevels
    const SetLevelsRequestSchema = z.object({
      method: z.literal("logging/setLevels"),
      params: z.object({
        levels: z.record(z.string(), z.enum(validLogLevels as [string, ...string[]]).nullable())
      })
    });
    
    // Define the request schema for setLevel
    const SetLevelRequestSchema = z.object({
      method: z.literal("logging/setLevel"),
      params: z.object({
        level: z.enum(validLogLevels as [string, ...string[]])
      })
    });
    
    // Per-logger log levels (default is root `"."`)
    let logLevels: { [loggerName: string]: LogLevelValue } = {
      ".": LogLevelMap.info, // Start with info level
    };
    
    // Helper: Effective log level for a logger
    const getEffectiveLogLevel = (loggerName: string): LogLevelValue => {
      return (loggerName in logLevels)
        ? logLevels[loggerName]
        : logLevels["."] ?? LogLevelMap.info;
    };
    
    // Helper: Should we log at this level?
    const shouldLog = (level: McpLogLevel, loggerName: string): boolean => {
      const numericLevel = LogLevelMap[level];
      const effectiveLevel = getEffectiveLogLevel(loggerName);
      return numericLevel <= effectiveLevel;
    };
    
    // Helper: Actually send a log if allowed
    const log = (level: McpLogLevel, loggerName: string, data: object) => {
      if (!(level in LogLevelMap)) {
        console.error(`Internal Error: Invalid log level used: ${level}`);
        return;
      }
      if (shouldLog(level, loggerName)) {
        server.server.sendLoggingMessage({
          level,
          logger: loggerName,
          data,
        });
      }
    };
    
    // 1. Create and configure the MCP server
    const server = new McpServer(
      {
        name: "SumDivideServer",
        version: "1.0.5",
      },
      {
        capabilities: {
          logging: { 
            setLevels: true,
            levels: validLogLevels
          },
          resources: {},
          tools: {},
        },
      }
    );
    
    // 2. Register handler for logging/setLevels (only override requested loggers)
    server.server.setRequestHandler(
      SetLevelsRequestSchema,
      async (request) => {
        const newLevels = request.params.levels;
        // Only update logLevels for specified keys; unset any set to null
        for (const loggerName in newLevels) {
          if (Object.prototype.hasOwnProperty.call(newLevels, loggerName)) {
            const levelName = newLevels[loggerName];
            if (levelName === null) {
              if (loggerName !== ".") {
                delete logLevels[loggerName]; // Remove override
                log("debug", "logging", { message: `Reset log level for logger: ${loggerName}` });
              }
            } else if (levelName && validLogLevels.includes(levelName as McpLogLevel)) {
              logLevels[loggerName] = LogLevelMap[levelName as McpLogLevel];
              log("debug", "logging", { message: `Set log level for logger '${loggerName}' to '${levelName}'` });
            } else {
              log("warning", "logging", { message: `Invalid log level '${levelName}' received for logger '${loggerName}'` });
            }
          }
        }
        return {};
      }
    );
    
    // Register handler for logging/setLevel (sets root logger level)
    server.server.setRequestHandler(
      SetLevelRequestSchema,
      async (request) => {
        const levelName = request.params.level;
        if (validLogLevels.includes(levelName as McpLogLevel)) {
          logLevels["."] = LogLevelMap[levelName as McpLogLevel];
          log("debug", "logging", { message: `Set root log level to '${levelName}'` });
        } else {
          log("warning", "logging", { message: `Invalid log level '${levelName}' received` });
        }
        return {};
      }
    );
    
    // 3. Register the 'sum' tool
    server.tool(
      "sum",
      { a: z.number(), b: z.number() },
      async ({ a, b }) => {
        log("debug", "sum", { message: "Received input", a, b });
        const result = a + b;
        log("info", "sum", { message: "Sum calculated", result });
        return {
          content: [{ type: "text", text: `Result: ${result}` }],
        };
      }
    );
    
    // 4. Register the 'divide' tool
    server.tool(
      "divide",
      { numerator: z.number(), denominator: z.number() },
      async ({ numerator, denominator }) => {
        log("debug", "divide", { message: "Received input", numerator, denominator });
        if (denominator === 0) {
          log("error", "divide", { message: "Division by zero attempted" });
          return {
            content: [{ type: "text", text: "Error: Division by zero is not allowed." }],
            isError: true,
          };
        }
        const result = numerator / denominator;
        log("info", "divide", { message: "Division performed", result });
        return {
          content: [{ type: "text", text: `Result: ${result}` }],
        };
      }
    );
    
    // 5. Connect via stdio transport
    const transport = new StdioServerTransport();
    let isConnected = false;
    
    // Keep the process running
    process.stdin.resume();
    
    server.connect(transport).then(() => {
      isConnected = true;
      // Only log connection message if current level allows it
      if (shouldLog("info", "main")) {
        log("info", "main", { message: "Server connected via stdio" });
      }
    }).catch(error => {
      console.error("Failed to connect server:", error);
      process.exit(1);
    });
    
    // Handle stdin end
    process.stdin.on('end', () => {
      if (isConnected) {
        log("debug", "main", { message: "Stdin ended, but keeping server alive" });
      }
    });
    
    // Add process handlers for graceful shutdown
    process.on('SIGINT', () => {
      log("info", "main", { message: "Received SIGINT. Shutting down gracefully..." });
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      log("info", "main", { message: "Received SIGTERM. Shutting down gracefully..." });
      process.exit(0);
    });
    
    process.on('uncaughtException', (error) => {
      log("error", "main", { message: "Uncaught exception", error: error.message });
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason) => {
      log("error", "main", { message: "Unhandled promise rejection", reason });
      process.exit(1);
    });
    
    // Keep the process running
    process.on('exit', (code) => {
      if (code === 0) {
        log("debug", "main", { message: "Server shutting down normally" });
      } else {
        log("error", "main", { message: `Server shutting down with code ${code}` });
      }
    });
    
    

### Install Dependencies

    npm install
    

![mcp_logging_npm_install](../../public/images/mcp_logging_npm_install.png)

### Build the Project

    npm run build
    

![mcp_logging_npm_run_build](../../public/images/mcp_logging_npm_run_build.png)

### Testing with MCP Inspector

You can use [MCP Inspector](https://www.mcpevals.io/blog/mcp-inspector-guide) to run and test your MCP logging server:

1.  In your project root, run:
    
        npx @modelcontextprotocol/inspector
        
    
    ![mcp_logging_run_inspector](../../public/images/mcp_logging_run_inspector.png)
    
2.  Open [http://127.0.0.1:6274](http://127.0.0.1:6274) in your browser.
    
3.  In the GUI:
    
    *   Select **transport type:** `STDIO`
    *   **Command:** `node`
    *   **Arguments:** `./build/main.js`
    *   Click **Connect**
    
    ![mcp_logging_run_inspector_settings](../../public/images/mcp_logging_run_inspector_settings.png)
    
    Once connected, you'll see a **Logging Level** dropdown. Select the desired log level and observe the effect on log output.
    
    ![mcp_logging_run_inspector_logging](../../public/images/mcp_logging_run_inspector_logging.png)
    
4.  Set the **Logging Level** dropdown to `info`. This will send a `logging/setLevel` request with the level set to `info`. Here's what the request and response look like:
    
    ![mcp_logging_run_inspector_logging_info](../../public/images/mcp_logging_run_inspector_logging_info.png)
    
    _Request_
    
        {
          "method": "logging/setLevel",
          "params": {
            "level": "info"
          }
        }
        
    
    _Response_
    
        {}
        
    
5.  With the **Logging Level** set to `info`, select the `divide` tool from the GUI, enter your input values, and run the tool. You will see detailed server notifications in the MCP Inspector, including informational log messages about the divide operation. This confirms that the server is correctly sending logging information for each tool action at the configured log level.
    
    ![mcp_logging_run_inspector_logging_info_2](../../public/images/mcp_logging_run_inspector_logging_info_2.png)
    
6.  Now, change the **Logging Level** to `error`, keeping the same tool (`divide`) and input values as before. Run the tool again. This time, you will notice that no server notification is triggered for successful operations, because the server is now only logging messages at the `error` level or higher. You will only see a server notification if an actual error occurs (e.g., division by zero).
    
    ![mcp_logging_run_inspector_logging_error](../../public/images/mcp_logging_run_inspector_logging_error.png)
    
7.  Now, try dividing by zero using the `divide` tool while the **Logging Level** is set to `error`. You will see an error message appear in the server notifications panel, confirming that error-level logging is functioning correctly. The notification will look similar to this:
    
    ![mcp_logging_run_inspector_logging_error_2](../../public/images/mcp_logging_run_inspector_logging_error_2.png)
    

Node.js Logging Libraries
-------------------------

### Pino

Pino is a fast JSON logger for Node.js. It’s built for speed and keeps things running smoothly by using non-blocking I/O. By default, it outputs logs in JSON format and lets you adjust log levels and set rules for redacting information. This makes it a great choice for systems that require logs that can be easily read by machines. For instance:

    import pino from 'pino';
    const logger = pino({ level: 'info', name: 'mcp-app' });
    logger.info('MCP request received', { user: 'alice', action: 'login' });
    

Here, `logger.info()` puts key/value data like `user` and `action` into the log record. You can send Pino's JSON output straight into tools like Elasticsearch or Grafana Loki to analyze it.

### Winston

Winston is a popular logging library for Node.js that lets you customize how you log your data. It comes with different options for where to send your logs, like to the console, files, or over HTTP. You can easily change how the logs look, and it supports standard log levels. By default, it outputs in JSON format, but if you're in development, you can switch to a nicer format for the command line. Here’s a quick example:

    import winston from 'winston';
    const logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });
    logger.info('MCP request', { user: 'alice', action: 'login' });
    

Winston makes it easy for developers to manage logs. They can send structured logs to different places and change how they look without having to mess with the code.

### Bunyan

Here's a straightforward JSON-logging library. Bunyan focuses on keeping log records structured and comes with a built-in command line tool to make logs easier to read and filter while you’re developing. Each log in Bunyan is a JSON object that has fields like `name`, `level`, `time`, and more. For instance:

    import bunyan from 'bunyan';
    const logger = bunyan.createLogger({ name: 'mcp-app' });
    logger.info({ user: 'alice', action: 'login' }, 'MCP request');
    

Bunyan takes care of errors by adding an `err` field with stack traces and it supports log serializers. Its command line tool (`npx bunyan`) can format JSON logs nicely and filter them by level, which helps a lot when you're debugging.

Python Logging Libraries
------------------------

### Loguru

Loguru is a handy Python logging library that makes setting things up a breeze. You get a single `logger` object without all the extra setup, and it can handle structured logging right away. If you want to save your logs as JSON, just set `serialize=True` when you add a sink. Here's an example:

    from loguru import logger
    import sys
    
    logger.remove()  
    logger.add(sys.stdout, serialize=True)  # JSON output
    logger.info("MCP request", user="alice", action="login")
    

You get a JSON record that includes `time`, `level`, `message`, and any extra fields in key/value pairs. Loguru also has some cool features like simple exception logging, colored output, and adding context.

### Structlog

Structlog is a Python library that makes logs more organized and detailed. It can work with regular loggers, or even take their place, turning each log call into a JSON-like format with any key/value pairs you need. You can also add extra info, like request IDs, to your logs bit by bit. For instance:

    import structlog
    log = structlog.get_logger().bind(service="mcp-service")
    log.info("MCP request", user="alice", action="login")
    

This outputs something like:

    {"service": "mcp-service", "user": "alice", "action": "login", "event": "MCP request"}
    

Structlog works smoothly with the standard `logging` module and many popular frameworks, so you can easily add it to your MCP projects.

### Standard `logging` with JSONFormatter

You can use Python's `logging` module to output structured JSON. Just use formatters from the `python-json-logger` package, like this:

    import logging
    from python_json_logger import JSONFormatter
    
    logger = logging.getLogger("mcp-app")
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())  # format log records as JSON
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    
    logger.info("MCP request", extra={"user": "alice", "action": "login"})
    

This creates logs where each entry is a JSON object, which means machines can read them easily. By using the `extra` dictionary or adapters, you can add extra structured info to each log.

Best Practices
--------------

*   **Output logs in JSON format:** Use a structured format like JSON for your logs instead of plain text. JSON works well with many log tools and is easy for machines to read.
*   **Keep logger names consistent:** Name your loggers after your specific module or component. This helps to identify which part of the system is creating the logs, making it easier to filter and analyze them.
*   **Protect sensitive info:** Don’t log passwords, personal data, or secrets. If you have to log sensitive details, hide or alter them using the rules from your libraries.
*   **Connect with monitoring tools:** Make sure your logs are set up to work with monitoring systems like ELK, Grafana Loki, or Datadog. Use the same structured format (usually JSON with standard field names) across all services to streamline searching and visualizing logs in your systems.

Conclusion
----------

Structured logging is made better with the Model Context Protocol (MCP), which helps you see what’s happening, keep things running smoothly, and make updates easier in AI-driven apps. It creates a standard way of logging, lets you change log levels on the fly, and works well with popular logging libraries in TypeScript and Python. Sticking to best practices like using consistent names for loggers, safely managing sensitive info, and getting set up with monitoring tools can keep your logging setup effective as your system grows and gets more complex.
