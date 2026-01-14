import { NextResponse } from 'next/server'

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function - Proxy all requests to FastAPI backend
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // Construct backend URL - all API routes go through FastAPI backend
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api${route}`
    console.log(`Proxying ${method} request to: ${backendUrl}`)
    
    // Prepare request options
    const requestOptions = {
      method: method,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
      },
    }

    // Add body for non-GET/HEAD requests
    if (method !== 'GET' && method !== 'HEAD') {
      requestOptions.body = await request.text()
    }

    // Proxy to backend
    const response = await fetch(backendUrl, requestOptions)

    // For media/binary responses, use arrayBuffer
    if (response.headers.get('content-type')?.includes('image') || 
        response.headers.get('content-type')?.includes('video') ||
        response.headers.get('content-type')?.includes('audio') ||
        response.headers.get('content-type')?.includes('octet-stream')) {
      const data = await response.arrayBuffer()
      const responseHeaders = new Headers(response.headers)
      responseHeaders.set('Access-Control-Allow-Origin', '*')
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
      responseHeaders.set('Access-Control-Allow-Headers', '*')
      
      return new NextResponse(data, {
        status: response.status,
        headers: responseHeaders,
      })
    }

    // For JSON/text responses
    const data = await response.text()
    const responseHeaders = new Headers(response.headers)
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    
    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    })

  } catch (error) {
    console.error('Proxy error:', error)
    return handleCORS(NextResponse.json(
      { error: "Failed to proxy request to backend", message: error.message }, 
      { status: 502 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
