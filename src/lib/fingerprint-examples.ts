/**
 * 指纹识别工具使用示例
 * 展示如何在实际应用中使用指纹识别功能
 */

import { 
  generateFingerprint, 
  getFingerprintFromCookie, 
  clearFingerprint,
  getFingerprintSummary,
  validateFingerprint,
  type FingerprintData 
} from './fingerprint';

/**
 * 示例1: 基础指纹生成和使用
 */
export async function basicFingerprintExample() {
  try {
    console.log('🔍 生成设备指纹...');
    
    // 生成指纹
    const fingerprint = await generateFingerprint();
    
    console.log('✅ 指纹生成成功:', {
      id: fingerprint.visitorId,
      confidence: fingerprint.confidence,
      timestamp: new Date(fingerprint.timestamp).toISOString(),
    });
    
    // 验证指纹
    const validation = validateFingerprint(fingerprint);
    console.log('🔍 指纹验证结果:', validation);
    
    return fingerprint;
  } catch (error) {
    console.error('❌ 指纹生成失败:', error);
    throw error;
  }
}

/**
 * 示例2: 检查现有指纹
 */
export async function checkExistingFingerprintExample() {
  console.log('🔍 检查现有指纹...');
  
  // 首先尝试从Cookie获取
  const cookieFingerprint = getFingerprintFromCookie();
  if (cookieFingerprint) {
    console.log('🍪 从Cookie找到指纹:', cookieFingerprint);
  }
  
  // 获取指纹摘要信息
  const summary = await getFingerprintSummary();
  console.log('📊 指纹摘要:', summary);
  
  return summary;
}

/**
 * 示例3: 指纹缓存管理
 */
export async function fingerprintCacheExample() {
  console.log('🗄️ 指纹缓存管理示例...');
  
  // 第一次生成（会缓存）
  console.log('第一次生成指纹...');
  const start1 = Date.now();
  const fingerprint1 = await generateFingerprint();
  const time1 = Date.now() - start1;
  console.log(`⏱️ 第一次生成耗时: ${time1}ms`);
  
  // 第二次生成（从缓存获取）
  console.log('第二次生成指纹（应该从缓存获取）...');
  const start2 = Date.now();
  const fingerprint2 = await generateFingerprint();
  const time2 = Date.now() - start2;
  console.log(`⏱️ 第二次生成耗时: ${time2}ms`);
  
  // 比较结果
  const isSame = fingerprint1.visitorId === fingerprint2.visitorId;
  console.log('🔄 两次生成的指纹是否相同:', isSame);
  console.log('⚡ 缓存加速效果:', `${((time1 - time2) / time1 * 100).toFixed(1)}%`);
  
  return { fingerprint1, fingerprint2, speedup: time1 - time2 };
}

/**
 * 示例4: 指纹清理和重新生成
 */
export async function fingerprintCleanupExample() {
  console.log('🧹 指纹清理示例...');
  
  // 生成初始指纹
  const originalFingerprint = await generateFingerprint();
  console.log('📝 原始指纹:', originalFingerprint.visitorId);
  
  // 清理指纹
  clearFingerprint();
  console.log('🗑️ 已清理指纹缓存');
  
  // 重新生成指纹
  const newFingerprint = await generateFingerprint();
  console.log('🆕 新指纹:', newFingerprint.visitorId);
  
  // 比较指纹（应该相同，因为是同一设备）
  const isSame = originalFingerprint.visitorId === newFingerprint.visitorId;
  console.log('🔄 清理后重新生成的指纹是否相同:', isSame);
  
  return { originalFingerprint, newFingerprint, isSame };
}

/**
 * 示例5: 错误处理和降级策略
 */
export async function fingerprintErrorHandlingExample() {
  console.log('⚠️ 指纹错误处理示例...');
  
  try {
    // 模拟网络错误或其他问题
    const fingerprint = await generateFingerprint();
    
    // 检查是否是降级指纹
    const isFallback = fingerprint.visitorId.startsWith('fallback_');
    if (isFallback) {
      console.log('🔄 使用了降级指纹策略');
      console.log('⚠️ 置信度较低:', fingerprint.confidence);
    } else {
      console.log('✅ 正常指纹生成成功');
      console.log('📊 置信度:', fingerprint.confidence);
    }
    
    return fingerprint;
  } catch (error) {
    console.error('❌ 指纹生成完全失败:', error);
    
    // 在实际应用中，可以使用其他标识方法
    console.log('🔄 可以考虑使用其他用户标识方法');
    throw error;
  }
}

/**
 * 示例6: 指纹质量评估
 */
