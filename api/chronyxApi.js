const mysql = require('mysql2/promise');

// Create MySQL connection pool with explicit configuration
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'mysql-205810-0.cloudclusters.net',
  port: parseInt(process.env.MYSQL_PORT || '10055'),
  user: process.env.MYSQL_USER || 'admin',
  password: process.env.MYSQL_PASSWORD || '5AqRf7hl',
  database: process.env.MYSQL_DATABASE || 'chronyx',
  connectionLimit: 10,
  waitForConnections: true,
  connectTimeout: 60000,
  timezone: '+08:00'
});

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { endpoint } = req.query;

  try {
    // TEST ENDPOINT - Check if API is working with detailed env info
    if (endpoint === 'test' && req.method === 'GET') {
      const envInfo = {
        hasHost: !!process.env.MYSQL_HOST,
        hasPort: !!process.env.MYSQL_PORT,
        hasUser: !!process.env.MYSQL_USER,
        hasPassword: !!process.env.MYSQL_PASSWORD,
        hasDatabase: !!process.env.MYSQL_DATABASE,
        host: process.env.MYSQL_HOST || 'NOT SET - using fallback',
        port: process.env.MYSQL_PORT || 'NOT SET - using fallback',
        database: process.env.MYSQL_DATABASE || 'NOT SET - using fallback',
        user: process.env.MYSQL_USER || 'NOT SET - using fallback'
      };

      // Test database connection
      let dbStatus = 'Not tested';
      let connection;
      try {
        connection = await pool.getConnection();
        dbStatus = 'Connected successfully!';
        connection.release();
      } catch (dbError) {
        dbStatus = `Connection failed: ${dbError.message}`;
      }

      return res.status(200).json({
        success: true,
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        version: '3.0',
        envCheck: envInfo,
        databaseConnection: dbStatus
      });
    }

    // SIGNUP ENDPOINT - Create new employee
    if (endpoint === 'signup' && req.method === 'POST') {
      const { firstName, lastName, email, password } = req.body;

      console.log('=== SIGNUP REQUEST START ===');
      console.log('Email:', email);
      console.log('Pool config:', {
        host: pool.pool.config.connectionConfig.host,
        port: pool.pool.config.connectionConfig.port,
        database: pool.pool.config.connectionConfig.database
      });

      // Validate input
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
        });
      }

      let connection;
      try {
        console.log('Attempting to get connection from pool...');
        connection = await pool.getConnection();
        console.log('✓ Connection obtained successfully');

        // Check if email already exists
        console.log('Checking for existing employee...');
        const [existingEmployees] = await connection.execute(
          'SELECT * FROM employee WHERE email = ?',
          [email]
        );
        console.log('Existing employees found:', existingEmployees.length);

        if (existingEmployees.length > 0) {
          connection.release();
          return res.status(400).json({
            success: false,
            message: 'Email already exists',
          });
        }

        // Insert new employee (removed user_type column)
        console.log('Inserting new employee...');
        const [result] = await connection.execute(
          'INSERT INTO employee (first_name, last_name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
          [firstName, lastName, email, password]
        );

        connection.release();
        console.log('✓ Employee created successfully! ID:', result.insertId);
        console.log('=== SIGNUP REQUEST SUCCESS ===');

        return res.status(201).json({
          success: true,
          message: 'User created successfully',
          userId: result.insertId,
        });
      } catch (dbError) {
        if (connection) connection.release();
        console.error('!!! DATABASE ERROR !!!');
        console.error('Error code:', dbError.code);
        console.error('Error message:', dbError.message);
        console.error('Full error:', dbError);
        console.log('=== SIGNUP REQUEST FAILED ===');
        
        return res.status(500).json({
          success: false,
          message: 'Database error',
          error: dbError.message,
          code: dbError.code
        });
      }
    }

    // LOGIN ENDPOINT - Authenticate employee
    if (endpoint === 'login' && req.method === 'POST') {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      let connection;
      try {
        connection = await pool.getConnection();

        const [employees] = await connection.execute(
          'SELECT * FROM employee WHERE email = ? AND password = ?',
          [email, password]
        );

        connection.release();

        if (employees.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'Invalid email or password',
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Login successful',
          user: {
            id: employees[0].employee_id,
            firstName: employees[0].first_name,
            lastName: employees[0].last_name,
            email: employees[0].email,
          },
        });
      } catch (dbError) {
        if (connection) connection.release();
        console.error('Database error:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database error',
          error: dbError.message,
        });
      }
    }

    // CREATE QR CODE ENDPOINT
    if (endpoint === 'create-qr' && req.method === 'POST') {
      const { userId, firstName, lastName, email } = req.body;

      if (!userId || !firstName || !lastName || !email) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required',
        });
      }

      let connection;
      try {
        connection = await pool.getConnection();

        // Check if employee already has a QR code
        const [existingQR] = await connection.execute(
          'SELECT * FROM employee_qr WHERE employee_id = ?',
          [userId]
        );

        if (existingQR.length > 0) {
          connection.release();
          return res.status(200).json({
            success: true,
            message: 'User already has a QR code',
            qrCode: existingQR[0].qr_code,
          });
        }

        // Generate unique QR code (format: QL-USERID-TIMESTAMP)
        const timestamp = Date.now();
        const qrCode = `QL-${userId}-${timestamp}`;

        // Insert QR code
        await connection.execute(
          'INSERT INTO employee_qr (employee_id, qr_code, first_name, last_name, email) VALUES (?, ?, ?, ?, ?)',
          [userId, qrCode, firstName, lastName, email]
        );

        connection.release();

        return res.status(201).json({
          success: true,
          message: 'QR code created successfully',
          qrCode: qrCode,
        });
      } catch (dbError) {
        if (connection) connection.release();
        console.error('Database error:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database error',
          error: dbError.message,
        });
      }
    }

    // CHECK QR CODE ENDPOINT
    if (endpoint === 'check-qr' && req.method === 'GET') {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      let connection;
      try {
        connection = await pool.getConnection();

        const [qrRecords] = await connection.execute(
          'SELECT qr_code, is_active, created_at FROM employee_qr WHERE employee_id = ?',
          [userId]
        );

        connection.release();

        if (qrRecords.length === 0) {
          return res.status(200).json({
            success: true,
            hasQR: false,
            qrCode: null,
          });
        }

        return res.status(200).json({
          success: true,
          hasQR: true,
          qrCode: qrRecords[0].qr_code,
          isActive: qrRecords[0].is_active,
          createdAt: qrRecords[0].created_at,
        });
      } catch (dbError) {
        if (connection) connection.release();
        console.error('Database error:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database error',
          error: dbError.message,
        });
      }
    }
   
    // If no endpoint matches
    return res.status(404).json({
      success: false,
      message: 'Endpoint not found',
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};