# docket

## API Notes

### `DELETE /projects/remove_user`

Removes a user from a project.

Request body:

```json
{
  "uid": "<project uid>",
  "email": "user@example.com"
}
```

Success responses:

- `200 OK` when the user was removed:

```json
{
  "data": {
    "message": "User user@example.com removed from project",
    "removed": true
  }
}
```

- `200 OK` when the user was not part of the project:

```json
{
  "data": {
    "message": "User user@example.com not part of project",
    "removed": false,
    "status": 200
  }
}
```
