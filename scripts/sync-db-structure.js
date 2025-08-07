#!/usr/bin/env node

/**
 * 数据库结构同步工具
 * 将schema.sql应用到线上数据库
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少数据库环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function executeSQL(sql) {
  try {
    // 使用Supabase的SQL执行功能
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql
    });
    
    if (error) {
      // 如果是"已存在"错误，可以忽略
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate key') ||
          error.message.includes('relation') && error.message.includes('already exists')) {
        return { success: true, warning: error.message };
      }
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function syncDatabaseStructure() {
  console.log('🔄 开始同步数据库结构...\n');
  
  // 读取schema.sql文件
  const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ schema.sql 文件不存在');
    process.exit(1);
  }
  
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  // 分割SQL语句
  const statements = schemaSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`📝 找到 ${statements.length} 个SQL语句\n`);
  
  let successCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // 只执行CREATE语句
    if (statement.includes('CREATE EXTENSION') || 
        statement.includes('CREATE TABLE') || 
        statement.includes('CREATE INDEX') ||
        statement.includes('CREATE POLICY') ||
        statement.includes('ALTER TABLE') ||
        statement.includes('CREATE OR REPLACE FUNCTION') ||
        statement.includes('CREATE TRIGGER')) {
      
      console.log(`⏳ 执行语句 ${i + 1}/${statements.length}...`);
      
      const result = await executeSQL(statement);
      
      if (result.success) {
        if (result.warning) {
          console.log(`⚠️  ${result.warning.substring(0, 100)}...`);
          warningCount++;
        } else {
          console.log(`✅ 执行成功`);
          successCount++;
        }
      } else {
        console.log(`❌ 执行失败: ${result.error.substring(0, 100)}...`);
        errorCount++;
      }
      
      // 添加延迟避免过快请求
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`\n📊 同步结果:`);
  console.log(`✅ 成功: ${successCount}`);
  console.log(`⚠️  警告: ${warningCount}`);
  console.log(`❌ 错误: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 数据库结构同步完成！');
  } else {
    console.log('\n⚠️  部分语句执行失败，请检查错误信息');
  }
}

async function main() {
  try {
    await syncDatabaseStructure();
  } catch (error) {
    console.error('❌ 同步过程中出错:', error.message);
    process.exit(1);
  }
}

main(); 