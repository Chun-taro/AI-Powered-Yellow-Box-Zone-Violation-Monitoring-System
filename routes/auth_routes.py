from flask import Blueprint, request, jsonify
from database.database import Database
import hashlib
import time

auth_bp = Blueprint('auth', __name__)
db = Database()

ROLE_PERMISSIONS = {
    'admin': {
        'title': 'Super Administrator',
        'badge_color': 'from-amber-500 to-yellow-400',
        'permissions': ['all', 'zone_setup', 'camera_control', 'system_compatibility', 'logs', 'reports', 'evaluation', 'user_management'],
        'description': 'Full system control, zone geometry calibration, camera management, and system diagnostics.'
    },
    'officer': {
        'title': 'TMC Traffic Officer',
        'badge_color': 'from-blue-500 to-cyan-400',
        'permissions': ['dashboard', 'logs', 'reports', 'evaluation', 'evidence_review'],
        'description': 'Live traffic monitoring, violation review, NCAP evidence verification, and reporting.'
    }
}

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user credentials and return user role + session token."""
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password are required.'}), 400

    user = db.authenticate_user(username, password)
    if not user:
        return jsonify({'success': False, 'error': 'Invalid username or password.'}), 401

    # Generate a lightweight session token
    role = user['role']
    timestamp = int(time.time())
    token = f"tmc_{user['id']}_{role}_{timestamp}"

    return jsonify({
        'success': True,
        'message': f'Welcome, {user["full_name"]}!',
        'user': {
            'id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'full_name': user['full_name'],
            'role_info': ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS['officer'])
        },
        'token': token
    })

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Fetch current user info based on token or username param."""
    token = request.headers.get('Authorization', '')
    if token.startswith('Bearer '):
        token = token[7:]
    
    # Check if username is passed in query or token
    username = request.args.get('username')
    if not username and token.startswith('tmc_'):
        parts = token.split('_')
        if len(parts) >= 3:
            try:
                user_id = int(parts[1])
                user = db.get_user_by_id(user_id)
                if user:
                    return jsonify({
                        'success': True,
                        'user': {
                            **user,
                            'role_info': ROLE_PERMISSIONS.get(user['role'], ROLE_PERMISSIONS['officer'])
                        }
                    })
            except Exception:
                pass

    if username:
        user = db.get_user_by_username(username)
        if user:
            return jsonify({
                'success': True,
                'user': {
                    **user,
                    'role_info': ROLE_PERMISSIONS.get(user['role'], ROLE_PERMISSIONS['officer'])
                }
            })

    # Default fallback for legacy superadmin
    return jsonify({
        'success': True,
        'user': {
            'id': 1,
            'username': 'admin',
            'role': 'admin',
            'full_name': 'System Administrator',
            'role_info': ROLE_PERMISSIONS['admin']
        }
    })

@auth_bp.route('/roles', methods=['GET'])
def get_roles():
    """Return role definitions and access permissions."""
    return jsonify({
        'success': True,
        'roles': ROLE_PERMISSIONS
    })

@auth_bp.route('/users', methods=['GET'])
def list_all_users():
    """List registered users."""
    users = db.list_users()
    for u in users:
        u['role_info'] = ROLE_PERMISSIONS.get(u['role'], ROLE_PERMISSIONS['officer'])
    return jsonify({
        'success': True,
        'users': users
    })

@auth_bp.route('/users', methods=['POST'])
def create_new_user():
    """Register a new user (admin-controlled)."""
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    role = data.get('role', 'officer').strip().lower()
    full_name = data.get('full_name', '').strip()

    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password are required.'}), 400

    if role not in ROLE_PERMISSIONS:
        return jsonify({'success': False, 'error': f'Invalid role. Must be one of {list(ROLE_PERMISSIONS.keys())}'}), 400

    user_id = db.create_user(username, password, role, full_name)
    if not user_id:
        return jsonify({'success': False, 'error': 'Username already exists.'}), 409

    return jsonify({
        'success': True,
        'message': f'User {username} created successfully.',
        'user_id': user_id
    }), 201
