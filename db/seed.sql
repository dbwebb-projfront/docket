INSERT INTO projects (uid, name) VALUES ("fb5a74fe51f39e0df0f928d7cd98445b", "Starter project");
INSERT INTO projects (uid, name) VALUES ("fb5a74ef51f39e0df0f928d7cd98445b", "Starter project 2");

INSERT INTO user_projects (email, api_key, uid) VALUES ("efo@bth.se", "b07226d9fdf3c66c3ee1d6f0dbfb8409", "fb5a74fe51f39e0df0f928d7cd98445b");
INSERT INTO user_projects (email, api_key, uid) VALUES ("efo@bth.se", "fb5a74ef51f39e0df0f928d7cd98445b", "fb5a74ef51f39e0df0f928d7cd98445b");

INSERT INTO files (filename, uid, project_uid, content) VALUES ("main.js", "ab5a74fe51f39e0df0f928d7cd98445b", "fb5a74fe51f39e0df0f928d7cd98445b", "console.log('docket')");
INSERT INTO files (filename, uid, project_uid, content) VALUES ("index.html", "po7a74fe51f39e0df0f928d7cd98445b", "fb5a74fe51f39e0df0f928d7cd98445b", '<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <title>Lager-Components</title>

  <link rel="stylesheet" href="style.css" />
  <script type="module" src="src/main.js" defer></script>
</head>
<body>
</body>
</html>');