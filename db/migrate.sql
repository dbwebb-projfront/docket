CREATE TABLE IF NOT EXISTS projects (
  uid TEXT NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_projects (
  email TEXT NOT NULL,
  api_key TEXT NOT NULL,
  uid TEXT NOT NULL,
  FOREIGN KEY(uid) REFERENCES projects(uid)
);

CREATE TABLE IF NOT EXISTS files (
  filename TEXT NOT NULL,
  uid TEXT NOT NULL,
  parent_file INTEGER DEFAULT NULL,
  content TEXT,
  FOREIGN KEY(uid) REFERENCES projects(uid)
);
