<pre>- Starting MCP server: stdio with /usr/bin/node /home/esel/Documents/atlantis/dist/index.js
2025-10-31 13:03:21.008 | DEBUG    | - No mappers found for span &apos;mcp_server_startup&apos;
2025-10-31 13:03:21.009 | DEBUG    | - No mappers found for span &apos;mcp_server_startup&apos;
/usr/bin/node: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.36&apos; not found (required by /home/esel/.local/share/acli/1.3.5-stable/plugin/rovodev/lib/libstdc++.so.6)
2025-10-31 13:03:21.353 | DEBUG    | - Found mapper MCPEventMapper for span mcp_server_startup
2025-10-31 13:03:21.353 | DEBUG    | - Processing MCP event with attributes: {&apos;code.filepath&apos;: &apos;logfire/_internal/stack_info.py&apos;, &apos;code.function&apos;: &apos;get_user_frame_and_stacklevel&apos;, &apos;code.lineno&apos;: 100, &apos;logfire.msg_template&apos;: &apos;mcp_server_startup&apos;, &apos;logfire.msg&apos;: &apos;mcp_server_startup&apos;, &apos;logfire.span_type&apos;: &apos;span&apos;, &apos;server_type&apos;: &apos;stdio&apos;, &apos;connection_info&apos;: &apos;/usr/bin/node /home/esel/Documents/atlantis/dist/index.js&apos;, &apos;success&apos;: False, &apos;error&apos;: &apos;unhandled errors in a TaskGroup (1 sub-exception)&apos;, &apos;logfire.level_num&apos;: 17, &apos;logfire.exception.fingerprint&apos;: &apos;f3b31071c875b04d5cdbdce0867fd7bd92b5828390a7920f189ac4f5d90e5926&apos;, &apos;logfire.json_schema&apos;: &apos;{&quot;type&quot;:&quot;object&quot;,&quot;properties&quot;:{&quot;server_type&quot;:{},&quot;connection_info&quot;:{},&quot;success&quot;:{},&quot;error&quot;:{}}}&apos;}
2025-10-31 13:03:21.353 | DEBUG    | - No mappers found for span &apos;mcp_server_startup&apos;
2025-10-31 13:03:21.355 | DEBUG    | - No ROVODEV_SANDBOX_ID environment variable found
2025-10-31 13:03:21.355 | DEBUG    | - Sending event to Atlassian Analytics: mcp_server error
2025-10-31 13:03:21.353 | ERROR    | - Failed to start MCP server atlantis-core: unhandled errors in a TaskGroup (1 sub-exception). Attempting to gracefully exit.
  + Exception Group Traceback (most recent call last):
  |
  |   File &quot;rovodev/__main__.py&quot;, line 5, in &lt;module&gt;
  |
  |   File &quot;typer/main.py&quot;, line 324, in __call__
  |
  |   File &quot;click/core.py&quot;, line 1442, in __call__
  |
  |   File &quot;typer/core.py&quot;, line 757, in main
  |
  |   File &quot;typer/core.py&quot;, line 195, in _main
  |
  |   File &quot;click/core.py&quot;, line 1830, in invoke
  |
  |   File &quot;click/core.py&quot;, line 1226, in invoke
  |
  |   File &quot;click/core.py&quot;, line 794, in invoke
  |
  |   File &quot;typer/main.py&quot;, line 699, in wrapper
  |
  |   File &quot;rovodev/commands/run/command.py&quot;, line 1305, in run
  |
  |   File &quot;nest_asyncio.py&quot;, line 30, in run
  |
  |   File &quot;nest_asyncio.py&quot;, line 92, in run_until_complete
  |
  |   File &quot;nest_asyncio.py&quot;, line 133, in _run_once
  |
  |   File &quot;asyncio/events.py&quot;, line 84, in _run
  |
  |   File &quot;asyncio/tasks.py&quot;, line 277, in __step
  |
  |   File &quot;rovodev/modules/mcp_utils.py&quot;, line 115, in start_server_with_context
  |
  | &gt; File &quot;nemo/utils/mcp.py&quot;, line 461, in safe_start_mcp_server
  |
  |   File &quot;nemo/utils/mcp.py&quot;, line 257, in __aenter__
  |
  |   File &quot;pydantic_ai/mcp.py&quot;, line 204, in __aenter__
  |
  |   File &quot;contextlib.py&quot;, line 745, in __aexit__
  |
  |   File &quot;contextlib.py&quot;, line 728, in __aexit__
  |
  |   File &quot;contextlib.py&quot;, line 231, in __aexit__
  |
  |   File &quot;nemo/utils/mcp.py&quot;, line 324, in client_streams
  |
  |   File &quot;contextlib.py&quot;, line 231, in __aexit__
  |
  |   File &quot;mcp/client/stdio/__init__.py&quot;, line 180, in stdio_client
  |
  |   File &quot;anyio/_backends/_asyncio.py&quot;, line 772, in __aexit__
  |
  | ExceptionGroup: unhandled errors in a TaskGroup (1 sub-exception)
  +-+---------------- 1 ----------------
    | Exception Group Traceback (most recent call last):
    |
    |   File &quot;mcp/client/stdio/__init__.py&quot;, line 187, in stdio_client
    |
    |   File &quot;nemo/utils/mcp.py&quot;, line 325, in client_streams
    |
    |   File &quot;contextlib.py&quot;, line 728, in __aexit__
    |
    |   File &quot;mcp/shared/session.py&quot;, line 218, in __aexit__
    |
    |   File &quot;anyio/_backends/_asyncio.py&quot;, line 772, in __aexit__
    |
    | ExceptionGroup: unhandled errors in a TaskGroup (1 sub-exception)
    +-+---------------- 1 ----------------
      | Traceback (most recent call last):
      |
      |   File &quot;pydantic_ai/mcp.py&quot;, line 216, in __aenter__
      |
      |   File &quot;mcp/client/session.py&quot;, line 151, in initialize
      |
      |   File &quot;mcp/shared/session.py&quot;, line 286, in send_request
      |
      | mcp.shared.exceptions.McpError: Connection closed
      +------------------------------------
