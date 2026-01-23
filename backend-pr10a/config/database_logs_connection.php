<?php

/**
 * PR-10A: Adicionar esta conexão ao config/database.php existente
 * 
 * INSTRUÇÕES:
 * 1. Abrir: C:\projeto\Versao-tarkan-Jesse\back-end\config\database.php
 * 2. Localizar array 'connections' => [...]
 * 3. Adicionar esta conexão 'logs' APÓS 'mysql_traccar'
 * 4. Atualizar .env com as variáveis LOGS_DB_*
 */

return [
    'logs' => [
        'driver' => 'mysql',
        'host' => env('LOGS_DB_HOST', '127.0.0.1'),
        'port' => env('LOGS_DB_PORT', '3306'),
        'database' => env('LOGS_DB_DATABASE', 'tarkan_logs'),
        'username' => env('LOGS_DB_USERNAME', 'root'),
        'password' => env('LOGS_DB_PASSWORD', ''),
        'unix_socket' => env('DB_SOCKET', ''),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix' => '',
        'prefix_indexes' => true,
        'strict' => true,
        'engine' => 'InnoDB',
        'options' => extension_loaded('pdo_mysql') ? array_filter([
            PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
        ]) : [],
    ],
];
