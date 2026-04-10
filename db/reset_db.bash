$(> db/docs.sqlite)
cat db/migrate.sql | sqlite3 db/docs.sqlite
cat db/add_create_by_and_last_changed_to_files.sql | sqlite3 db/docs.sqlite
cat db/seed.sql | sqlite3 db/docs.sqlite