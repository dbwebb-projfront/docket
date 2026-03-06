$(> db/docs.sqlite)
cat db/migrate.sql | sqlite3 db/docs.sqlite
cat db/seed.sql | sqlite3 db/docs.sqlite