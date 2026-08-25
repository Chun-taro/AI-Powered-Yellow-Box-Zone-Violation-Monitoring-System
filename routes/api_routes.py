from flask import Blueprint, jsonify
from database.database import Database

api_bp = Blueprint('api', __name__)

@api_bp.route('/violations')
def get_violations():
    from flask import request
    db = Database()
    
    start_date = request.args.get('start')
    end_date = request.args.get('end')
    
    if start_date and end_date:
        raw_violations = db.get_violations_by_range(start_date, end_date)
    else:
        raw_violations = db.get_all_violations()
        
    db.close()
    
    # Convert sqlite3.Row objects to dictionaries for JSON serialization
    violations = [dict(row) for row in raw_violations]
    return jsonify(violations)

@api_bp.route('/zone', methods=['POST'])
def save_zone():
    from flask import request
    from config.config import config
    
    data = request.json
    if not data or 'zone' not in data:
        return jsonify({'error': 'No zone data provided'}), 400
    
    zone_coords = data['zone']
    # Validate structure (list of 4 points)
    if not isinstance(zone_coords, list) or len(zone_coords) != 4:
         return jsonify({'error': 'Zone must be 4 points'}), 400

    if config.save_zone_config(zone_coords):
        return jsonify({'success': True, 'message': 'Zone updated'})
    else:
        return jsonify({'error': 'Failed to save zone'}), 500

@api_bp.route('/zone', methods=['GET'])
def get_zone():
    from config.config import config
    return jsonify(config.YELLOW_BOX_ZONE)

@api_bp.route('/hardware/scan', methods=['GET'])
def get_hardware_scan():
    from utils.hardware_scanner import scan_hardware
    try:
        report = scan_hardware()
        return jsonify(report)
    except Exception as e:
        return jsonify({'error': f'Failed to perform hardware scan: {str(e)}'}), 500

@api_bp.route('/settings/lpr', methods=['GET', 'POST', 'OPTIONS'])
def handle_lpr_settings():
    from flask import request
    from config.config import config
    if request.method == 'POST':
        data = request.json or {}
        if 'enabled' not in data:
            return jsonify({'error': 'Missing "enabled" boolean field'}), 400

        enabled = bool(data['enabled'])
        config.LPR_ENABLED = enabled
        return jsonify({
            'success': True,
            'message': f"LPR has been {'enabled' if enabled else 'disabled'}",
            'lpr_enabled': config.LPR_ENABLED
        })
    
    # GET or OPTIONS
    return jsonify({
        'success': True,
        'lpr_enabled': getattr(config, 'LPR_ENABLED', True)
    })


