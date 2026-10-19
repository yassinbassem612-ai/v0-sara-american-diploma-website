import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = 'https://fvkyqcxxweefkcnfdbxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2a3lxY3h4d2VlZmtjbmZkYnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjg4MjMsImV4cCI6MjA3MDgwNDgyM30.D0zz9AXOL_9IToFIjmZn82GQqi35u4X9EUl_Q58Qo1k';

const TABLES = [
  'users',
  'home_content',
  'recorded_sessions',
  'sessions',
  'study_materials',
  'quizzes',
  'quiz_questions',
  'quiz_submissions',
  'student_questions',
  'groups',
  'group_memberships',
  'parents',
  'parent_children',
  'parent_messages',
  'certificates',
  'weekly_reports',
  'sheets',
  'attendance_blocks',
  'attendance_records',
  'absence_notifications',
  'attendance_sessions',
  'attendance_scans'
];

// Helper to escape SQL strings
function escapeSqlVal(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') {
    // Array or JSON object
    if (Array.isArray(val)) {
      // Postgres array or JSON
      const jsonStr = JSON.stringify(val).replace(/'/g, "''");
      return `'${jsonStr}'::jsonb`;
    }
    const jsonStr = JSON.stringify(val).replace(/'/g, "''");
    return `'${jsonStr}'::jsonb`;
  }
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

// Convert table rows to SQL INSERT statements
function generateSqlInserts(tableName, rows) {
  if (!rows || rows.length === 0) {
    return `-- Table: ${tableName} (0 rows)\n`;
  }

  const columns = Object.keys(rows[0]);
  const colList = columns.map(c => `"${c}"`).join(', ');

  let sql = `-- ========================================================\n`;
  sql += `-- Data for table: ${tableName} (${rows.length} rows)\n`;
  sql += `-- ========================================================\n`;

  for (const row of rows) {
    const valList = columns.map(c => escapeSqlVal(row[c])).join(', ');
    sql += `INSERT INTO "${tableName}" (${colList}) VALUES (${valList}) ON CONFLICT DO NOTHING;\n`;
  }

  sql += `\n`;
  return sql;
}

// Fetch all rows for a table with pagination
async function fetchTableData(tableName) {
  const allRows = [];
  const pageSize = 1000;
  let offset = 0;
  let totalCount = null;

  while (true) {
    const from = offset;
    const to = offset + pageSize - 1;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Range': `${from}-${to}`,
        'Prefer': 'count=exact'
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const rangeHeader = res.headers.get('content-range');
    if (rangeHeader && totalCount === null) {
      const parts = rangeHeader.split('/');
      if (parts[1]) {
        totalCount = parseInt(parts[1], 10);
      }
    }

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      break;
    }

    allRows.push(...rows);
    offset += rows.length;

    if (totalCount !== null && allRows.length >= totalCount) {
      break;
    }

    if (rows.length < pageSize) {
      break;
    }
  }

  return { rows: allRows, totalCount: totalCount ?? allRows.length };
}

async function runBackup() {
  console.log('========================================================');
  console.log('🚀 Starting Full Database Backup for Sara American Diploma');
  console.log(`📡 Supabase Endpoint: ${SUPABASE_URL}`);
  console.log('========================================================\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDirName = `backup_${timestamp}`;
  const localBackupDir = path.resolve(process.cwd(), 'database-backup', backupDirName);
  const localLatestDir = path.resolve(process.cwd(), 'database-backup', 'latest');
  const jsonDir = path.join(localBackupDir, 'json');

  fs.mkdirSync(jsonDir, { recursive: true });
  fs.mkdirSync(localLatestDir, { recursive: true });

  const summary = {
    timestamp: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL,
    totalTables: TABLES.length,
    successfulTables: 0,
    failedTables: 0,
    totalRecords: 0,
    tables: {}
  };

  let combinedSql = `-- Full Database Backup for Sara American Diploma\n`;
  combinedSql += `-- Export Date: ${new Date().toISOString()}\n`;
  combinedSql += `-- Source: ${SUPABASE_URL}\n\n`;
  combinedSql += `SET statement_timeout = 0;\n`;
  combinedSql += `SET client_encoding = 'UTF8';\n`;
  combinedSql += `SET standard_conforming_strings = on;\n\n`;

  const fullDataBackup = {};

  for (const table of TABLES) {
    process.stdout.write(`Fetching table [${table}]... `);
    try {
      const { rows, totalCount } = await fetchTableData(table);
      console.log(`✅ ${rows.length} rows (total: ${totalCount})`);

      summary.successfulTables++;
      summary.totalRecords += rows.length;
      summary.tables[table] = {
        count: rows.length,
        status: 'success'
      };

      // Save individual table JSON
      fs.writeFileSync(path.join(jsonDir, `${table}.json`), JSON.stringify(rows, null, 2), 'utf8');

      // Add to full data object
      fullDataBackup[table] = rows;

      // Append to combined SQL
      combinedSql += generateSqlInserts(table, rows);

    } catch (err) {
      console.log(`❌ ERROR: ${err.message}`);
      summary.failedTables++;
      summary.tables[table] = {
        count: 0,
        status: 'error',
        error: err.message
      };
    }
  }

  // Write full consolidated JSON backup
  const allDataJsonPath = path.join(localBackupDir, 'all_database_data.json');
  fs.writeFileSync(allDataJsonPath, JSON.stringify(fullDataBackup, null, 2), 'utf8');

  // Write combined SQL data restore script
  const allDataSqlPath = path.join(localBackupDir, 'restore_data.sql');
  fs.writeFileSync(allDataSqlPath, combinedSql, 'utf8');

  // Write summary metadata
  const summaryPath = path.join(localBackupDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

  // Also copy to latest/ folder for convenient reference
  fs.writeFileSync(path.join(localLatestDir, 'all_database_data.json'), JSON.stringify(fullDataBackup, null, 2), 'utf8');
  fs.writeFileSync(path.join(localLatestDir, 'restore_data.sql'), combinedSql, 'utf8');
  fs.writeFileSync(path.join(localLatestDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');

  console.log('\n========================================================');
  console.log('🎉 Full Database Backup Completed Successfully!');
  console.log(`📁 Backup directory: ${localBackupDir}`);
  console.log(`📊 Total Records Backed Up: ${summary.totalRecords}`);
  console.log(`📄 Tables Processed: ${summary.successfulTables}/${summary.totalTables}`);
  console.log('========================================================\n');

  return { localBackupDir, summary };
}

runBackup().catch(err => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
