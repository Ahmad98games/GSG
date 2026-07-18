import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({
    success: true
  })
  response.cookies.delete('noxis_admin_token')
  return response
}