2025-10-31 13:03:21.445 | DEBUG    | - Successfully sent event to Atlassian Analytics
2025-10-31 13:03:25.227 | INFO     | nautilus.main:run:96 - Configuring Nautilus MCP server
2025-10-31 13:03:25.227 | INFO     | nautilus.main:run:111 - Estimating workspace size
2025-10-31 13:03:25.296 | INFO     | nautilus.main:run:113 - Is large repo: False
2025-10-31 13:03:25.329 | INFO     | nautilus.main:run:167 - Starting MCP Nautilus server using STDIO transport
2025-10-31 13:03:25.342 | DEBUG    | - Found mapper MCPEventMapper for span mcp_server_startup
2025-10-31 13:03:25.342 | DEBUG    | - Processing MCP event with attributes: {&apos;code.filepath&apos;: &apos;logfire/_internal/stack_info.py&apos;, &apos;code.function&apos;: &apos;get_user_frame_and_stacklevel&apos;, &apos;code.lineno&apos;: 100, &apos;logfire.msg_template&apos;: &apos;mcp_server_startup&apos;, &apos;logfire.msg&apos;: &apos;mcp_server_startup&apos;, &apos;logfire.span_type&apos;: &apos;span&apos;, &apos;server_type&apos;: &apos;stdio&apos;, &apos;connection_info&apos;: &apos;/home/esel/.local/share/acli/1.3.5-stable/plugin/rovodev/atlassian_cli_rovodev nautilus run --tools open_files,create_file,delete_file,move_file,expand_code_chunks,find_and_replace_code,grep,expand_folder,bash,powershell,update_allowed_external_paths --workspace-args-json {&quot;workspace_view_max_files&quot;: 1000, &quot;allowed_external_paths&quot;: [], &quot;run_shell_in_sandbox&quot;: false}&apos;, &apos;success&apos;: True, &apos;logfire.json_schema&apos;: &apos;{&quot;type&quot;:&quot;object&quot;,&quot;properties&quot;:{&quot;server_type&quot;:{},&quot;connection_info&quot;:{},&quot;success&quot;:{}}}&apos;}
2025-10-31 13:03:25.343 | DEBUG    | - No mappers found for span &apos;mcp_server_startup&apos;
2025-10-31 13:03:25.345 | DEBUG    | - No ROVODEV_SANDBOX_ID environment variable found
2025-10-31 13:03:25.345 | DEBUG    | - Sending event to Atlassian Analytics: mcp_server completed
2025-10-31 13:03:25.443 | DEBUG    | - Successfully sent event to Atlassian Analytics
2025-10-31 13:03:26.078 | DEBUG    | - Found mapper MCPEventMapper for span mcp_server_startup
2025-10-31 13:03:26.079 | DEBUG    | - Processing MCP event with attributes: {&apos;code.filepath&apos;: &apos;logfire/_internal/stack_info.py&apos;, &apos;code.function&apos;: &apos;get_user_frame_and_stacklevel&apos;, &apos;code.lineno&apos;: 100, &apos;logfire.msg_template&apos;: &apos;mcp_server_startup&apos;, &apos;logfire.msg&apos;: &apos;mcp_server_startup&apos;, &apos;logfire.span_type&apos;: &apos;span&apos;, &apos;server_type&apos;: &apos;stdio&apos;, &apos;connection_info&apos;: &quot;[Scrubbed due to &apos;auth&apos;]&quot;, &apos;success&apos;: True, &apos;logfire.json_schema&apos;: &apos;{&quot;type&quot;:&quot;object&quot;,&quot;properties&quot;:{&quot;server_type&quot;:{},&quot;connection_info&quot;:{},&quot;success&quot;:{}}}&apos;, &apos;logfire.scrubbed&apos;: &apos;[{&quot;path&quot;: [&quot;attributes&quot;, &quot;connection_info&quot;], &quot;matched_substring&quot;: &quot;auth&quot;}]&apos;}
2025-10-31 13:03:26.079 | DEBUG    | - No mappers found for span &apos;mcp_server_startup&apos;
2025-10-31 13:03:26.079 | ERROR    | - Failed to start MCP server atlantis-core
2025-10-31 13:03:26.082 | WARNING  | - Failed to start MCP server: atlantis-core
2025-10-31 13:03:26.082 | INFO     | - MCP servers started successfully
2025-10-31 13:03:26.084 | DEBUG    | - No ROVODEV_SANDBOX_ID environment variable found
2025-10-31 13:03:26.085 | DEBUG    | - Sending event to Atlassian Analytics: mcp_server completed
2025-10-31 13:03:26.172 | DEBUG    | - Successfully sent event to Atlassian Analytics
2025-10-31 13:03:36.099 | DEBUG    | - Shutting down MCP server: stdio with /home/esel/.local/share/acli/1.3.5-stable/plugin/rovodev/atlassian_cli_rovodev nautilus run --tools open_files,create_file,delete_file,move_file,expand_code_chunks,find_and_replace_code,grep,expand_folder,bash,powershell,update_allowed_external_paths --workspace-args-json {&quot;workspace_view_max_files&quot;: 1000, &quot;allowed_external_paths&quot;: [], &quot;run_shell_in_sandbox&quot;: false}
2025-10-31 13:03:36.099 | DEBUG    | - No mappers found for span &apos;mcp_server_shutdown&apos;
2025-10-31 13:03:36.099 | DEBUG    | - No mappers found for span &apos;mcp_server_shutdown&apos;
2025-10-31 13:03:36.100 | DEBUG    | - Found mapper MCPEventMapper for span mcp_server_shutdown
2025-10-31 13:03:36.100 | DEBUG    | - Processing MCP event with attributes: {&apos;code.filepath&apos;: &apos;logfire/_internal/stack_info.py&apos;, &apos;code.function&apos;: &apos;get_user_frame_and_stacklevel&apos;, &apos;code.lineno&apos;: 100, &apos;logfire.msg_template&apos;: &apos;mcp_server_shutdown&apos;, &apos;logfire.msg&apos;: &apos;mcp_server_shutdown&apos;, &apos;logfire.span_type&apos;: &apos;span&apos;, &apos;server_type&apos;: &apos;stdio&apos;, &apos;connection_info&apos;: &apos;/home/esel/.local/share/acli/1.3.5-stable/plugin/rovodev/atlassian_cli_rovodev nautilus run --tools open_files,create_file,delete_file,move_file,expand_code_chunks,find_and_replace_code,grep,expand_folder,bash,powershell,update_allowed_external_paths --workspace-args-json {&quot;workspace_view_max_files&quot;: 1000, &quot;allowed_external_paths&quot;: [], &quot;run_shell_in_sandbox&quot;: false}&apos;, &apos;success&apos;: True, &apos;logfire.json_schema&apos;: &apos;{&quot;type&quot;:&quot;object&quot;,&quot;properties&quot;:{&quot;server_type&quot;:{},&quot;connection_info&quot;:{},&quot;success&quot;:{}}}&apos;}
2025-10-31 13:03:36.100 | DEBUG    | - No mappers found for span &apos;mcp_server_shutdown&apos;
2025-10-31 13:03:36.101 | WARNING  | - MCP server shutdown: Exiting cancel scope in different task than it was entered in
2025-10-31 13:03:36.210 | DEBUG    | - No ROVODEV_SANDBOX_ID environment variable found
2025-10-31 13:03:36.210 | DEBUG    | - Sending event to Atlassian Analytics: mcp_server completed
2025-10-31 13:03:36.447 | DEBUG    | - Successfully sent event to Atlassian Analytics
2025-10-31 13:03:38.203 | DEBUG    | - Shutting down MCP server: stdio with /home/esel/.local/share/acli/1.3.5-stable/plugin/rovodev/atlassian_cli_rovodev atlassian-exp run --auth-header Basic a2hhbnN0ZXI0MDhAZ21haWwuY29tOkFUQVRUM3hGZkdGMF9WRGJyeE1OVDZrLWRrNTRVdUpjdmdBOW9ydjJyZ2dLU2tnUFVZUmxPc1hseGtqM2dWN1dldnFXU1NCX1YtSy1YTHp4WjBBUlFCenlmc2ZlUVotdElHZDVJeEFKbUdocWR6VmIxSTZfMkJYcFliQ2U1Z210bHBqSURIMjMxV1NjemREdmJhZmFPTEt1UUZTM3ZVN2dMZHpjclZaU2tBd3dBYjg2dUFoUHkwND01Q0FDQzEwQw==
2025-10-31 13:03:38.204 | DEBUG    | - No mappers found for span &apos;mcp_server_shutdown&apos;
2025-10-31 13:03:38.204 | DEBUG    | - No mappers found for span &apos;mcp_server_shutdown&apos;
2025-10-31 13:03:38.204 | DEBUG    | - Found mapper MCPEventMapper for span mcp_server_shutdown
2025-10-31 13:03:38.204 | DEBUG    | - Processing MCP event with attributes: {&apos;code.filepath&apos;: &apos;logfire/_internal/stack_info.py&apos;, &apos;code.function&apos;: &apos;get_user_frame_and_stacklevel&apos;, &apos;code.lineno&apos;: 100, &apos;logfire.msg_template&apos;: &apos;mcp_server_shutdown&apos;, &apos;logfire.msg&apos;: &apos;mcp_server_shutdown&apos;, &apos;logfire.span_type&apos;: &apos;span&apos;, &apos;server_type&apos;: &apos;stdio&apos;, &apos;connection_info&apos;: &quot;[Scrubbed due to &apos;auth&apos;]&quot;, &apos;success&apos;: True, &apos;logfire.json_schema&apos;: &apos;{&quot;type&quot;:&quot;object&quot;,&quot;properties&quot;:{&quot;server_type&quot;:{},&quot;connection_info&quot;:{},&quot;success&quot;:{}}}&apos;, &apos;logfire.scrubbed&apos;: &apos;[{&quot;path&quot;: [&quot;attributes&quot;, &quot;connection_info&quot;], &quot;matched_substring&quot;: &quot;auth&quot;}]&apos;}
2025-10-31 13:03:38.205 | DEBUG    | - No mappers found for span &apos;mcp_server_shutdown&apos;
2025-10-31 13:03:38.205 | WARNING  | - MCP server shutdown: Exiting cancel scope in different task than it was entered in
2025-10-31 13:03:38.209 | DEBUG    | - No ROVODEV_SANDBOX_ID environment variable found
2025-10-31 13:03:38.209 | DEBUG    | - Sending event to Atlassian Analytics: mcp_server completed
2025-10-31 13:03:38.314 | DEBUG    | - Successfully sent event to Atlassian Analytics
2025-10-31 13:03:38.315 | DEBUG    | - Collecting git-ai stats on shutdown
</pre>