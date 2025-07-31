const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 从环境变量读取配置
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少Supabase配置信息');
  console.error('请确保 .env.local 文件中包含:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initDatabase() {
  console.log('🚀 开始初始化YouTube Scraper数据库...');
  
  try {
    // 读取SQL schema文件
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // 分割SQL语句（简单分割，生产环境建议使用更robust的SQL解析器）
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 找到 ${statements.length} 个SQL语句`);
    
    // 执行每个SQL语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('CREATE EXTENSION') || 
          statement.includes('CREATE TABLE') || 
          statement.includes('CREATE INDEX') ||
          statement.includes('CREATE POLICY') ||
          statement.includes('ALTER TABLE') ||
          statement.includes('CREATE OR REPLACE FUNCTION') ||
          statement.includes('CREATE TRIGGER') ||
          statement.includes('INSERT INTO')) {
        
        try {
          console.log(`⏳ 执行语句 ${i + 1}/${statements.length}...`);
          
          const { error } = await supabase.rpc('exec_sql', {
            sql_query: statement
          });
          
          if (error) {
            // 如果是"已存在"错误，可以忽略
            if (error.message.includes('already exists') || 
                error.message.includes('duplicate key') ||
                error.message.includes('relation') && error.message.includes('already exists')) {
              console.log(`⚠️  跳过已存在的对象: ${error.message.substring(0, 100)}...`);
            } else {
              console.error(`❌ SQL执行错误:`, error);
              // 继续执行其他语句，不要中断
            }
          } else {
            console.log(`✅ 语句执行成功`);
          }
        } catch (err) {
          console.error(`❌ 执行语句时出错:`, err.message);
        }
      }
    }
    
    // 验证表是否创建成功
    console.log('\n🔍 验证数据库表...');
    
    const tables = ['yt_users', 'yt_videos', 'yt_channels', 'yt_comments', 'yt_scraping_tasks'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ 表 ${table} 验证失败:`, error.message);
      } else {
        console.log(`✅ 表 ${table} 创建成功`);
      }
    }
    
    console.log('\n🎉 数据库初始化完成！');
    console.log('\n📋 创建的表:');
    console.log('- yt_users (用户表)');
    console.log('- yt_videos (视频数据表)');
    console.log('- yt_channels (频道数据表)');
    console.log('- yt_comments (评论数据表)');
    console.log('- yt_scraping_tasks (采集任务表)');
    console.log('- yt_ai_analysis (AI分析结果表)');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };