import { NextRequest, NextResponse } from "next/server"
import { getAppmaxOrder } from "@/lib/appmax"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: "Order ID é obrigatório" }, { status: 400 })
    }

    // Busca o pedido na Appmax
    const order = await getAppmaxOrder(orderId)

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      approvedAt: order.approved_at,
    })
  } catch (error: any) {
    console.error("Erro ao verificar status:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao verificar status" },
      { status: 500 }
    )
  }
}
