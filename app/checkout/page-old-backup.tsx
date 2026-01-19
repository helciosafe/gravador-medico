"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import {
  Check,
  Clock,
  Lock,
  Shield,
  CreditCard,
  Gift,
  Zap,
  Star,
  X,
  ChevronRight,
  AlertCircle,
  Sparkles,
  User,
  Mail,
  Phone,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  Wallet,
} from "lucide-react"
import Image from "next/image"

export default function CheckoutPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1) // 1, 2, 3
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutos
  const [selectedOrderBumps, setSelectedOrderBumps] = useState<number[]>([])
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "pix">("credit")
  const [loading, setLoading] = useState(false)
  const [pixQrCode, setPixQrCode] = useState("")
  const [orderId, setOrderId] = useState("")
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
  })

  const [cardData, setCardData] = useState({
    number: "",
    holderName: "",
    expMonth: "",
    expYear: "",
    cvv: "",
    installments: 1,
  })

  // Depoimentos carousel
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: 'start', skipSnaps: false },
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  )

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const toggleOrderBump = (index: number) => {
    setSelectedOrderBumps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const orderBumps = [
    {
      title: "🎯 Pacote VIP: Consultoria Personalizada",
      description: "30 minutos de consultoria individual para otimizar seu método + Setup completo feito por especialista",
      originalPrice: 497,
      price: 147,
      discount: 70,
      highlight: "MAIS VENDIDO",
      badge: "LIMITADO",
    },
    {
      title: "📚 Biblioteca Premium: 50+ Modelos Prontos",
      description: "Modelos de prontuários para 20+ especialidades + Scripts de anamnese otimizados + Atualizações vitalícias",
      originalPrice: 297,
      price: 97,
      discount: 67,
      highlight: "ECONOMIZE HORAS",
      badge: "EXCLUSIVO",
    },
  ]

  const basePrice = 36
  const orderBumpsTotal = selectedOrderBumps.reduce((acc, idx) => acc + orderBumps[idx].price, 0)
  const subtotal = basePrice + orderBumpsTotal
  const pixDiscount = paymentMethod === "pix" ? Math.round(subtotal * 0.05) : 0
  const total = subtotal - pixDiscount

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Countdown Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4">
            <Clock className="w-5 h-5 animate-pulse" />
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium">Oferta expira em:</span>
              <span className="text-2xl font-black tabular-nums tracking-tight">
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="hidden sm:block text-xs opacity-90">
              ⚡ Desconto válido apenas nesta sessão
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-white/20">
          <motion.div
            className="h-full bg-white"
            initial={{ width: "100%" }}
            animate={{ width: `${(timeLeft / (15 * 60)) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-800 px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Shield className="w-4 h-4" />
              Pagamento 100% Seguro
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
              Complete seu Pedido
            </h1>
            <p className="text-gray-600">
              Você está a um passo de economizar 3 horas por dia
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Column - Product & Order Bumps */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Main Product */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 border-2 border-brand-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-black text-gray-900">
                          Método Gravador Médico Completo
                        </h3>
                        <p className="text-gray-600 text-sm mt-1">
                          Sistema + 4 Bônus Exclusivos
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-400 line-through text-sm">R$ 938</div>
                        <div className="text-3xl font-black text-brand-600">R$ 36</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {[
                        "Acesso Imediato",
                        "4 Bônus Inclusos",
                        "Garantia 7 Dias",
                        "Suporte 30 Dias",
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-brand-600" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Order Bumps */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-brand-600" />
                  <h2 className="text-xl font-black text-gray-900">
                    Ofertas Exclusivas Para Você
                  </h2>
                </div>

                {orderBumps.map((bump, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <button
                      onClick={() => toggleOrderBump(index)}
                      className={`w-full text-left transition-all ${
                        selectedOrderBumps.includes(index)
                          ? "bg-gradient-to-br from-brand-50 to-brand-50 border-2 border-brand-400 shadow-lg"
                          : "bg-white border-2 border-gray-200 hover:border-brand-300"
                      } rounded-2xl p-6 relative overflow-hidden`}
                    >
                      {/* Badge */}
                      <div className="absolute top-4 right-4">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                          {bump.badge}
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <div className={`flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center mt-1 ${
                          selectedOrderBumps.includes(index)
                            ? "bg-brand-600 border-brand-600"
                            : "border-gray-300 bg-white"
                        }`}>
                          {selectedOrderBumps.includes(index) && (
                            <Check className="w-5 h-5 text-white" />
                          )}
                        </div>

                        <div className="flex-1 pr-20">
                          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold mb-2">
                            <Zap className="w-3 h-3" />
                            {bump.highlight}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {bump.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3">
                            {bump.description}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-400 line-through text-sm">
                              De R$ {bump.originalPrice}
                            </span>
                            <span className="text-2xl font-black text-brand-600">
                              R$ {bump.price}
                            </span>
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                              -{bump.discount}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Shield, text: "Pagamento Seguro" },
                  { icon: Lock, text: "Dados Protegidos" },
                  { icon: Check, text: "Garantia 7 Dias" },
                  { icon: Zap, text: "Acesso Imediato" },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <badge.icon className="w-5 h-5 text-brand-600" />
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Payment Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200"
                >
                  {/* Summary */}
                  <h3 className="text-xl font-black text-gray-900 mb-4">
                    Resumo do Pedido
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-700">
                      <span>Método Completo</span>
                      <span className="font-bold">R$ {basePrice}</span>
                    </div>
                    {selectedOrderBumps.map((idx) => (
                      <div key={idx} className="flex justify-between text-sm text-gray-600">
                        <span className="flex-1 pr-2">{orderBumps[idx].title.split(":")[0]}</span>
                        <span className="font-bold">R$ {orderBumps[idx].price}</span>
                      </div>
                    ))}
                    
                    {pixDiscount > 0 && (
                      <div className="flex justify-between text-brand-600 font-bold">
                        <span>Desconto PIX (5%)</span>
                        <span>-R$ {pixDiscount}</span>
                      </div>
                    )}

                    <div className="border-t-2 border-gray-200 pt-3 flex justify-between items-baseline">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <div className="text-right">
                        {subtotal !== total && (
                          <div className="text-sm text-gray-400 line-through">
                            R$ {subtotal}
                          </div>
                        )}
                        <div className="text-3xl font-black text-brand-600">
                          R$ {total}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-900 mb-3">
                      Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentMethod("credit")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          paymentMethod === "credit"
                            ? "border-brand-500 bg-brand-50"
                            : "border-gray-200 hover:border-brand-300"
                        }`}
                      >
                        <CreditCard className="w-6 h-6 mx-auto mb-2 text-brand-600" />
                        <div className="text-xs font-bold text-gray-900">Cartão</div>
                        <div className="text-xs text-gray-600">12x sem juros</div>
                      </button>
                      <button
                        onClick={() => {
                          setPaymentMethod("pix")
                          setShowPixDiscount(true)
                        }}
                        className={`p-4 rounded-xl border-2 transition-all relative ${
                          paymentMethod === "pix"
                            ? "border-brand-500 bg-brand-50"
                            : "border-gray-200 hover:border-brand-300"
                        }`}
                      >
                        <div className="absolute -top-2 -right-2 bg-brand-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                          -5%
                        </div>
                        <div className="w-6 h-6 mx-auto mb-2 bg-brand-600 rounded flex items-center justify-center">
                          <div className="text-white font-bold text-xs">PIX</div>
                        </div>
                        <div className="text-xs font-bold text-gray-900">PIX</div>
                        <div className="text-xs text-gray-600">Desconto 5%</div>
                      </button>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        placeholder="Seu nome completo"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        CPF
                      </label>
                      <input
                        type="text"
                        placeholder="000.000.000-00"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    {paymentMethod === "credit" && (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">
                            Número do Cartão
                          </label>
                          <input
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              Validade
                            </label>
                            <input
                              type="text"
                              placeholder="MM/AA"
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">
                              CVV
                            </label>
                            <input
                              type="text"
                              placeholder="123"
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* CTA Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-brand-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-gradient-to-r from-brand-600 to-brand-600 text-white px-6 py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-2">
                      <Lock className="w-5 h-5" />
                      {paymentMethod === "pix" ? "GERAR PIX" : "FINALIZAR COMPRA"}
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </motion.button>

                  <p className="text-xs text-center text-gray-500 mt-4">
                    🔒 Pagamento processado com segurança pelo Mercado Pago
                  </p>
                </motion.div>

                {/* Guarantee Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 bg-brand-50 border-2 border-brand-200 rounded-xl p-4 text-center"
                >
                  <Shield className="w-8 h-8 text-brand-600 mx-auto mb-2" />
                  <div className="font-bold text-brand-900 mb-1">
                    Garantia de 7 Dias
                  </div>
                  <p className="text-xs text-brand-700">
                    Se não gostar, devolvemos 100% do seu dinheiro
                  </p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-500 border-2 border-white"
                  />
                ))}
              </div>
              <span className="text-sm">
                <strong className="text-brand-600">+284 médicos</strong> compraram nas últimas 24h
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
