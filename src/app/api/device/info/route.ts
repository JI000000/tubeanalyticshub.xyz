import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

/**
 * 获取设备信息API端点
 * 返回服务端可获取的设备信息，如IP地址等
 */
export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    
    // 获取客户端IP地址
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown'
    
    // 获取用户代理
    const userAgent = headersList.get('user-agent') || 'unknown'
    
    // 获取其他请求头信息
    const acceptLanguage = headersList.get('accept-language') || 'unknown'
    const acceptEncoding = headersList.get('accept-encoding') || 'unknown'
    
    // 尝试获取地理位置信息（简单的基于IP的推测）
    let location = 'unknown'
    try {
      // 这里可以集成第三方地理位置服务
      // 例如：ipapi.co, ipinfo.io 等
      // 为了演示，我们只是基于IP做简单判断
      if (clientIp.startsWith('192.168.') || clientIp.startsWith('10.') || clientIp.startsWith('172.')) {
        location = 'Local Network'
      } else if (clientIp === '127.0.0.1' || clientIp === '::1') {
        location = 'Localhost'
      } else {
        location = 'External'
      }
    } catch (error) {
      console.warn('Failed to get location info:', error)
    }

    const deviceInfo = {
      ipAddress: clientIp,
      userAgent,
      location,
      acceptLanguage,
      acceptEncoding,
      timestamp: new Date().toISOString(),
      // 添加一些服务端可检测的信息
      headers: {
        'x-forwarded-for': forwardedFor,
        'x-real-ip': realIp,
        'cf-connecting-ip': headersList.get('cf-connecting-ip'), // Cloudflare
        'x-forwarded-proto': headersList.get('x-forwarded-proto'),
        'x-forwarded-host': headersList.get('x-forwarded-host'),
      }
    }

    return NextResponse.json({
      success: true,
      data: deviceInfo
    })
  } catch (error) {
    console.error('Failed to get device info:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get device info',
        message: '获取设备信息失败'
      },
      { status: 500 }
    )
  }
}