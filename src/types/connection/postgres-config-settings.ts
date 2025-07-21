export type PostgresConfigSettings = {
  // Allows running the ALTER SYSTEM command.
  allow_alter_system: boolean | string;

  // Allows tablespaces directly inside pg_tblspc, for testing.
  allow_in_place_tablespaces: boolean | string;

  // Allows modifications of the structure of system tables.
  allow_system_table_mods: boolean | string;

  // Sets the application name to be reported in statistics and logs.
  application_name: string;

  // Sets the shell command that will be executed at every restart point.
  archive_cleanup_command: string;

  // Sets the shell command that will be called to archive a WAL file.
  archive_command: string;

  // Sets the library that will be called to archive a WAL file.
  archive_library: string;

  // Allows archiving of WAL files using "archive_command".
  archive_mode: string;

  // Sets the amount of time to wait before forcing a switch to the next WAL file.
  archive_timeout: number | string;

  // Enable input of NULL elements in arrays.
  array_nulls: boolean | string;

  // Sets the maximum allowed time to complete client authentication.
  authentication_timeout: number | string;

  // Starts the autovacuum subprocess.
  autovacuum: boolean | string;

  // Number of tuple inserts, updates, or deletes prior to analyze as a fraction of reltuples.
  autovacuum_analyze_scale_factor: number | string;

  // Minimum number of tuple inserts, updates, or deletes prior to analyze.
  autovacuum_analyze_threshold: number | string;

  // Age at which to autovacuum a table to prevent transaction ID wraparound.
  autovacuum_freeze_max_age: number | string;

  // Sets the maximum number of simultaneously running autovacuum worker processes.
  autovacuum_max_workers: number | string;

  // Multixact age at which to autovacuum a table to prevent multixact wraparound.
  autovacuum_multixact_freeze_max_age: number | string;

  // Time to sleep between autovacuum runs.
  autovacuum_naptime: number | string;

  // Vacuum cost delay in milliseconds, for autovacuum.
  autovacuum_vacuum_cost_delay: number | string;

  // Vacuum cost amount available before napping, for autovacuum.
  autovacuum_vacuum_cost_limit: number | string;

  // Number of tuple inserts prior to vacuum as a fraction of reltuples.
  autovacuum_vacuum_insert_scale_factor: number | string;

  // Minimum number of tuple inserts prior to vacuum, or -1 to disable insert vacuums.
  autovacuum_vacuum_insert_threshold: number | string;

  // Number of tuple updates or deletes prior to vacuum as a fraction of reltuples.
  autovacuum_vacuum_scale_factor: number | string;

  // Minimum number of tuple updates or deletes prior to vacuum.
  autovacuum_vacuum_threshold: number | string;

  // Sets the maximum memory to be used by each autovacuum worker process.
  autovacuum_work_mem: number | string;

  // Number of pages after which previously performed writes are flushed to disk.
  backend_flush_after: number | string;

  // Sets whether "\'" is allowed in string literals.
  backslash_quote: string;

  // Log backtrace for errors in these functions.
  backtrace_functions: string;

  // Background writer sleep time between rounds.
  bgwriter_delay: number | string;

  // Number of pages after which previously performed writes are flushed to disk.
  bgwriter_flush_after: number | string;

  // Background writer maximum number of LRU pages to flush per round.
  bgwriter_lru_maxpages: number | string;

  // Multiple of the average buffer usage to free per round.
  bgwriter_lru_multiplier: number | string;

  // Shows the size of a disk block.
  block_size: number | string;

  // Enables advertising the server via Bonjour.
  bonjour: boolean | string;

  // Sets the Bonjour service name.
  bonjour_name: string;

  // Sets the output format for bytea.
  bytea_output: string;

  // Check routine bodies during CREATE FUNCTION and CREATE PROCEDURE.
  check_function_bodies: boolean | string;

  // Time spent flushing dirty buffers during checkpoint, as fraction of checkpoint interval.
  checkpoint_completion_target: number | string;

  // Number of pages after which previously performed writes are flushed to disk.
  checkpoint_flush_after: number | string;

  // Sets the maximum time between automatic WAL checkpoints.
  checkpoint_timeout: number | string;

  // Sets the maximum time before warning if checkpoints triggered by WAL volume happen too frequently.
  checkpoint_warning: number | string;

  // Sets the time interval between checks for disconnection while running queries.
  client_connection_check_interval: number | string;

  // Sets the client's character set encoding.
  client_encoding: string;

  // Sets the message levels that are sent to the client.
  client_min_messages: string;

  // Sets the name of the cluster, which is included in the process title.
  cluster_name: string;

  // Sets the delay in microseconds between transaction commit and flushing WAL to disk.
  commit_delay: number | string;

  // Sets the minimum number of concurrent open transactions required before performing "commit_delay".
  commit_siblings: number | string;

  // Sets the size of the dedicated buffer pool used for the commit timestamp cache.
  commit_timestamp_buffers: number | string;

  // Enables in-core computation of query identifiers.
  compute_query_id: string;

  // Sets the server's main configuration file.
  config_file: string;

  // Enables the planner to use constraints to optimize queries.
  constraint_exclusion: string;

  // Sets the planner's estimate of the cost of processing each index entry during an index scan.
  cpu_index_tuple_cost: number | string;

  // Sets the planner's estimate of the cost of processing each operator or function call.
  cpu_operator_cost: number | string;

  // Sets the planner's estimate of the cost of processing each tuple (row).
  cpu_tuple_cost: number | string;

  // Sets whether a CREATEROLE user automatically grants the role to themselves, and with which options.
  createrole_self_grant: string;

  // Sets the planner's estimate of the fraction of a cursor's rows that will be retrieved.
  cursor_tuple_fraction: number | string;

  // Shows whether data checksums are turned on for this cluster.
  data_checksums: boolean | string;

  // Sets the server's data directory.
  data_directory: string;

  // Shows the mode of the data directory.
  data_directory_mode: number | string;

  // Whether to continue running after a failure to sync data files.
  data_sync_retry: boolean | string;

  // Sets the display format for date and time values.
  DateStyle: string;

  // Sets the time to wait on a lock before checking for deadlock.
  deadlock_timeout: number | string;

  // Shows whether the running server has assertion checks enabled.
  debug_assertions: boolean | string;

  // Aggressively flush system caches for debugging purposes.
  debug_discard_caches: number | string;

  // Use direct I/O for file access.
  debug_io_direct: string;

  // Forces immediate streaming or serialization of changes in large transactions.
  debug_logical_replication_streaming: string;

  // Forces the planner's use parallel query nodes.
  debug_parallel_query: string;

  // Indents parse and plan tree displays.
  debug_pretty_print: boolean | string;

  // Logs each query's parse tree.
  debug_print_parse: boolean | string;

  // Logs each query's execution plan.
  debug_print_plan: boolean | string;

  // Logs each query's rewritten parse tree.
  debug_print_rewritten: boolean | string;

  // Sets the default statistics target.
  default_statistics_target: number | string;

  // Sets the default table access method for new tables.
  default_table_access_method: string;

  // Sets the default tablespace to create tables and indexes in.
  default_tablespace: string;

  // Sets default text search configuration.
  default_text_search_config: string;

  // Sets the default compression method for compressible values.
  default_toast_compression: string;

  // Sets the default deferrable status of new transactions.
  default_transaction_deferrable: boolean | string;

  // Sets the transaction isolation level of each new transaction.
  default_transaction_isolation: string;

  // Sets the default read-only status of new transactions.
  default_transaction_read_only: boolean | string;

  // Sets the path for dynamically loadable modules.
  dynamic_library_path: string;

  // Selects the dynamic shared memory implementation used.
  dynamic_shared_memory_type: string;

  // Sets the planner's assumption about the total size of the data caches.
  effective_cache_size: number | string;

  // Number of simultaneous requests that can be handled efficiently by the disk subsystem.
  effective_io_concurrency: number | string;

  // Enables the planner's use of async append plans.
  enable_async_append: boolean | string;

  // Enables the planner's use of bitmap-scan plans.
  enable_bitmapscan: boolean | string;

  // Enables the planner's use of gather merge plans.
  enable_gathermerge: boolean | string;

  // Enables reordering of GROUP BY keys.
  enable_group_by_reordering: boolean | string;

  // Enables the planner's use of hashed aggregation plans.
  enable_hashagg: boolean | string;

  // Enables the planner's use of hash join plans.
  enable_hashjoin: boolean | string;

  // Enables the planner's use of incremental sort steps.
  enable_incremental_sort: boolean | string;

  // Enables the planner's use of index-only-scan plans.
  enable_indexonlyscan: boolean | string;

  // Enables the planner's use of index-scan plans.
  enable_indexscan: boolean | string;

  // Enables the planner's use of materialization.
  enable_material: boolean | string;

  // Enables the planner's use of memoization.
  enable_memoize: boolean | string;

  // Enables the planner's use of merge join plans.
  enable_mergejoin: boolean | string;

  // Enables the planner's use of nested-loop join plans.
  enable_nestloop: boolean | string;

  // Enables the planner's use of parallel append plans.
  enable_parallel_append: boolean | string;

  // Enables the planner's use of parallel hash plans.
  enable_parallel_hash: boolean | string;

  // Enables plan-time and execution-time partition pruning.
  enable_partition_pruning: boolean | string;

  // Enables partitionwise aggregation and grouping.
  enable_partitionwise_aggregate: boolean | string;

  // Enables partitionwise join.
  enable_partitionwise_join: boolean | string;

  // Enables the planner's ability to produce plans that provide presorted input for ORDER BY / DISTINCT aggregate functions.
  enable_presorted_aggregate: boolean | string;

  // Enables the planner's use of sequential-scan plans.
  enable_seqscan: boolean | string;

  // Enables the planner's use of explicit sort steps.
  enable_sort: boolean | string;

  // Enables the planner's use of TID scan plans.
  enable_tidscan: boolean | string;

  // Warn about backslash escapes in ordinary string literals.
  escape_string_warning: boolean | string;

  // Sets the application name used to identify PostgreSQL messages in the event log.
  event_source: string;

  // Enables event triggers.
  event_triggers: boolean | string;

  // Terminate session on any error.
  exit_on_error: boolean | string;

  // Writes the postmaster PID to the specified file.
  external_pid_file: string;

  // Sets the number of digits displayed for floating-point values.
  extra_float_digits: number | string;

  // Sets the FROM-list size beyond which subqueries are not collapsed.
  from_collapse_limit: number | string;

  // Forces synchronization of updates to disk.
  fsync: boolean | string;

  // Writes full pages to WAL when first modified after a checkpoint.
  full_page_writes: boolean | string;

  // Enables genetic query optimization.
  geqo: boolean | string;

  // GEQO: effort is used to set the default for other GEQO parameters.
  geqo_effort: number | string;

  // GEQO: number of iterations of the algorithm.
  geqo_generations: number | string;

  // GEQO: number of individuals in the population.
  geqo_pool_size: number | string;

  // GEQO: seed for random path selection.
  geqo_seed: number | string;

  // GEQO: selective pressure within the population.
  geqo_selection_bias: number | string;

  // Sets the threshold of FROM items beyond which GEQO is used.
  geqo_threshold: number | string;

  // Sets the maximum allowed result for exact search by GIN.
  gin_fuzzy_search_limit: number | string;

  // Sets the maximum size of the pending list for GIN index.
  gin_pending_list_limit: number | string;

  // Sets whether GSSAPI delegation should be accepted from the client.
  gss_accept_delegation: boolean | string;

  // Multiple of "work_mem" to use for hash tables.
  hash_mem_multiplier: number | string;

  // Sets the server's "hba" configuration file.
  hba_file: string;

  // Allows connections and queries during recovery.
  hot_standby: boolean | string;

  // Allows feedback from a hot standby to the primary that will avoid query conflicts.
  hot_standby_feedback: boolean | string;

  // The size of huge page that should be requested.
  huge_page_size: number | string;

  // Use of huge pages on Linux or Windows.
  huge_pages: string;

  // Indicates the status of huge pages.
  huge_pages_status: string;

  // Log level for reporting invalid ICU locale strings.
  icu_validation_level: string;

  // Sets the server's "ident" configuration file.
  ident_file: string;

  // Sets the maximum allowed idle time between queries, when in a transaction.
  idle_in_transaction_session_timeout: number | string;

  // Sets the maximum allowed idle time between queries, when not in a transaction.
  idle_session_timeout: number | string;

  // Continues processing after a checksum failure.
  ignore_checksum_failure: boolean | string;

  // Continues recovery after an invalid pages failure.
  ignore_invalid_pages: boolean | string;

  // Disables reading from system indexes.
  ignore_system_indexes: boolean | string;

  // Shows whether hot standby is currently active.
  in_hot_standby: boolean | string;

  // Shows whether datetimes are integer based.
  integer_datetimes: boolean | string;

  // Sets the display format for interval values.
  IntervalStyle: string;

  // Limit on the size of data reads and writes.
  io_combine_limit: number | string;

  // Allow JIT compilation.
  jit: boolean | string;

  // Perform JIT compilation if query is more expensive.
  jit_above_cost: number | string;

  // Register JIT-compiled functions with debugger.
  jit_debugging_support: boolean | string;

  // Write out LLVM bitcode to facilitate JIT debugging.
  jit_dump_bitcode: boolean | string;

  // Allow JIT compilation of expressions.
  jit_expressions: boolean | string;

  // Perform JIT inlining if query is more expensive.
  jit_inline_above_cost: number | string;

  // Optimize JIT-compiled functions if query is more expensive.
  jit_optimize_above_cost: number | string;

  // Register JIT-compiled functions with perf profiler.
  jit_profiling_support: boolean | string;

  // JIT provider to use.
  jit_provider: string;

  // Allow JIT compilation of tuple deforming.
  jit_tuple_deforming: boolean | string;

  // Sets the FROM-list size beyond which JOIN constructs are not flattened.
  join_collapse_limit: number | string;

  // Sets whether Kerberos and GSSAPI user names should be treated as case-insensitive.
  krb_caseins_users: boolean | string;

  // Sets the location of the Kerberos server key file.
  krb_server_keyfile: string;

  // Sets the language in which messages are displayed.
  lc_messages: string;

  // Sets the locale for formatting monetary amounts.
  lc_monetary: string;

  // Sets the locale for formatting numbers.
  lc_numeric: string;

  // Sets the locale for formatting date and time values.
  lc_time: string;

  // Sets the host name or IP address(es) to listen to.
  listen_addresses: string;

  // Enables backward compatibility mode for privilege checks on large objects.
  lo_compat_privileges: boolean | string;

  // Lists unprivileged shared libraries to preload into each backend.
  local_preload_libraries: string;

  // Sets the maximum allowed duration of any wait for a lock.
  lock_timeout: number | string;

  // Sets the minimum execution time above which autovacuum actions will be logged.
  log_autovacuum_min_duration: number | string;

  // Logs each checkpoint.
  log_checkpoints: boolean | string;

  // Logs each successful connection.
  log_connections: boolean | string;

  // Sets the destination for server log output.
  log_destination: string;

  // Sets the destination directory for log files.
  log_directory: string;

  // Logs end of a session, including duration.
  log_disconnections: boolean | string;

  // Logs the duration of each completed SQL statement.
  log_duration: boolean | string;

  // Sets the verbosity of logged messages.
  log_error_verbosity: string;

  // Writes executor performance statistics to the server log.
  log_executor_stats: boolean | string;

  // Sets the file permissions for log files.
  log_file_mode: number | string;

  // Sets the file name pattern for log files.
  log_filename: string;

  // Logs the host name in the connection logs.
  log_hostname: boolean | string;

  // Controls information prefixed to each log line.
  log_line_prefix: string;

  // Logs long lock waits.
  log_lock_waits: boolean | string;

  // Sets the minimum execution time above which a sample of statements will be logged. Sampling is determined by log_statement_sample_rate.
  log_min_duration_sample: number | string;

  // Sets the minimum execution time above which all statements will be logged.
  log_min_duration_statement: number | string;

  // Causes all statements generating error at or above this level to be logged.
  log_min_error_statement: string;

  // Sets the message levels that are logged.
  log_min_messages: string;

  // Sets the maximum length in bytes of data logged for bind parameter values when logging statements.
  log_parameter_max_length: number | string;

  // Sets the maximum length in bytes of data logged for bind parameter values when logging statements, on error.
  log_parameter_max_length_on_error: number | string;

  // Writes parser performance statistics to the server log.
  log_parser_stats: boolean | string;

  // Writes planner performance statistics to the server log.
  log_planner_stats: boolean | string;

  // Logs standby recovery conflict waits.
  log_recovery_conflict_waits: boolean | string;

  // Logs each replication command.
  log_replication_commands: boolean | string;

  // Sets the amount of time to wait before forcing log file rotation.
  log_rotation_age: number | string;

  // Sets the maximum size a log file can reach before being rotated.
  log_rotation_size: number | string;

  // Time between progress updates for long-running startup operations.
  log_startup_progress_interval: number | string;

  // Sets the type of statements logged.
  log_statement: string;

  // Fraction of statements exceeding "log_min_duration_sample" to be logged.
  log_statement_sample_rate: number | string;

  // Writes cumulative performance statistics to the server log.
  log_statement_stats: boolean | string;

  // Log the use of temporary files larger than this number of kilobytes.
  log_temp_files: number | string;

  // Sets the time zone to use in log messages.
  log_timezone: string;

  // Sets the fraction of transactions from which to log all statements.
  log_transaction_sample_rate: number | string;

  // Truncate existing log files of same name during log rotation.
  log_truncate_on_rotation: boolean | string;

  // Start a subprocess to capture stderr output and/or csvlogs into log files.
  logging_collector: boolean | string;

  // Sets the maximum memory to be used for logical decoding.
  logical_decoding_work_mem: number | string;

  // A variant of "effective_io_concurrency" that is used for maintenance work.
  maintenance_io_concurrency: number | string;

  // Sets the maximum memory to be used for maintenance operations.
  maintenance_work_mem: number | string;

  // Sets the maximum number of concurrent connections.
  max_connections: number | string;

  // Sets the maximum number of simultaneously open files for each server process.
  max_files_per_process: number | string;

  // Shows the maximum number of function arguments.
  max_function_args: number | string;

  // Shows the maximum identifier length.
  max_identifier_length: number | string;

  // Shows the maximum number of index keys.
  max_index_keys: number | string;

  // Sets the maximum number of locks per transaction.
  max_locks_per_transaction: number | string;

  // Maximum number of logical replication worker processes.
  max_logical_replication_workers: number | string;

  // Sets the maximum number of allocated pages for NOTIFY / LISTEN queue.
  max_notify_queue_pages: number | string;

  // Maximum number of parallel apply workers per subscription.
  max_parallel_apply_workers_per_subscription: number | string;

  // Sets the maximum number of parallel processes per maintenance operation.
  max_parallel_maintenance_workers: number | string;

  // Sets the maximum number of parallel workers that can be active at one time.
  max_parallel_workers: number | string;

  // Sets the maximum number of parallel processes per executor node.
  max_parallel_workers_per_gather: number | string;

  // Sets the maximum number of predicate-locked tuples per page.
  max_pred_locks_per_page: number | string;

  // Sets the maximum number of predicate-locked pages and tuples per relation.
  max_pred_locks_per_relation: number | string;

  // Sets the maximum number of predicate locks per transaction.
  max_pred_locks_per_transaction: number | string;

  // Sets the maximum number of simultaneously prepared transactions.
  max_prepared_transactions: number | string;

  // Sets the maximum number of simultaneously defined replication slots.
  max_replication_slots: number | string;

  // Sets the maximum WAL size that can be reserved by replication slots.
  max_slot_wal_keep_size: number | string;

  // Sets the maximum stack depth, in kilobytes.
  max_stack_depth: number | string;

  // Sets the maximum delay before canceling queries when a hot standby server is processing archived WAL data.
  max_standby_archive_delay: number | string;

  // Sets the maximum delay before canceling queries when a hot standby server is processing streamed WAL data.
  max_standby_streaming_delay: number | string;

  // Maximum number of table synchronization workers per subscription.
  max_sync_workers_per_subscription: number | string;

  // Sets the maximum number of simultaneously running WAL sender processes.
  max_wal_senders: number | string;

  // Sets the WAL size that triggers a checkpoint.
  max_wal_size: number | string;

  // Maximum number of concurrent worker processes.
  max_worker_processes: number | string;

  // Amount of dynamic shared memory reserved at startup.
  min_dynamic_shared_memory: number | string;

  // Sets the minimum amount of index data for a parallel scan.
  min_parallel_index_scan_size: number | string;

  // Sets the minimum amount of table data for a parallel scan.
  min_parallel_table_scan_size: number | string;

  // Sets the minimum size to shrink the WAL to.
  min_wal_size: number | string;

  // Sets the size of the dedicated buffer pool used for the MultiXact member cache.
  multixact_member_buffers: number | string;

  // Sets the size of the dedicated buffer pool used for the MultiXact offset cache.
  multixact_offset_buffers: number | string;

  // Sets the size of the dedicated buffer pool used for the LISTEN/NOTIFY message cache.
  notify_buffers: number | string;

  // Controls whether Gather and Gather Merge also run subplans.
  parallel_leader_participation: boolean | string;

  // Sets the planner's estimate of the cost of starting up worker processes for parallel query.
  parallel_setup_cost: number | string;

  // Sets the planner's estimate of the cost of passing each tuple (row) from worker to leader backend.
  parallel_tuple_cost: number | string;

  // Chooses the algorithm for encrypting passwords.
  password_encryption: string;

  // Controls the planner's selection of custom or generic plan.
  plan_cache_mode: string;

  // Sets the TCP port the server listens on.
  port: number | string;

  // Sets the amount of time to wait after authentication on connection startup.
  post_auth_delay: number | string;

  // Sets the amount of time to wait before authentication on connection startup.
  pre_auth_delay: number | string;

  // Sets the connection string to be used to connect to the sending server.
  primary_conninfo: string;

  // Sets the name of the replication slot to use on the sending server.
  primary_slot_name: string;

  // When generating SQL fragments, quote all identifiers.
  quote_all_identifiers: boolean | string;

  // Sets the planner's estimate of the cost of a nonsequentially fetched disk page.
  random_page_cost: number | string;

  // Sets the shell command that will be executed once at the end of recovery.
  recovery_end_command: string;

  // Sets the method for synchronizing the data directory before crash recovery.
  recovery_init_sync_method: string;

  // Sets the minimum delay for applying changes during recovery.
  recovery_min_apply_delay: number | string;

  // Prefetch referenced blocks during recovery.
  recovery_prefetch: string;

  // Set to "immediate" to end recovery as soon as a consistent state is reached.
  recovery_target: string;

  // Sets the action to perform upon reaching the recovery target.
  recovery_target_action: string;

  // Sets whether to include or exclude transaction with recovery target.
  recovery_target_inclusive: boolean | string;

  // Sets the LSN of the write-ahead log location up to which recovery will proceed.
  recovery_target_lsn: string;

  // Sets the named restore point up to which recovery will proceed.
  recovery_target_name: string;

  // Sets the time stamp up to which recovery will proceed.
  recovery_target_time: string;

  // Specifies the timeline to recover into.
  recovery_target_timeline: string;

  // Sets the transaction ID up to which recovery will proceed.
  recovery_target_xid: string;

  // Sets the planner's estimate of the average size of a recursive query's working table.
  recursive_worktable_factor: number | string;

  // Remove temporary files after backend crash.
  remove_temp_files_after_crash: boolean | string;

  // Sets the number of connection slots reserved for roles with privileges of pg_use_reserved_connections.
  reserved_connections: number | string;

  // Reinitialize server after backend crash.
  restart_after_crash: boolean | string;

  // Sets the shell command that will be called to retrieve an archived WAL file.
  restore_command: string;

  // Prohibits access to non-system relations of specified kinds.
  restrict_nonsystem_relation_kind: string;

  // Enable row security.
  row_security: boolean | string;

  // Sets the iteration count for SCRAM secret generation.
  scram_iterations: number | string;

  // Sets the schema search order for names that are not schema-qualified.
  search_path: string;

  // Shows the number of pages per disk file.
  segment_size: number | string;

  // Send SIGABRT not SIGQUIT to child processes after backend crash.
  send_abort_for_crash: boolean | string;

  // Send SIGABRT not SIGKILL to stuck child processes.
  send_abort_for_kill: boolean | string;

  // Sets the planner's estimate of the cost of a sequentially fetched disk page.
  seq_page_cost: number | string;

  // Sets the size of the dedicated buffer pool used for the serializable transaction cache.
  serializable_buffers: number | string;

  // Shows the server (database) character set encoding.
  server_encoding: string;

  // Shows the server version.
  server_version: string;

  // Shows the server version as an integer.
  server_version_num: number | string;

  // Lists shared libraries to preload into each backend.
  session_preload_libraries: string;

  // Sets the session's behavior for triggers and rewrite rules.
  session_replication_role: string;

  // Sets the number of shared memory buffers used by the server.
  shared_buffers: number | string;

  // Shows the size of the server's main shared memory area (rounded up to the nearest MB).
  shared_memory_size: number | string;

  // Shows the number of huge pages needed for the main shared memory area.
  shared_memory_size_in_huge_pages: number | string;

  // Selects the shared memory implementation used for the main shared memory region.
  shared_memory_type: string;

  // Lists shared libraries to preload into server.
  shared_preload_libraries: string;

  // Enables SSL connections.
  ssl: boolean | string;

  // Location of the SSL certificate authority file.
  ssl_ca_file: string;

  // Location of the SSL server certificate file.
  ssl_cert_file: string;

  // Sets the list of allowed SSL ciphers.
  ssl_ciphers: string;

  // Location of the SSL certificate revocation list directory.
  ssl_crl_dir: string;

  // Location of the SSL certificate revocation list file.
  ssl_crl_file: string;

  // Location of the SSL DH parameters file.
  ssl_dh_params_file: string;

  // Sets the curve to use for ECDH.
  ssl_ecdh_curve: string;

  // Location of the SSL server private key file.
  ssl_key_file: string;

  // Shows the name of the SSL library.
  ssl_library: string;

  // Sets the maximum SSL/TLS protocol version to use.
  ssl_max_protocol_version: string;

  // Sets the minimum SSL/TLS protocol version to use.
  ssl_min_protocol_version: string;

  // Command to obtain passphrases for SSL.
  ssl_passphrase_command: string;

  // Controls whether "ssl_passphrase_command" is called during server reload.
  ssl_passphrase_command_supports_reload: boolean | string;

  // Give priority to server ciphersuite order.
  ssl_prefer_server_ciphers: boolean | string;

  // Causes '...' strings to treat backslashes literally.
  standard_conforming_strings: boolean | string;

  // Sets the maximum allowed duration of any statement.
  statement_timeout: number | string;

  // Sets the consistency of accesses to statistics data.
  stats_fetch_consistency: string;

  // Sets the size of the dedicated buffer pool used for the subtransaction cache.
  subtransaction_buffers: number | string;

  // Starts the WAL summarizer process to enable incremental backup.
  summarize_wal: boolean | string;

  // Sets the number of connection slots reserved for superusers.
  superuser_reserved_connections: number | string;

  // Enables a physical standby to synchronize logical failover replication slots from the primary server.
  sync_replication_slots: boolean | string;

  // Enable synchronized sequential scans.
  synchronize_seqscans: boolean | string;

  // Lists streaming replication standby server replication slot names that logical WAL sender processes will wait for.
  synchronized_standby_slots: string;

  // Sets the current transaction's synchronization level.
  synchronous_commit: string;

  // Number of synchronous standbys and list of names of potential synchronous ones.
  synchronous_standby_names: string;

  // Sets the syslog "facility" to be used when syslog enabled.
  syslog_facility: string;

  // Sets the program name used to identify PostgreSQL messages in syslog.
  syslog_ident: string;

  // Add sequence number to syslog messages to avoid duplicate suppression.
  syslog_sequence_numbers: boolean | string;

  // Split messages sent to syslog by lines and to fit into 1024 bytes.
  syslog_split_messages: boolean | string;

  // Maximum number of TCP keepalive retransmits.
  tcp_keepalives_count: number | string;

  // Time between issuing TCP keepalives.
  tcp_keepalives_idle: number | string;

  // Time between TCP keepalive retransmits.
  tcp_keepalives_interval: number | string;

  // TCP user timeout.
  tcp_user_timeout: number | string;

  // Sets the maximum number of temporary buffers used by each session.
  temp_buffers: number | string;

  // Limits the total size of all temporary files used by each process.
  temp_file_limit: number | string;

  // Sets the tablespace(s) to use for temporary tables and sort files.
  temp_tablespaces: string;

  // Sets the time zone for displaying and interpreting time stamps.
  TimeZone: string;

  // Selects a file of time zone abbreviations.
  timezone_abbreviations: string;

  // Logs details of pre-authentication connection handshake.
  trace_connection_negotiation: boolean | string;

  // Generates debugging output for LISTEN and NOTIFY.
  trace_notify: boolean | string;

  // Emit information about resource usage in sorting.
  trace_sort: boolean | string;

  // Collects information about executing commands.
  track_activities: boolean | string;

  // Sets the size reserved for pg_stat_activity.query, in bytes.
  track_activity_query_size: number | string;

  // Collects transaction commit time.
  track_commit_timestamp: boolean | string;

  // Collects statistics on database activity.
  track_counts: boolean | string;

  // Collects function-level statistics on database activity.
  track_functions: string;

  // Collects timing statistics for database I/O activity.
  track_io_timing: boolean | string;

  // Collects timing statistics for WAL I/O activity.
  track_wal_io_timing: boolean | string;

  // Sets the size of the dedicated buffer pool used for the transaction status cache.
  transaction_buffers: number | string;

  // Whether to defer a read-only serializable transaction until it can be executed with no possible serialization failures.
  transaction_deferrable: boolean | string;

  // Sets the current transaction's isolation level.
  transaction_isolation: string;

  // Sets the current transaction's read-only status.
  transaction_read_only: boolean | string;

  // Sets the maximum allowed duration of any transaction within a session (not a prepared transaction).
  transaction_timeout: number | string;

  // Treats "expr=NULL" as "expr IS NULL".
  transform_null_equals: boolean | string;

  // Sets the directories where Unix-domain sockets will be created.
  unix_socket_directories: string;

  // Sets the owning group of the Unix-domain socket.
  unix_socket_group: string;

  // Sets the access permissions of the Unix-domain socket.
  unix_socket_permissions: number | string;

  // Updates the process title to show the active SQL command.
  update_process_title: boolean | string;

  // Sets the buffer pool size for VACUUM, ANALYZE, and autovacuum.
  vacuum_buffer_usage_limit: number | string;

  // Vacuum cost delay in milliseconds.
  vacuum_cost_delay: number | string;

  // Vacuum cost amount available before napping.
  vacuum_cost_limit: number | string;

  // Vacuum cost for a page dirtied by vacuum.
  vacuum_cost_page_dirty: number | string;

  // Vacuum cost for a page found in the buffer cache.
  vacuum_cost_page_hit: number | string;

  // Vacuum cost for a page not found in the buffer cache.
  vacuum_cost_page_miss: number | string;

  // Age at which VACUUM should trigger failsafe to avoid a wraparound outage.
  vacuum_failsafe_age: number | string;

  // Minimum age at which VACUUM should freeze a table row.
  vacuum_freeze_min_age: number | string;

  // Age at which VACUUM should scan whole table to freeze tuples.
  vacuum_freeze_table_age: number | string;

  // Multixact age at which VACUUM should trigger failsafe to avoid a wraparound outage.
  vacuum_multixact_failsafe_age: number | string;

  // Minimum age at which VACUUM should freeze a MultiXactId in a table row.
  vacuum_multixact_freeze_min_age: number | string;

  // Multixact age at which VACUUM should scan whole table to freeze tuples.
  vacuum_multixact_freeze_table_age: number | string;

  // Shows the block size in the write ahead log.
  wal_block_size: number | string;

  // Sets the number of disk-page buffers in shared memory for WAL.
  wal_buffers: number | string;

  // Compresses full-page writes written in WAL file with specified method.
  wal_compression: string;

  // Sets the WAL resource managers for which WAL consistency checks are done.
  wal_consistency_checking: string;

  // Buffer size for reading ahead in the WAL during recovery.
  wal_decode_buffer_size: number | string;

  // Writes zeroes to new WAL files before first use.
  wal_init_zero: boolean | string;

  // Sets the size of WAL files held for standby servers.
  wal_keep_size: number | string;

  // Sets the level of information written to the WAL.
  wal_level: string;

  // Writes full pages to WAL when first modified after a checkpoint, even for a non-critical modification.
  wal_log_hints: boolean | string;

  // Sets whether a WAL receiver should create a temporary replication slot if no permanent slot is configured.
  wal_receiver_create_temp_slot: boolean | string;

  // Sets the maximum interval between WAL receiver status reports to the sending server.
  wal_receiver_status_interval: number | string;

  // Sets the maximum wait time to receive data from the sending server.
  wal_receiver_timeout: number | string;

  // Recycles WAL files by renaming them.
  wal_recycle: boolean | string;

  // Sets the time to wait before retrying to retrieve WAL after a failed attempt.
  wal_retrieve_retry_interval: number | string;

  // Shows the size of write ahead log segments.
  wal_segment_size: number | string;

  // Sets the maximum time to wait for WAL replication.
  wal_sender_timeout: number | string;

  // Minimum size of new file to fsync instead of writing WAL.
  wal_skip_threshold: number | string;

  // Time for which WAL summary files should be kept.
  wal_summary_keep_time: number | string;

  // Selects the method used for forcing WAL updates to disk.
  wal_sync_method: string;

  // Time between WAL flushes performed in the WAL writer.
  wal_writer_delay: number | string;

  // Amount of WAL written out by WAL writer that triggers a flush.
  wal_writer_flush_after: number | string;

  // Sets the maximum memory to be used for query workspaces.
  work_mem: number | string;

  // Sets how binary values are to be encoded in XML.
  xmlbinary: string;

  // Sets whether XML data in implicit parsing and serialization operations is to be considered as documents or content fragments.
  xmloption: string;

  // Continues processing past damaged page headers.
  zero_damaged_pages: boolean | string;
};

// Contents of this type are generated from pg_settings view on Postgres 17.1 using this SQL:
/*

WITH data AS (
  SELECT 
    name,  
    short_desc,
    CASE
      WHEN vartype = 'integer' OR vartype = 'real' THEN 'number | string'
      WHEN vartype = 'bool' THEN 'boolean | string'
      ELSE 'string'
    END as vartype
  FROM pg_settings
)

SELECT
  STRING_AGG(FORMAT(E'// %s\n%s: %s; ', short_desc, name, vartype), E'\n\n')
FROM data

*/
