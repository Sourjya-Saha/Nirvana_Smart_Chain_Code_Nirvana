import hashlib

def log_in(connection, username, password, expected_user_type=None):
    cursor = connection.cursor()

    # Hash the entered password to match it with the stored one
    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    # SQL query to find the user
    log_in_query = "SELECT generated_unique_id, user_id, password, user_type FROM users WHERE user_id = %s AND password = %s"
    log_in_data = (username, hashed_password)

    cursor.execute(log_in_query, log_in_data)
    user = cursor.fetchone()

    cursor.close()

    if user:
        # user can be tuple or dict depending on cursor type
        if isinstance(user, dict):
            unique_id = user.get('generated_unique_id')
            actual_user_type = (user.get('user_type') or '').strip()
        else:
            unique_id = user[0]
            actual_user_type = (user[3] or '').strip() if len(user) > 3 else ''

        # If a specific user_type portal was targeted, enforce that the user's role matches
        if expected_user_type:
            exp = expected_user_type.strip().lower()
            act = actual_user_type.lower()
            if act and act != exp:
                portal_label = expected_user_type.strip().capitalize()
                actual_label = actual_user_type.strip().capitalize()
                return {
                    'status': 'failure',
                    'message': f"Access Denied: Account '{username}' is registered as a {actual_label}, not a {portal_label}. Please sign in via the {actual_label} portal."
                }

        # Return the unique user ID, user_type, and success status
        return {
            'status': 'success',
            'unique_user_id': unique_id,
            'user_type': actual_user_type
        }
    else:
        # Return an error message if login fails
        return {'status': 'failure', 'message': 'Error: Incorrect username or password.'}
