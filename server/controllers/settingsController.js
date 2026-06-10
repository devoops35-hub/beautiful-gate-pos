const { dbGet, dbRun, dbAll } = require('../config/supabase');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res) => {
  try {
    const settings = await dbAll('SELECT * FROM settings');
    
    // Convert array to object for easier access
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    res.json({ success: true, settings: settingsObj });
  } catch (err) {
    console.error('Get settings error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get specific setting
// @route   GET /api/settings/:key
// @access  Public
exports.getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await dbGet('SELECT * FROM settings WHERE key = $1', [key]);
    
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }
    
    res.json({ success: true, setting });
  } catch (err) {
    console.error('Get setting error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update setting
// @route   PUT /api/settings/:key
// @access  Public (should be protected by admin middleware in production)
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!value && value !== '0') {
      return res.status(400).json({ success: false, message: 'Value is required' });
    }

    // Check if setting exists
    const existingSetting = await dbGet('SELECT * FROM settings WHERE key = $1', [key]);
    
    if (!existingSetting) {
      // Create new setting
      await dbRun('INSERT INTO settings (key, value) VALUES ($1, $2)', [key, value]);
    } else {
      // Update existing setting
      await dbRun(
        'UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2',
        [value, key]
      );
    }

    res.json({ success: true, message: 'Setting updated successfully', setting: { key, value } });
  } catch (err) {
    console.error('Update setting error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get tax rate
// @route   GET /api/settings/tax-rate
// @access  Public
exports.getTaxRate = async (req, res) => {
  try {
    const setting = await dbGet('SELECT * FROM settings WHERE key = $1', ['taxRate']);
    const taxRate = setting ? parseFloat(setting.value) : 0.1; // Default 10%
    
    res.json({ success: true, taxRate });
  } catch (err) {
    console.error('Get tax rate error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
