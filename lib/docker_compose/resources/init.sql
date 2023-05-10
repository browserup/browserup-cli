CREATE DATABASE browserup_test;

GRANT ALL PRIVILEGES ON browserup_test.* TO 'browserup_cli_creator.mjs'@'%' WITH GRANT OPTION;

FLUSH PRIVILEGES;
