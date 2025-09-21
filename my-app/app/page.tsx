"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ChevronDown,
  Calendar,
  Package,
  CreditCard,
  Sparkles,
  Zap,
  ArrowLeft,
  Shield,
  Clock,
  User,
  X,
} from "lucide-react"

export default function Dashboard() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showCallProgress, setShowCallProgress] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [animatedLetters, setAnimatedLetters] = useState<boolean[]>([])
  const [shouldAnimateTitle, setShouldAnimateTitle] = useState(true)
  const titleRef = useRef<HTMLDivElement>(null)
  const factsRef = useRef<HTMLDivElement>(null)
  const faqRef = useRef<HTMLDivElement>(null)
  const [factsVisible, setFactsVisible] = useState(false)
  const [faqVisible, setFaqVisible] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    orderNumber: "",
    orderDetails: "",
    appointmentTime: "",
    appointmentAction: "cancel",
  })
  const [negotiationData, setNegotiationData] = useState({
    userMessage: "",
    orderNumber: "",
    screenshot: null as File | null
  })
  const [negotiationStatus, setNegotiationStatus] = useState({
    id: null as string | null,
    status: 'idle',
    result: null as any
  })
  const [signInData, setSignInData] = useState({
    username: "",
    password: "",
  })

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === titleRef.current) {
            if (entry.isIntersecting && shouldAnimateTitle) {
              setAnimatedLetters([])
              const letters = "drop it.".split("")
              letters.forEach((_, index) => {
                setTimeout(() => {
                  setAnimatedLetters((prev) => {
                    const newState = [...prev]
                    newState[index] = true
                    return newState
                  })
                }, index * 150)
              })
              setShouldAnimateTitle(false)
            } else if (!entry.isIntersecting) {
              setShouldAnimateTitle(true)
            }
          }
          if (entry.target === factsRef.current) {
            setFactsVisible(entry.isIntersecting)
          }
          if (entry.target === faqRef.current) {
            setFaqVisible(entry.isIntersecting)
          }
        })
      },
      { threshold: 0.3 },
    )

    if (titleRef.current) observer.observe(titleRef.current)
    if (factsRef.current) observer.observe(factsRef.current)
    if (faqRef.current) observer.observe(faqRef.current)

    return () => observer.disconnect()
  }, [shouldAnimateTitle])

  // Poll for negotiation status
  useEffect(() => {
    if (negotiationStatus.id && negotiationStatus.status === 'in_progress') {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:3001/status/${negotiationStatus.id}`)
          const data = await response.json()
          
          if (data.status === 'completed') {
            setNegotiationStatus({
              id: data.id,
              status: 'completed',
              result: data.result
            })
            setShowCallProgress(false)
          }
        } catch (error) {
          console.error('Error checking status:', error)
        }
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [negotiationStatus.id, negotiationStatus.status])

  const handleNegotiationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // For return-order, we need userMessage and orderNumber/screenshot
    if (selectedOption === "return-order") {
      if (!negotiationData.userMessage || (!negotiationData.orderNumber && !negotiationData.screenshot)) {
        alert('Please provide either an order number or upload a screenshot')
        return
      }
    }
    
    // For all other options, we need phone number
    if (!formData.phoneNumber) {
      alert('Phone number is required to make the call')
      return
    }

    const requestData = new FormData()
    
    // Add userMessage based on form type
    if (selectedOption === "return-order") {
      requestData.append('userMessage', negotiationData.userMessage)
      if (negotiationData.orderNumber) {
        requestData.append('orderNumber', negotiationData.orderNumber)
      }
      if (negotiationData.screenshot) {
        requestData.append('screenshot', negotiationData.screenshot)
      }
    } else {
      // For other form types, create a userMessage based on the selected option
      let userMessage = ""
      if (selectedOption === "cancel-subscription") {
        userMessage = `Cancel subscription for ${formData.email}`
      } else if (selectedOption === "appointment") {
        const action = formData.appointmentAction || 'cancel'
        if (action === 'book') {
          userMessage = `Book appointment${formData.appointmentTime ? ` for ${formData.appointmentTime}` : ''}`
        } else {
          userMessage = `Cancel appointment${formData.appointmentTime ? ` for ${formData.appointmentTime}` : ''}`
        }
      }
      requestData.append('userMessage', userMessage)
    }
    
    // Add customer data
    if (formData.fullName) {
      requestData.append('fullName', formData.fullName)
    }
    if (formData.email) {
      requestData.append('email', formData.email)
    }
    if (formData.phoneNumber) {
      requestData.append('phoneNumber', formData.phoneNumber)
    }
    if (formData.appointmentTime) {
      requestData.append('appointmentTime', formData.appointmentTime)
    }
    if (formData.appointmentAction) {
      requestData.append('appointmentAction', formData.appointmentAction)
    }

    try {
      console.log('Submitting form with data:', {
        selectedOption,
        userMessage: selectedOption === "return-order" ? negotiationData.userMessage : `Generated message for ${selectedOption}`,
        orderNumber: negotiationData.orderNumber,
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        appointmentTime: formData.appointmentTime,
        appointmentAction: formData.appointmentAction
      })
      
      const response = await fetch('http://localhost:3001/start', {
        method: 'POST',
        body: requestData
      })
      
      const data = await response.json()
      console.log('Response from server:', data)
      
      if (data.success) {
        setNegotiationStatus({
          id: data.negotiationId,
          status: 'in_progress',
          result: null
        })
        setShowCallProgress(true)
      } else {
        alert(`Failed to start negotiation: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error starting negotiation:', error)
      alert(`Error starting negotiation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNegotiationData(prev => ({
        ...prev,
        screenshot: e.target.files![0]
      }))
    }
  }

  const options = [
    {
      id: "cancel-subscription",
      title: "Cancel Subscription",
      description: "End recurring payments and subscriptions",
      icon: CreditCard,
      color: "text-red-500",
    },
    {
      id: "return-order",
      title: "Return Order",
      description: "Process returns and get refunds",
      icon: Package,
      color: "text-blue-500",
    },
    {
      id: "appointment",
      title: "Book/Cancel Appointment",
      description: "Manage your appointments",
      icon: Calendar,
      color: "text-green-500",
    },
  ]

  const handleOptionSelect = (option: (typeof options)[0]) => {
    setSelectedOption(option.id)
    setIsDropdownOpen(false)
  }

  const handleStartAI = () => {
    setShowForm(true)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (selectedOption === "return-order") {
      await handleNegotiationSubmit(new Event('submit') as any)
    } else {
      // For other options, also send to backend
      await handleNegotiationSubmit(new Event('submit') as any)
    }
  }

  const handleSignInSubmit = () => {
    console.log("Sign in:", signInData)
    setShowSignIn(false)
    // Handle sign in logic here
  }

  const handleSignInInputChange = (field: string, value: string) => {
    setSignInData((prev) => ({ ...prev, [field]: value }))
  }

  const renderForm = () => {
    if (!selectedOption) return null

    switch (selectedOption) {
      case "return-order":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="userMessage" className="text-sm font-medium text-white/90">
                What would you like us to help you with?
              </Label>
              <Textarea
                id="userMessage"
                placeholder="E.g., Get me a refund for my Chipotle order, Return this defective product, Cancel my subscription..."
                value={negotiationData.userMessage}
                onChange={(e) => setNegotiationData(prev => ({...prev, userMessage: e.target.value}))}
                className="mt-2 glass border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label htmlFor="orderNumber" className="text-sm font-medium text-white/90">
                Order Number (Optional if you upload a screenshot)
              </Label>
              <Input
                id="orderNumber"
                placeholder="Enter your order number"
                value={negotiationData.orderNumber}
                onChange={(e) => setNegotiationData(prev => ({...prev, orderNumber: e.target.value}))}
                className="mt-2 glass border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label htmlFor="screenshot" className="text-sm font-medium text-white/90">
                Upload Screenshot (Optional if you have order number)
              </Label>
              <Input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-2 glass border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="fullName" className="text-sm font-medium text-white/90">
                Full Name
              </Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className="mt-2 glass border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-white/90">
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                className="mt-2 glass border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
        )

      case "cancel-subscription":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-white/90">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="mt-2 glass border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label htmlFor="fullName" className="text-sm font-medium text-white/90">
                Full Name
              </Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className="mt-2 glass border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-white/90">
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                className="mt-2 glass border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
        )

      case "appointment":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="appointmentAction" className="text-sm font-medium text-white/90">
                Action
              </Label>
              <select
                id="appointmentAction"
                value={formData.appointmentAction || 'cancel'}
                onChange={(e) => handleInputChange("appointmentAction", e.target.value)}
                className="mt-2 w-full px-3 py-2 glass border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="cancel">Cancel Appointment</option>
                <option value="book">Book Appointment</option>
              </select>
            </div>
            <div>
              <Label htmlFor="appointmentTime" className="text-sm font-medium text-white/90">
                {formData.appointmentAction === 'book' ? 'Preferred Appointment Time' : 'Appointment Time to Cancel'}
              </Label>
              <Input
                id="appointmentTime"
                placeholder={formData.appointmentAction === 'book' ? 'e.g., March 15th at 2:00 PM' : 'e.g., March 15th at 2:00 PM'}
                value={formData.appointmentTime}
                onChange={(e) => handleInputChange("appointmentTime", e.target.value)}
                className="mt-2 glass border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-white/90">
                Phone Number *
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1234567890"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                className="mt-2 glass border-white/20 text-white placeholder:text-white/50"
                required
              />
            </div>
            <div>
              <Label htmlFor="fullName" className="text-sm font-medium text-white/90">
                Full Name
              </Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className="mt-2 glass border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderAnimatedTitle = () => {
    const text = "drop it."
    return (
      <div className="flex items-baseline">
        {text.split("").map((letter, index) => (
          <span
            key={index}
            className={`letter-animation ${letter === "i" || letter === "t" || letter === "." ? "text-primary" : "text-white"} ${
              animatedLetters[index] ? "animate-letter-drop" : "opacity-0"
            }`}
            style={{
              marginRight: letter === " " ? "0.5rem" : "0",
            }}
          >
            {letter === " " ? "\u00A0" : letter}
          </span>
        ))}
      </div>
    )
  }

  const faqs = [
    {
      question: "How does the AI assistant work?",
      answer:
        "Our AI assistant uses advanced natural language processing to understand your request and handle the negotiation process automatically, saving you time and stress.",
    },
    {
      question: "Is my personal information secure?",
      answer:
        "Yes, all your data is encrypted end-to-end and never stored permanently. We follow strict privacy protocols to protect your information.",
    },
    {
      question: "What types of services can you help with?",
      answer:
        "We can help with subscription cancellations, order returns, and appointment management. Our AI is trained to handle various customer service scenarios.",
    },
    {
      question: "How long does the process take?",
      answer:
        "Most requests are processed within minutes. Our AI works 24/7 to ensure quick resolution of your issues.",
    },
  ]

  if (showCallProgress) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-blue-900/20 border-b border-white/10">
          <div className="container mx-auto px-4 py-2 flex items-center justify-end">
            <Button
              onClick={() => setShowSignIn(true)}
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <User className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </div>
        </div>

        <div className="text-center">
          {negotiationStatus.status === 'in_progress' ? (
            <>
              <h1 className="text-8xl font-bold text-white mb-8">Call in progress...</h1>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
              </div>
              <p className="text-white/70 mt-4">Our AI is negotiating on your behalf</p>
            </>
          ) : negotiationStatus.status === 'completed' && negotiationStatus.result ? (
            <>
              <h1 className="text-6xl font-bold text-white mb-8">Negotiation Complete!</h1>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
                <h2 className="text-2xl font-semibold text-white mb-4">Result:</h2>
                <p className="text-white/90 mb-4">{negotiationStatus.result.refund}</p>
                <p className="text-white/70">Confirmation Code: <span className="font-mono text-green-400">{negotiationStatus.result.code}</span></p>
              </div>
              <Button 
                onClick={() => {
                  setShowCallProgress(false)
                  setNegotiationStatus({id: null, status: 'idle', result: null})
                  setNegotiationData({userMessage: '', orderNumber: '', screenshot: null})
                }}
                className="mt-8 bg-primary hover:bg-primary/80 text-white px-8 py-3 rounded-xl"
              >
                Start New Negotiation
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-8xl font-bold text-white mb-8">Call in progress...</h1>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-slate-900 relative overflow-hidden">
        <div className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-blue-900/20 border-b border-white/10">
          <div className="container mx-auto px-4 py-2 flex items-center justify-end">
            <Button
              onClick={() => setShowSignIn(true)}
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <User className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16 pt-20">
          <div className="max-w-2xl mx-auto">
            <Button onClick={() => setShowForm(false)} variant="ghost" className="mb-8 text-white/70 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to service selection
            </Button>

            <div className="glass rounded-3xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4 text-white">
                  {options.find((opt) => opt.id === selectedOption)?.title}
                </h2>
                <p className="text-white/80">Please provide the following information so our AI can assist you</p>
              </div>

              {renderForm()}

              <div className="mt-8 space-y-4">
                <Button
                  onClick={handleSubmit}
                  className="w-full h-14 text-lg font-semibold gradient-primary text-white rounded-2xl hover:shadow-2xl transition-all duration-300"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Start AI Call
                </Button>
              </div>
            </div>
          </div>
        </div>

        {showSignIn && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass rounded-3xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Sign In</h3>
                <Button
                  onClick={() => setShowSignIn(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-sm font-medium text-white/90">
                    Username
                  </Label>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    value={signInData.username}
                    onChange={(e) => handleSignInInputChange("username", e.target.value)}
                    className="mt-2 glass border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-white/90">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={signInData.password}
                    onChange={(e) => handleSignInInputChange("password", e.target.value)}
                    className="mt-2 glass border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSignInSubmit}
                    className="flex-1 h-12 gradient-primary text-white rounded-2xl hover:shadow-2xl transition-all duration-300"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => {
                      console.log("Sign up clicked")
                      // Handle sign up logic here
                    }}
                    className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white rounded-2xl transition-all duration-300"
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-slate-900 relative overflow-hidden">
      <div className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-blue-900/20 border-b border-white/10">
        <div className="container mx-auto px-4 py-2 flex items-center justify-end">
          <Button
            onClick={() => setShowSignIn(true)}
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <User className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-16">
        <div className="min-h-screen flex items-center justify-center">
          <div ref={titleRef} className="flex items-center gap-16 max-w-6xl w-full">
            <div className="flex-1">
              <h1 className="text-8xl font-bold leading-none">{renderAnimatedTitle()}</h1>
            </div>

            <div className="flex-1 max-w-lg">
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full backdrop-blur-xl bg-white/10 border border-white/20 hover-bend rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-2xl hover:bg-white/15 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {selectedOption ? (
                        <>
                          {(() => {
                            const option = options.find((opt) => opt.id === selectedOption)
                            const IconComponent = option?.icon || Sparkles
                            return (
                              <>
                                <div className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm ${option?.color}`}>
                                  <IconComponent className="h-6 w-6" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg text-white">{option?.title}</h3>
                                  <p className="text-sm text-white/60">{option?.description}</p>
                                </div>
                              </>
                            )
                          })()}
                        </>
                      ) : (
                        <>
                          <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm">
                            <Sparkles className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-lg text-white/50">Select a service</h3>
                            <p className="text-sm text-white/40">Choose what you need help with</p>
                          </div>
                        </>
                      )}
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform duration-300 text-white/70 ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden z-50 animate-fade-in-up">
                    {options.map((option, index) => {
                      const IconComponent = option.icon
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleOptionSelect(option)}
                          className="w-full p-6 text-left hover:bg-white/10 transition-all duration-200 border-b border-white/10 last:border-b-0 group"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm ${option.color} group-hover:scale-110 transition-transform duration-200`}
                            >
                              <IconComponent className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-white">{option.title}</h3>
                              <p className="text-sm text-white/60">{option.description}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {selectedOption && (
                <div className="mt-6 animate-fade-in-up">
                  <Button
                    onClick={handleStartAI}
                    className="w-full h-14 text-lg font-semibold gradient-primary text-white rounded-2xl hover:shadow-2xl transition-all duration-300"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    Start AI Assistant
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSignIn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-3xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Sign In</h3>
              <Button
                onClick={() => setShowSignIn(false)}
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-white/90">
                  Username
                </Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={signInData.username}
                  onChange={(e) => handleSignInInputChange("username", e.target.value)}
                  className="mt-2 glass border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-white/90">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={signInData.password}
                  onChange={(e) => handleSignInInputChange("password", e.target.value)}
                  className="mt-2 glass border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleSignInSubmit}
                  className="flex-1 h-12 gradient-primary text-white rounded-2xl hover:shadow-2xl transition-all duration-300"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => {
                    console.log("Sign up clicked")
                    // Handle sign up logic here
                  }}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white rounded-2xl transition-all duration-300"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={factsRef} className="container mx-auto px-4 py-32">
        <div
          className={`transition-all duration-1000 ${factsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center group">
              <div className="glass rounded-3xl p-8 hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Lightning Fast</h3>
                <p className="text-white/70 leading-relaxed">AI processes your request in seconds, not hours</p>
              </div>
            </div>

            <div className="text-center group">
              <div className="glass rounded-3xl p-8 hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">100% Secure</h3>
                <p className="text-white/70 leading-relaxed">Your data is encrypted and never stored permanently</p>
              </div>
            </div>

            <div className="text-center group">
              <div className="glass rounded-3xl p-8 hover:scale-105 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">24/7 Available</h3>
                <p className="text-white/70 leading-relaxed">Our AI never sleeps, always ready to help</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={faqRef} className="container mx-auto px-4 py-32">
        <div
          className={`transition-all duration-1000 ${faqVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6 text-white">FAQ</h2>
              <p className="text-xl text-white/70">Everything you need to know about our AI assistant</p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="glass rounded-2xl p-8 hover:bg-white/15 transition-all duration-300">
                  <h3 className="text-xl font-semibold mb-4 text-white">{faq.question}</h3>
                  <p className="text-white/70 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