export async function fingerprintQualityExample() {
  console.log('📊 指纹质量评估示例...');
  
  const fingerprint = await generateFingerprint();
  
  // 评估指纹质量
  const quality = evaluateFingerprintQuality(fingerprint);
  console.log('📈 指纹质量评估:', quality);
  
  // 根据质量给出建议
  if (quality.score > 0.8) {
    console.log('✅ 指纹质量优秀，可以可靠地用于用户识别');
  } else if (quality.score > 0.6) {
    console.log('⚠️ 指纹质量中等，建议结合其他标识方法');
  } else {
    console.log('❌ 指纹质量较低，建议使用其他用户标识方法');
  }
  
  return quality;
}

/**
 * 指纹质量评估函数
 */
function evaluateFingerprintQuality(fingerprint: FingerprintData) {
  let score = 0;
  const factors = {
    uniqueness: 0,
    stability: 0,
    entropy: 0,
  };
  const recommendations: string[] = [];
  
  // 评估置信度
  if (fingerprint.confidence > 0.9) {
    factors.uniqueness = 1;
  } else if (fingerprint.confidence > 0.7) {
    factors.uniqueness = 0.8;
  } else if (fingerprint.confidence > 0.5) {
    factors.uniqueness = 0.6;
    recommendations.push('考虑收集更多设备特征以提高唯一性');
  } else {
    factors.uniqueness = 0.3;
    recommendations.push('指纹唯一性较低，建议使用其他标识方法');
  }
  
  // 评估稳定性（基于是否是降级指纹）
  if (fingerprint.visitorId.startsWith('fallback_')) {
    factors.stability = 0.4;
    recommendations.push('当前使用降级指纹，稳定性较低');
  } else {
    factors.stability = 0.9;
  }
  
  // 评估熵值（基于组件数量）
  const componentCount = Object.keys(fingerprint.components).length;
  if (componentCount > 15) {
    factors.entropy = 1;
  } else if (componentCount > 10) {
    factors.entropy = 0.8;
  } else if (componentCount > 5) {
    factors.entropy = 0.6;
    recommendations.push('可用的设备特征较少，考虑启用更多检测项');
  } else {
    factors.entropy = 0.3;
    recommendations.push('设备特征过少，指纹熵值较低');
  }
  
  // 计算总分
  score = (factors.uniqueness + factors.stability + factors.entropy) / 3;
  
  return {
    score,
    factors,
    recommendations,
  };
}

/**
 * 示例7: 批量指纹操作
 */
export async function batchFingerprintExample() {
  console.log('📦 批量指纹操作示例...');
  
  const results = [];
  
  // 模拟多次指纹生成（测试一致性）
  for (let i = 0; i < 5; i++) {
    console.log(`🔄 第${i + 1}次指纹生成...`);
    const fingerprint = await generateFingerprint();
    results.push({
      attempt: i + 1,
      visitorId: fingerprint.visitorId,
      confidence: fingerprint.confidence,
      timestamp: fingerprint.timestamp,
    });
  }
  
  // 分析一致性
  const uniqueIds = new Set(results.map(r => r.visitorId));
  const isConsistent = uniqueIds.size === 1;
  
  console.log('📊 批量生成结果:', results);
  console.log('🔄 指纹一致性:', isConsistent ? '✅ 一致' : '❌ 不一致');
  
  if (!isConsistent) {
    console.warn('⚠️ 指纹不一致，可能存在问题');
  }
  
  return { results, isConsistent };
}

/**
 * 运行所有示例
 */
export async function runAllFingerprintExamples() {
  console.log('🚀 开始运行所有指纹示例...\n');
  
  try {
    await basicFingerprintExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await checkExistingFingerprintExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await fingerprintCacheExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await fingerprintCleanupExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await fingerprintErrorHandlingExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await fingerprintQualityExample();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await batchFingerprintExample();
    
    console.log('\n✅ 所有指纹示例运行完成！');
  } catch (error) {
    console.error('❌ 示例运行失败:', error);
  }
}

// 在浏览器控制台中运行示例的便捷函数
if (typeof window !== 'undefined') {
  (window as any).fingerprintExamples = {
    basic: basicFingerprintExample,
    check: checkExistingFingerprintExample,
    cache: fingerprintCacheExample,
    cleanup: fingerprintCleanupExample,
    errorHandling: fingerprintErrorHandlingExample,
    quality: fingerprintQualityExample,
    batch: batchFingerprintExample,
    runAll: runAllFingerprintExamples,
  };
  
  console.log('🔧 指纹示例已加载到 window.fingerprintExamples');
  console.log('💡 使用方法: window.fingerprintExamples.basic()');
}