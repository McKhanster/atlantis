On this page

*   [System Requirements](https://modelcontextprotocol.io/docs/develop/build-client#system-requirements)
*   [Setting Up Your Environment](https://modelcontextprotocol.io/docs/develop/build-client#setting-up-your-environment)
*   [Setting Up Your API Key](https://modelcontextprotocol.io/docs/develop/build-client#setting-up-your-api-key)
*   [Creating the Client](https://modelcontextprotocol.io/docs/develop/build-client#creating-the-client)
*   [Basic Client Structure](https://modelcontextprotocol.io/docs/develop/build-client#basic-client-structure)
*   [Server Connection Management](https://modelcontextprotocol.io/docs/develop/build-client#server-connection-management)
*   [Query Processing Logic](https://modelcontextprotocol.io/docs/develop/build-client#query-processing-logic)
*   [Interactive Chat Interface](https://modelcontextprotocol.io/docs/develop/build-client#interactive-chat-interface)
*   [Main Entry Point](https://modelcontextprotocol.io/docs/develop/build-client#main-entry-point)
*   [Key Components Explained](https://modelcontextprotocol.io/docs/develop/build-client#key-components-explained)
*   [1\. Client Initialization](https://modelcontextprotocol.io/docs/develop/build-client#1-client-initialization)
*   [2\. Server Connection](https://modelcontextprotocol.io/docs/develop/build-client#2-server-connection)
*   [3\. Query Processing](https://modelcontextprotocol.io/docs/develop/build-client#3-query-processing)
*   [4\. Interactive Interface](https://modelcontextprotocol.io/docs/develop/build-client#4-interactive-interface)
*   [5\. Resource Management](https://modelcontextprotocol.io/docs/develop/build-client#5-resource-management)
*   [Common Customization Points](https://modelcontextprotocol.io/docs/develop/build-client#common-customization-points)
*   [Running the Client](https://modelcontextprotocol.io/docs/develop/build-client#running-the-client)
*   [How It Works](https://modelcontextprotocol.io/docs/develop/build-client#how-it-works)
*   [Best practices](https://modelcontextprotocol.io/docs/develop/build-client#best-practices)
*   [Troubleshooting](https://modelcontextprotocol.io/docs/develop/build-client#troubleshooting)
*   [Server Path Issues](https://modelcontextprotocol.io/docs/develop/build-client#server-path-issues)
*   [Response Timing](https://modelcontextprotocol.io/docs/develop/build-client#response-timing)
*   [Common Error Messages](https://modelcontextprotocol.io/docs/develop/build-client#common-error-messages)
*   [Next steps](https://modelcontextprotocol.io/docs/develop/build-client#next-steps)

Develop with MCP

Build an MCP client
===================

Copy page

Get started building your own client that can integrate with all MCP servers.

Copy page

In this tutorial, you’ll learn how to build an LLM-powered chatbot client that connects to MCP servers. Before you begin, it helps to have gone through our [Build an MCP Server](https://modelcontextprotocol.io/docs/develop/build-server) tutorial so you can understand how clients and servers communicate.

*   Python
    
*   Node
    
*   Java
    
*   Kotlin
    
*   C#
    

[You can find the complete code for this tutorial here.](https://github.com/modelcontextprotocol/quickstart-resources/tree/main/mcp-client-python)

[​

](https://modelcontextprotocol.io/docs/develop/build-client#system-requirements)

System Requirements
-----------------------------------------------------------------------------------------------------------

Before starting, ensure your system meets these requirements:

*   Mac or Windows computer
*   Latest Python version installed
*   Latest version of `uv` installed

[​

](https://modelcontextprotocol.io/docs/develop/build-client#setting-up-your-environment)

Setting Up Your Environment
---------------------------------------------------------------------------------------------------------------------------

First, create a new Python project with `uv`:

macOS/Linux

Windows

Copy

    # Create project directory
    uv init mcp-client
    cd mcp-client
    
    # Create virtual environment
    uv venv
    
    # Activate virtual environment
    source .venv/bin/activate
    
    # Install required packages
    uv add mcp anthropic python-dotenv
    
    # Remove boilerplate files
    rm main.py
    
    # Create our main file
    touch client.py
    

[​

](https://modelcontextprotocol.io/docs/develop/build-client#setting-up-your-api-key)

Setting Up Your API Key
-------------------------------------------------------------------------------------------------------------------

You’ll need an Anthropic API key from the [Anthropic Console](https://console.anthropic.com/settings/keys).Create a `.env` file to store it:

Copy

    echo "ANTHROPIC_API_KEY=your-api-key-goes-here" > .env
    

Add `.env` to your `.gitignore`:

Copy

    echo ".env" >> .gitignore
    

Make sure you keep your `ANTHROPIC_API_KEY` secure!

[​

](https://modelcontextprotocol.io/docs/develop/build-client#creating-the-client)

Creating the Client
-----------------------------------------------------------------------------------------------------------

### 

[​

](https://modelcontextprotocol.io/docs/develop/build-client#basic-client-structure)

Basic Client Structure

First, let’s set up our imports and create the basic client class:

Copy

    import asyncio
    from typing import Optional
    from contextlib import AsyncExitStack
    
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
    
    from anthropic import Anthropic
    from dotenv import load_dotenv
    
    load_dotenv()  # load environment variables from .env
    
    class MCPClient:
        def __init__(self):
            # Initialize session and client objects
            self.session: Optional[ClientSession] = None
            self.exit_stack = AsyncExitStack()
            self.anthropic = Anthropic()
        # methods will go here
    

### 

[​

](https://modelcontextprotocol.io/docs/develop/build-client#server-connection-management)

Server Connection Management

Next, we’ll implement the method to connect to an MCP server:

Copy

    async def connect_to_server(self, server_script_path: str):
        """Connect to an MCP server
    
        Args:
            server_script_path: Path to the server script (.py or .js)
        """
        is_python = server_script_path.endswith('.py')
        is_js = server_script_path.endswith('.js')
        if not (is_python or is_js):
            raise ValueError("Server script must be a .py or .js file")
    
        command = "python" if is_python else "node"
        server_params = StdioServerParameters(
            command=command,
            args=[server_script_path],
            env=None
        )
    
        stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
        self.stdio, self.write = stdio_transport
        self.session = await self.exit_stack.enter_async_context(ClientSession(self.stdio, self.write))
    
        await self.session.initialize()
    
        # List available tools
        response = await self.session.list_tools()
        tools = response.tools
        print("\nConnected to server with tools:", [tool.name for tool in tools])
    

### 

[​

](https://modelcontextprotocol.io/docs/develop/build-client#query-processing-logic)

Query Processing Logic

Now let’s add the core functionality for processing queries and handling tool calls:

Copy

    async def process_query(self, query: str) -> str:
        """Process a query using Claude and available tools"""
        messages = [
            {
                "role": "user",
                "content": query
            }
        ]
    
        response = await self.session.list_tools()
        available_tools = [{
            "name": tool.name,
            "description": tool.description,
            "input_schema": tool.inputSchema
        } for tool in response.tools]
    
        # Initial Claude API call
        response = self.anthropic.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            messages=messages,
            tools=available_tools
        )
    
        # Process response and handle tool calls
        final_text = []
    
        assistant_message_content = []
        for content in response.content:
            if content.type == 'text':
                final_text.append(content.text)
                assistant_message_content.append(content)
            elif content.type == 'tool_use':
                tool_name = content.name
                tool_args = content.input
    
                # Execute tool call
                result = await self.session.call_tool(tool_name, tool_args)
                final_text.append(f"[Calling tool {tool_name} with args {tool_args}]")
    
                assistant_message_content.append(content)
                messages.append({
                    "role": "assistant",
                    "content": assistant_message_content
                })
                messages.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": content.id,
                            "content": result.content
                        }
                    ]
                })
    
                # Get next response from Claude
                response = self.anthropic.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1000,
                    messages=messages,
                    tools=available_tools
                )
    
                final_text.append(response.content[0].text)
    
        return "\n".join(final_text)
    

### 

[​

](https://modelcontextprotocol.io/docs/develop/build-client#interactive-chat-interface)

Interactive Chat Interface

Now we’ll add the chat loop and cleanup functionality:

Copy

    async def chat_loop(self):
        """Run an interactive chat loop"""
        print("\nMCP Client Started!")
        print("Type your queries or 'quit' to exit.")
    
        while True:
            try:
                query = input("\nQuery: ").strip()
    
                if query.lower() == 'quit':
                    break
    
                response = await self.process_query(query)
                print("\n" + response)
    
            except Exception as e:
                print(f"\nError: {str(e)}")
    
    async def cleanup(self):
        """Clean up resources"""
        await self.exit_stack.aclose()
    

### 

[​

](https://modelcontextprotocol.io/docs/develop/build-client#main-entry-point)

Main Entry Point

Finally, we’ll add the main execution logic:

Copy

    async def main():
        if len(sys.argv) < 2:
            print("Usage: python client.py <path_to_server_script>")
            sys.exit(1)
    
        client = MCPClient()
        try:
            await client.connect_to_server(sys.argv[1])
            await client.chat_loop()
        finally:
            await client.cleanup()
    
    if __name__ == "__main__":
        import sys
        asyncio.run(main())
    

You can find the complete `client.py` file [here](https://github.com/modelcontextprotocol/quickstart-resources/blob/main/mcp-client-python/client.py).

[​

](https://modelcontextprotocol.io/docs/develop/build-client#key-components-explained)

Key Components Explained
---------------------------------------------------------------------------------------------------------------------

### 

[​

](https://modelcontextprotocol.io/docs/develop/build-client#1-client-initialization)

1\. Client Initialization

*   The `MCPClient` class initializes with session management and API clients
*   Uses `AsyncExitStack` for proper resource management
*   Configures the Anthropic client for Claude interactions

### 

[​

](https://modelcontextprotocol.io/docs/develop/build-client#2-server-connection)

2\. Server Connection

*   Supports both Python and Node.js servers
*   Validates server script type
*   Sets up proper communication channels
*   Initializes the session and lists available tools

### 

[​

](https://modelcontextprotocol.io/docs/develop/build-client#3-query-processing)

3\. Query Processing

*   Maintains conversation context
*   Handles Claude’s responses and tool calls
*   Manages the message flow between Claude and tools
*   Combines results into a coherent response

### 

[​

](https://modelcontextprotocol.io/docs/develop/build-client#4-interactive-interface)

4\. Interactive Interface

*   Provides a simple command-line interface
*   Handles user input and displays responses
*   Includes basic error handling
*   Allows graceful exit

### 

[​

](https://modelcontextprotocol.io/docs/develop/build-client#5-resource-management)

5\. Resource Management

*   Proper cleanup of resources
*   Error handling for connection issues
*   Graceful shutdown procedures

[​

](https://modelcontextprotocol.io/docs/develop/build-client#common-customization-points)

Common Customization Points
---------------------------------------------------------------------------------------------------------------------------

1.  **Tool Handling**
    *   Modify `process_query()` to handle specific tool types
    *   Add custom error handling for tool calls
    *   Implement tool-specific response formatting
2.  **Response Processing**
    *   Customize how tool results are formatted
    *   Add response filtering or transformation
    *   Implement custom logging
3.  **User Interface**
    *   Add a GUI or web interface
    *   Implement rich console output
    *   Add command history or auto-completion

[​

](https://modelcontextprotocol.io/docs/develop/build-client#running-the-client)

Running the Client
---------------------------------------------------------------------------------------------------------

To run your client with any MCP server:

Copy

    uv run client.py path/to/server.py # python server
    uv run client.py path/to/build/index.js # node server
    

If you’re continuing [the weather tutorial from the server quickstart](https://github.com/modelcontextprotocol/quickstart-resources/tree/main/weather-server-python), your command might look something like this: `python client.py .../quickstart-resources/weather-server-python/weather.py`

The client will:

1.  Connect to the specified server
2.  List available tools
3.  Start an interactive chat session where you can:
    *   Enter queries
    *   See tool executions
    *   Get responses from Claude

Here’s an example of what it should look like if connected to the weather server from the server quickstart:

![](./Build an MCP client - Model Context Protocol_files/client-claude-cli-python.png)

[​

](https://modelcontextprotocol.io/docs/develop/build-client#how-it-works)

How It Works
---------------------------------------------------------------------------------------------

When you submit a query:

1.  The client gets the list of available tools from the server
2.  Your query is sent to Claude along with tool descriptions
3.  Claude decides which tools (if any) to use
4.  The client executes any requested tool calls through the server
5.  Results are sent back to Claude
6.  Claude provides a natural language response
7.  The response is displayed to you

[​

](https://modelcontextprotocol.io/docs/develop/build-client#best-practices)

Best practices
-------------------------------------------------------------------------------------------------

1.  **Error Handling**
    *   Always wrap tool calls in try-catch blocks
    *   Provide meaningful error messages
    *   Gracefully handle connection issues
2.  **Resource Management**
    *   Use `AsyncExitStack` for proper cleanup
    *   Close connections when done
    *   Handle server disconnections
3.  **Security**
    *   Store API keys securely in `.env`
    *   Validate server responses
    *   Be cautious with tool permissions
4.  **Tool Names**
    *   Tool names can be validated according to the format specified [here](https://modelcontextprotocol.io/specification/draft/server/tools#tool-names)
    *   If a tool name conforms to the specified format, it should not fail validation by an MCP client

[​

](https://modelcontextprotocol.io/docs/develop/build-client#troubleshooting)

Troubleshooting
---------------------------------------------------------------------------------------------------

### 

[​

](https://modelcontextprotocol.io/docs/develop/build-client#server-path-issues)

Server Path Issues

*   Double-check the path to your server script is correct
*   Use the absolute path if the relative path isn’t working
*   For Windows users, make sure to use forward slashes (/) or escaped backslashes (\\) in the path
*   Verify the server file has the correct extension (.py for Python or .js for Node.js)

Example of correct path usage:

Copy

    # Relative path
    uv run client.py ./server/weather.py
    
    # Absolute path
    uv run client.py /Users/username/projects/mcp-server/weather.py
    
    # Windows path (either format works)
    uv run client.py C:/projects/mcp-server/weather.py
    uv run client.py C:\\projects\\mcp-server\\weather.py
    

### 

[​

](https://modelcontextprotocol.io/docs/develop/build-client#response-timing)

Response Timing

*   The first response might take up to 30 seconds to return
*   This is normal and happens while:
    *   The server initializes
    *   Claude processes the query
    *   Tools are being executed
*   Subsequent responses are typically faster
*   Don’t interrupt the process during this initial waiting period

### 

[​

](https://modelcontextprotocol.io/docs/develop/build-client#common-error-messages)

Common Error Messages

If you see:

*   `FileNotFoundError`: Check your server path
*   `Connection refused`: Ensure the server is running and the path is correct
*   `Tool execution failed`: Verify the tool’s required environment variables are set
*   `Timeout error`: Consider increasing the timeout in your client configuration

[​

](https://modelcontextprotocol.io/docs/develop/build-client#next-steps)

Next steps
-----------------------------------------------------------------------------------------

[

Example servers
---------------

Check out our gallery of official MCP servers and implementations





](https://modelcontextprotocol.io/examples)[

Example clients
---------------

View the list of clients that support MCP integrations


