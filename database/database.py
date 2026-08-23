import sqlite3
from config.config import config
import json
from datetime import datetime
import hashlib

AUTH_SALT = "tmc_yellow_box_salt_2026"

def hash_password(password: str) -> str:
    """Hash password securely using SHA-256 with static application salt."""
    if not password:
        return ""
    return hashlib.sha256(f"{AUTH_SALT}_{password}".encode('utf-8')).hexdigest()

# Determine DATABASE_PATH from config (supports dict or module), fallback to 'database.db'
if isinstance(config, dict):
    DATABASE_PATH = config.get('DATABASE_PATH', 'database.db')
else:
    DATABASE_PATH = getattr(config, 'DATABASE_PATH', 'database.db')


class Database:
    def __init__(self, db_path=None):
        # allow overriding path for tests or runtime
        path = db_path or DATABASE_PATH
        self.conn = sqlite3.connect(path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row  # Enable column access by name
        self.migrate_schema()
        self.create_tables()
        self.initialize_defaults()

    def migrate_schema(self):
        """Migrate from old schema to new schema if needed."""
        try:
            cursor = self.conn.execute("PRAGMA table_info(violations)")
            columns = {row[1] for row in cursor.fetchall()}
            
            # Migrate from very old schema
            if 'timestamp' in columns and 'violation_timestamp' not in columns:
                print("Detected old database schema. Migrating...")
                try:
                    self.conn.execute("ALTER TABLE violations RENAME TO violations_old")
                    self.conn.commit()
                    print("Old violations table backed up as violations_old")
                except Exception as e:
                    print(f"Note: {e}")
                    self.conn.rollback()

            # Add plate_number column if it doesn't exist yet
            if columns and 'plate_number' not in columns:
                try:
                    self.conn.execute("ALTER TABLE violations ADD COLUMN plate_number TEXT DEFAULT NULL")
                    self.conn.commit()
                    print("✓ Migrated: Added plate_number column to violations table.")
                except Exception as e:
                    print(f"Note: plate_number migration: {e}")
                    self.conn.rollback()

            # Add location column if it doesn't exist yet
            if columns and 'location' not in columns:
                try:
                    self.conn.execute("ALTER TABLE violations ADD COLUMN location TEXT DEFAULT 'Sayre Highway - Fortich St., Malaybalay City'")
                    self.conn.commit()
                    print("✓ Migrated: Added location column to violations table.")
                except Exception as e:
                    print(f"Note: location migration: {e}")
                    self.conn.rollback()

            # Add vehicle_color column if it doesn't exist yet
            if columns and 'vehicle_color' not in columns:
                try:
                    self.conn.execute("ALTER TABLE violations ADD COLUMN vehicle_color TEXT DEFAULT 'Standard'")
                    self.conn.commit()
                    print("✓ Migrated: Added vehicle_color column to violations table.")
                except Exception as e:
                    print(f"Note: vehicle_color migration: {e}")
                    self.conn.rollback()
        except Exception:
            pass

    def create_tables(self):
        """Create all necessary database tables."""
        
        try:
            # Vehicle types lookup table
            self.conn.execute('''
            CREATE TABLE IF NOT EXISTS vehicle_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type_name TEXT NOT NULL UNIQUE,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            # Monitoring zones
            self.conn.execute('''
            CREATE TABLE IF NOT EXISTS zones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                zone_name TEXT NOT NULL,
                coordinates TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            # Main violations table
            self.conn.execute('''
            CREATE TABLE IF NOT EXISTS violations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                violation_timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                detection_id TEXT UNIQUE,
                vehicle_type_id INTEGER,
                zone_id INTEGER DEFAULT 1,
                stop_duration REAL,
                plate_number TEXT DEFAULT NULL,
                location TEXT DEFAULT 'Sayre Highway - Fortich St., Malaybalay City',
                vehicle_color TEXT DEFAULT 'Standard',
                image_path TEXT,
                image_blob BLOB,
                confidence REAL DEFAULT 0.0,
                notes TEXT,
                reviewed BOOLEAN DEFAULT 0,
                status TEXT DEFAULT 'recorded',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id),
                FOREIGN KEY (zone_id) REFERENCES zones(id)
            )
            ''')
            
            # Detection history (optional, for detailed tracking)
            self.conn.execute('''
            CREATE TABLE IF NOT EXISTS detection_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                frame_id TEXT,
                tracking_id INTEGER,
                vehicle_type_id INTEGER,
                zone_id INTEGER,
                centroid_x INTEGER,
                centroid_y INTEGER,
                confidence REAL,
                is_in_zone BOOLEAN,
                is_stopped BOOLEAN,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id),
                FOREIGN KEY (zone_id) REFERENCES zones(id)
            )
            ''')
            
            # Statistics table for reporting
            self.conn.execute('''
            CREATE TABLE IF NOT EXISTS statistics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL UNIQUE,
                total_violations INTEGER DEFAULT 0,
                violations_by_type TEXT,
                peak_hour INTEGER,
                total_vehicles_detected INTEGER DEFAULT 0,
                system_uptime_minutes INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            ''')

            # Role-Based Users table
            self.conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'officer',
                full_name TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            self.conn.commit()
            
            # Create indexes for common queries (after tables are committed)
            try:
                self.conn.execute('CREATE INDEX IF NOT EXISTS idx_violations_timestamp ON violations(violation_timestamp)')
                self.conn.execute('CREATE INDEX IF NOT EXISTS idx_violations_vehicle_type ON violations(vehicle_type_id)')
                self.conn.execute('CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status)')
                self.conn.execute('CREATE INDEX IF NOT EXISTS idx_detection_tracking_id ON detection_history(tracking_id)')
                self.conn.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
                self.conn.commit()
            except Exception as idx_error:
                print(f"Warning: Index creation failed (non-critical): {idx_error}")
                self.conn.rollback()
                
        except Exception as e:
            print(f"Error creating database tables: {e}")
            self.conn.rollback()
            raise

    def initialize_defaults(self):
        """Initialize default vehicle types, zones, and seeded users."""
        
        # Add default vehicle types if they don't exist
        vehicle_types = ['car', 'truck', 'bus', 'motorcycle']
        for vtype in vehicle_types:
            try:
                self.conn.execute(
                    'INSERT INTO vehicle_types (type_name) VALUES (?)',
                    (vtype,)
                )
            except sqlite3.IntegrityError:
                pass  # Already exists
        
        # Add default zone if it doesn't exist
        try:
            self.conn.execute('''
            INSERT INTO zones (zone_name, coordinates, is_active)
            VALUES (?, ?, ?)
            ''', ('Yellow Box Zone - Main', '[]', 1))
        except sqlite3.IntegrityError:
            pass  # Already exists

        # Seed default role-based user accounts
        default_users = [
            ('admin', 'admin123', 'admin', 'System Administrator'),
            ('officer', 'officer123', 'officer', 'TMC Traffic Officer'),
            ('superadmin123', 'superadmin@123', 'admin', 'TMC Chief Administrator'),
        ]
        # Clean up legacy analyst account if present
        try:
            self.conn.execute("DELETE FROM users WHERE username = 'analyst'")
        except Exception:
            pass

        for username, password, role, full_name in default_users:
            try:
                self.conn.execute('''
                INSERT INTO users (username, password_hash, role, full_name)
                VALUES (?, ?, ?, ?)
                ''', (username, hash_password(password), role, full_name))
            except sqlite3.IntegrityError:
                # Update password hash if user exists
                self.conn.execute('''
                UPDATE users SET password_hash = ?, role = ?, full_name = ? WHERE username = ?
                ''', (hash_password(password), role, full_name, username))
        
        self.conn.commit()

    def get_vehicle_type_id(self, vehicle_type_name):
        """Get vehicle type ID from name."""
        cursor = self.conn.execute(
            'SELECT id FROM vehicle_types WHERE type_name = ?',
            (vehicle_type_name.lower(),)
        )
        row = cursor.fetchone()
        return row[0] if row else None

    def insert_violation(self, vehicle_type, timestamp, image_path, image_blob=None,
                        detection_id=None, stop_duration=None, confidence=0.0,
                        notes=None, zone_id=1, plate_number=None,
                        location="Sayre Highway - Fortich St., Malaybalay City",
                        vehicle_color="Standard"):
        vehicle_type_id = self.get_vehicle_type_id(vehicle_type)
        
        query = '''
        INSERT INTO violations 
        (vehicle_type_id, violation_timestamp, image_path, image_blob, 
         detection_id, stop_duration, confidence, notes, zone_id, plate_number, location, vehicle_color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''
        self.conn.execute(query, (
            vehicle_type_id, timestamp, image_path, image_blob,
            detection_id, stop_duration, confidence, notes, zone_id, plate_number, location, vehicle_color
        ))
        self.conn.commit()

    def get_all_violations(self):
        """Get all violations ordered by timestamp (newest first)."""
        query = '''
        SELECT v.id, v.violation_timestamp as timestamp, vt.type_name as label, 
               v.image_path, v.stop_duration, v.confidence, v.status, v.plate_number,
               COALESCE(v.location, 'Sayre Highway - Fortich St., Malaybalay City') as location,
               COALESCE(v.vehicle_color, 'Standard') as vehicle_color
        FROM violations v
        LEFT JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
        ORDER BY v.violation_timestamp DESC
        '''
        cursor = self.conn.execute(query)
        return cursor.fetchall()

    def get_violations_by_range(self, start_date, end_date):
        """Get violations within a date range (inclusive). Dates formatted as YYYY-MM-DD."""
        query = '''
        SELECT v.id, v.violation_timestamp as timestamp, vt.type_name as label, 
               v.image_path, v.stop_duration, v.confidence, v.status, v.plate_number,
               COALESCE(v.location, 'Sayre Highway - Fortich St., Malaybalay City') as location,
               COALESCE(v.vehicle_color, 'Standard') as vehicle_color
        FROM violations v
        LEFT JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
        WHERE DATE(v.violation_timestamp) BETWEEN ? AND ?
        ORDER BY v.violation_timestamp DESC
        '''
        cursor = self.conn.execute(query, (start_date, end_date))
        return cursor.fetchall()

    def get_violations_by_date(self, date):
        """Get violations for a specific date (YYYY-MM-DD)."""
        query = '''
        SELECT v.id, v.violation_timestamp as timestamp, vt.type_name as label,
               v.image_path, v.stop_duration, v.confidence, v.status, v.plate_number,
               COALESCE(v.location, 'Sayre Highway - Fortich St., Malaybalay City') as location,
               COALESCE(v.vehicle_color, 'Standard') as vehicle_color
        FROM violations v
        LEFT JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
        WHERE DATE(v.violation_timestamp) = ?
        ORDER BY v.violation_timestamp DESC
        '''
        cursor = self.conn.execute(query, (date,))
        return cursor.fetchall()

    def get_violations_by_vehicle_type(self, vehicle_type, limit=None):
        """Get all violations of a specific vehicle type."""
        vehicle_type_id = self.get_vehicle_type_id(vehicle_type)
        if not vehicle_type_id:
            return []
        
        query = '''
        SELECT v.id, v.violation_timestamp as timestamp, vt.type_name as label,
               v.image_path, v.stop_duration, v.confidence, v.status, v.plate_number,
               COALESCE(v.location, 'Sayre Highway - Fortich St., Malaybalay City') as location,
               COALESCE(v.vehicle_color, 'Standard') as vehicle_color
        FROM violations v
        LEFT JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
        WHERE v.vehicle_type_id = ?
        ORDER BY v.violation_timestamp DESC
        '''
        if limit:
            query += f' LIMIT {limit}'
        
        cursor = self.conn.execute(query, (vehicle_type_id,))
        return cursor.fetchall()

    def get_violation_by_id(self, violation_id):
        """Get a specific violation by ID."""
        query = '''
        SELECT v.id, v.violation_timestamp as timestamp, vt.type_name as label,
               v.image_path, v.image_blob, v.stop_duration, v.confidence, 
               v.status, v.notes, v.plate_number,
               COALESCE(v.location, 'Sayre Highway - Fortich St., Malaybalay City') as location,
               COALESCE(v.vehicle_color, 'Standard') as vehicle_color
        FROM violations v
        LEFT JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
        WHERE v.id = ?
        '''
        cursor = self.conn.execute(query, (violation_id,))
        return cursor.fetchone()

    def update_violation_status(self, violation_id, status, notes=None):
        """Update violation status (recorded, reviewed, processed, dismissed)."""
        query = '''
        UPDATE violations
        SET status = ?, notes = ?, reviewed = 1
        WHERE id = ?
        '''
        self.conn.execute(query, (status, notes, violation_id))
        self.conn.commit()

    def get_statistics(self, date):
        """Get or create statistics for a date."""
        query = 'SELECT * FROM statistics WHERE date = ?'
        cursor = self.conn.execute(query, (date,))
        return cursor.fetchone()

    def count_violations_by_type(self, start_date=None, end_date=None):
        """Count violations grouped by vehicle type for date range or all time."""
        if start_date and end_date:
            query = '''
            SELECT vt.type_name, COUNT(*) as count
            FROM violations v
            LEFT JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
            WHERE DATE(v.violation_timestamp) BETWEEN ? AND ?
            GROUP BY v.vehicle_type_id
            '''
            cursor = self.conn.execute(query, (start_date, end_date))
        elif start_date:
            query = '''
            SELECT vt.type_name, COUNT(*) as count
            FROM violations v
            LEFT JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
            WHERE DATE(v.violation_timestamp) = ?
            GROUP BY v.vehicle_type_id
            '''
            cursor = self.conn.execute(query, (start_date,))
        else:
            query = '''
            SELECT vt.type_name, COUNT(*) as count
            FROM violations v
            LEFT JOIN vehicle_types vt ON v.vehicle_type_id = vt.id
            GROUP BY v.vehicle_type_id
            '''
            cursor = self.conn.execute(query)
        
        return cursor.fetchall()

    def get_daily_trend(self, limit=7, start_date=None, end_date=None):
        """Get violation counts for date range or last N days."""
        if start_date and end_date:
            query = '''
            SELECT DATE(violation_timestamp) as date, COUNT(*) as count
            FROM violations
            WHERE DATE(violation_timestamp) BETWEEN ? AND ?
            GROUP BY DATE(violation_timestamp)
            ORDER BY date DESC
            '''
            cursor = self.conn.execute(query, (start_date, end_date))
        else:
            query = '''
            SELECT DATE(violation_timestamp) as date, COUNT(*) as count
            FROM violations
            GROUP BY DATE(violation_timestamp)
            ORDER BY date DESC
            LIMIT ?
            '''
            cursor = self.conn.execute(query, (limit,))
        return cursor.fetchall()

    def record_detection(self, tracking_id, vehicle_type, centroid_x, centroid_y,
                        confidence, is_in_zone, is_stopped, frame_id=None, zone_id=1):
        """
        Record a vehicle detection for analytics (optional).
        
        Args:
            tracking_id (int): YOLOv8 object tracking ID
            vehicle_type (str): Type of vehicle
            centroid_x (int): X coordinate of vehicle center
            centroid_y (int): Y coordinate of vehicle center
            confidence (float): Detection confidence
            is_in_zone (bool): Whether vehicle is in monitored zone
            is_stopped (bool): Whether vehicle appears stopped
            frame_id (str): Optional frame identifier
            zone_id (int): Zone ID (default: 1)
        """
        vehicle_type_id = self.get_vehicle_type_id(vehicle_type)
        
        query = '''
        INSERT INTO detection_history
        (tracking_id, vehicle_type_id, centroid_x, centroid_y, confidence,
         is_in_zone, is_stopped, frame_id, zone_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        '''
        self.conn.execute(query, (
            tracking_id, vehicle_type_id, centroid_x, centroid_y, confidence,
            is_in_zone, is_stopped, frame_id, zone_id
        ))
        self.conn.commit()

    def authenticate_user(self, username, password):
        """
        Authenticate a user by username and plaintext password.
        Returns user dictionary if valid, None otherwise.
        """
        if not username or not password:
            return None
        
        pwd_hash = hash_password(password)
        cursor = self.conn.execute('''
            SELECT id, username, role, full_name, created_at
            FROM users
            WHERE username = ? AND password_hash = ?
        ''', (username.strip(), pwd_hash))
        row = cursor.fetchone()
        if row:
            return {
                'id': row['id'],
                'username': row['username'],
                'role': row['role'],
                'full_name': row['full_name'],
                'created_at': row['created_at']
            }
        return None

    def get_user_by_username(self, username):
        """Fetch user by username without password hash."""
        cursor = self.conn.execute('''
            SELECT id, username, role, full_name, created_at
            FROM users
            WHERE username = ?
        ''', (username.strip(),))
        row = cursor.fetchone()
        if row:
            return {
                'id': row['id'],
                'username': row['username'],
                'role': row['role'],
                'full_name': row['full_name'],
                'created_at': row['created_at']
            }
        return None

    def get_user_by_id(self, user_id):
        """Fetch user by id without password hash."""
        cursor = self.conn.execute('''
            SELECT id, username, role, full_name, created_at
            FROM users
            WHERE id = ?
        ''', (user_id,))
        row = cursor.fetchone()
        if row:
            return {
                'id': row['id'],
                'username': row['username'],
                'role': row['role'],
                'full_name': row['full_name'],
                'created_at': row['created_at']
            }
        return None

    def list_users(self):
        """List all registered users."""
        cursor = self.conn.execute('''
            SELECT id, username, role, full_name, created_at
            FROM users
            ORDER BY id ASC
        ''')
        rows = cursor.fetchall()
        return [
            {
                'id': r['id'],
                'username': r['username'],
                'role': r['role'],
                'full_name': r['full_name'],
                'created_at': r['created_at']
            }
            for r in rows
        ]

    def create_user(self, username, password, role='officer', full_name=''):
        """Create a new role-based user."""
        try:
            cursor = self.conn.execute('''
                INSERT INTO users (username, password_hash, role, full_name)
                VALUES (?, ?, ?, ?)
            ''', (username.strip(), hash_password(password), role, full_name or username))
            self.conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()

