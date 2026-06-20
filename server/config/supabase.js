const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with REST API
// Priority: Use environment variables if available, fallback to hardcoded URL
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://yxakmdoiivaiyjcdaxny.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4YWttZG9paXZhaXlqY2RheG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwMzk1MjMsImV4cCI6MTc2ODU3NTUyM30.cPXZ-k3fpOl4eT0NVTNcVQvL6KDU1_v-zOIMLWVHhEU';

console.log('🔍 Supabase Config:', {
  url: SUPABASE_URL ? '✅ Set' : '❌ Missing',
  key: SUPABASE_KEY ? '✅ Set' : '❌ Missing',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
  },
});

/**
 * Wrapper for SELECT queries - returns array of rows
 * Usage: dbAll('SELECT * FROM users WHERE role = $1', ['admin'])
 */
const dbAll = async (sql, params = []) => {
  try {
    // Parse SQL to extract table name
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    const table = tableMatch ? tableMatch[1] : null;

    if (!table) {
      throw new Error(`Could not parse table name from: ${sql}`);
    }

    // Parse WHERE clause for filters
    let query = supabase.from(table).select('*');
    
    // Simple WHERE clause parsing (works for basic queries)
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      // Extract filter conditions
      const filterMatches = whereClause.match(/(\w+)\s*=\s*\$(\d+)/g);
      
      if (filterMatches) {
        filterMatches.forEach((match) => {
          const [col, paramIndex] = match.split(/\s*=\s*\$/);
          const paramIdx = parseInt(paramIndex) - 1;
          if (params[paramIdx] !== undefined) {
            query = query.eq(col.trim(), params[paramIdx]);
          }
        });
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Database all error:', error);
    throw error;
  }
};

/**
 * Wrapper for SELECT single row
 * Usage: dbGet('SELECT * FROM users WHERE email = $1', ['user@example.com'])
 */
const dbGet = async (sql, params = []) => {
  try {
    const rows = await dbAll(sql, params);
    return rows?.[0] || null;
  } catch (error) {
    console.error('Database get error:', error);
    throw error;
  }
};

/**
 * Wrapper for INSERT/UPDATE/DELETE queries
 * Usage: dbRun('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id', ['John', 'john@example.com'])
 */
const dbRun = async (sql, params = []) => {
  try {
    const tableMatch = sql.match(/(?:INTO|UPDATE|DELETE FROM)\s+(\w+)/i);
    const table = tableMatch ? tableMatch[1] : null;

    if (!table) {
      throw new Error(`Could not parse table name from: ${sql}`);
    }

    if (sql.toUpperCase().includes('INSERT')) {
      // Parse INSERT statement - handle both single and multi-line SQL
      // Match pattern: INSERT INTO table_name (col1, col2, ...) VALUES ($1, $2, ...)
      const colMatch = sql.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)\s*VALUES/i);
      
      if (!colMatch || !colMatch[1]) {
        console.error('Failed to parse columns from INSERT statement:', sql);
        throw new Error(`Could not parse column names from INSERT statement`);
      }

      const columns = colMatch[1]
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      if (columns.length === 0) {
        throw new Error('No columns found in INSERT statement');
      }

      if (params.length !== columns.length) {
        console.error('Parameter count mismatch:', {
          columns: columns,
          paramCount: params.length,
          columnCount: columns.length,
          params: params
        });
        throw new Error(`Parameter count (${params.length}) does not match column count (${columns.length})`);
      }

      const insertData = {};
      columns.forEach((col, idx) => {
        insertData[col] = params[idx];
      });

      console.log('Inserting into', table, 'with data:', Object.keys(insertData), 'values:', insertData);

      const { data, error } = await supabase
        .from(table)
        .insert([insertData])
        .select();

      if (error) {
        console.error('Supabase INSERT error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          insertData
        });
        throw error;
      }
      
      return {
        lastID: data?.[0]?.id,
        changes: 1,
        rows: data,
      };
    } else if (sql.toUpperCase().includes('UPDATE')) {
      // Parse UPDATE statement - handle complex expressions like GREATEST
      const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/is);
      const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/is);

      if (!whereMatch) {
        throw new Error('UPDATE requires a WHERE clause');
      }

      const updateData = {};
      if (setMatch) {
        const setClauses = setMatch[1].split(',');
        setClauses.forEach((clause, idx) => {
          const [col] = clause.trim().split('=');
          const trimmedCol = col.trim();
          // For simple assignments like "quantity = $1"
          if (params[idx] !== undefined) {
            updateData[trimmedCol] = params[idx];
          }
        });
      }

      // Parse WHERE clause to get filter conditions
      const whereClause = whereMatch[1].trim();
      const filterMatches = whereClause.match(/(\w+)\s*=\s*\$(\d+)/g);

      if (!filterMatches || filterMatches.length === 0) {
        throw new Error('WHERE clause must contain filter conditions');
      }

      let query = supabase.from(table).update(updateData);

      // Apply WHERE conditions
      filterMatches.forEach((match) => {
        const [col, paramIndex] = match.split(/\s*=\s*\$/);
        const paramIdx = parseInt(paramIndex) - 1;
        if (params[paramIdx] !== undefined) {
          query = query.eq(col.trim(), params[paramIdx]);
        }
      });

      const { error, count } = await query;
      if (error) throw error;
      return { changes: count };
    } else if (sql.toUpperCase().includes('DELETE')) {
      // Parse DELETE statement
      const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/i);

      let query = supabase.from(table).delete();

      if (whereMatch) {
        const whereClause = whereMatch[1].trim();
        const filterMatches = whereClause.match(/(\w+)\s*=\s*\$(\d+)/g);
        
        if (filterMatches) {
          filterMatches.forEach((match) => {
            const [col, paramIndex] = match.split(/\s*=\s*\$/);
            const paramIdx = parseInt(paramIndex) - 1;
            if (params[paramIdx] !== undefined) {
              query = query.eq(col.trim(), params[paramIdx]);
            }
          });
        }
      }

      const { error, count } = await query;
      if (error) throw error;
      return { changes: count };
    }
  } catch (error) {
    console.error('Database run error:', error);
    throw error;
  }
};

/**
 * Initialize Supabase connection and create tables if needed
 */
const connectDB = async () => {
  try {
    // Test connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error connecting to Supabase:', error.message);
      throw error;
    }

    console.log('✅ Connected to Supabase Database');
  } catch (err) {
    console.error('❌ Error initializing Supabase:', err.message);
    throw err;
  }
};

module.exports = {
  supabase,
  connectDB,
  dbAll,
  dbGet,
  dbRun,
};
