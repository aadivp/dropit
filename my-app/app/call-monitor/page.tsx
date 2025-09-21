"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Phone, Clock, CheckCircle, XCircle, Eye, FileText, Activity, RefreshCw, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Call {
  id: string
  customerNumber: string
  status: "active" | "completed" | "failed"
  duration: string
  startTime: string
  issue: string
  outcome?: string
}

interface CallEvent {
  timestamp: string
  event: string
  details: string
}

export default function CallMonitorPage() {
  const [calls, setCalls] = useState<Call[]>([
    {
      id: "call-001",
      customerNumber: "1-800-123-4567",
      status: "active",
      duration: "00:03:45",
      startTime: "2:30 PM",
      issue: "Refund request for defective product",
    },
    {
      id: "call-002",
      customerNumber: "1-888-555-0123",
      status: "completed",
      duration: "00:07:22",
      startTime: "1:15 PM",
      issue: "Bill negotiation - internet service",
      outcome: "Successfully reduced monthly bill by $25",
    },
    {
      id: "call-003",
      customerNumber: "1-877-999-8888",
      status: "failed",
      duration: "00:02:10",
      startTime: "12:45 PM",
      issue: "Return authorization request",
      outcome: "Unable to reach customer service",
    },
    {
      id: "call-004",
      customerNumber: "1-800-SUPPORT",
      status: "completed",
      duration: "00:05:33",
      startTime: "11:30 AM",
      issue: "Subscription cancellation",
      outcome: "Successfully cancelled with partial refund",
    },
  ])

  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [callEvents, setCallEvents] = useState<CallEvent[]>([
    { timestamp: "2:30:15 PM", event: "Call Initiated", details: "AI agent dialing customer service" },
    { timestamp: "2:30:45 PM", event: "Connected", details: "Connected to customer service representative" },
    { timestamp: "2:31:20 PM", event: "Authentication", details: "Providing customer information" },
    { timestamp: "2:32:10 PM", event: "Issue Explanation", details: "Explaining defective product issue" },
    { timestamp: "2:33:30 PM", event: "Negotiating", details: "Requesting full refund and return label" },
  ])

  const [transcript, setTranscript] = useState(`
Agent: Hello, I'm calling regarding order #12345 for a defective product.

Representative: I can help you with that. Can you provide the customer's information?

Agent: The customer is John Smith, email john@example.com, order placed on March 15th.

Representative: I see the order here. What seems to be the issue with the product?

Agent: The customer received a damaged laptop with a cracked screen. They're requesting a full refund and return shipping label.

Representative: Let me check our return policy... I can approve a full refund and we'll email a prepaid return label within 24 hours.

Agent: Perfect, thank you. The customer will receive confirmation via email?

Representative: Yes, they should receive it within the next hour. Is there anything else I can help with?

Agent: No, that resolves the issue. Thank you for your assistance.
  `)

  const refreshCalls = () => {
    // Simulate refreshing call data
    console.log("Refreshing call data...")
  }

  const getStatusIcon = (status: Call["status"]) => {
    switch (status) {
      case "active":
        return <Phone className="h-4 w-4 text-blue-500 animate-pulse" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: Call["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Active</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-hero text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <Image
                  src="/images/drop-it-logo.png"
                  alt="Drop It Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <div>
                  <h1 className="text-xl font-bold">Call Monitor</h1>
                  <p className="text-blue-100 text-sm">Real-time negotiation tracking</p>
                </div>
              </div>
            </div>
            <Button
              onClick={refreshCalls}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Calls</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">5:12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">75%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calls Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Recent Calls</CardTitle>
            <CardDescription>Monitor and manage your AI negotiation calls</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer Number</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(call.status)}
                        {getStatusBadge(call.status)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{call.customerNumber}</TableCell>
                    <TableCell className="max-w-xs truncate">{call.issue}</TableCell>
                    <TableCell>{call.duration}</TableCell>
                    <TableCell>{call.startTime}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedCall(call)}>
                              <Eye className="mr-1 h-3 w-3" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>Call Details - {call.id}</DialogTitle>
                              <DialogDescription>Detailed information about the negotiation call</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-semibold mb-3">Call Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <span>{getStatusBadge(call.status)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Customer Number:</span>
                                    <span>{call.customerNumber}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Duration:</span>
                                    <span>{call.duration}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Start Time:</span>
                                    <span>{call.startTime}</span>
                                  </div>
                                </div>
                                {call.outcome && (
                                  <div className="mt-4">
                                    <h4 className="font-semibold mb-2">Outcome</h4>
                                    <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">{call.outcome}</p>
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold mb-3">Call Events</h4>
                                <ScrollArea className="h-48">
                                  <div className="space-y-3">
                                    {callEvents.map((event, index) => (
                                      <div key={index} className="flex items-start space-x-3">
                                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">{event.event}</span>
                                            <span className="text-xs text-muted-foreground">{event.timestamp}</span>
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1">{event.details}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <FileText className="mr-1 h-3 w-3" />
                              Transcript
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>Call Transcript - {call.id}</DialogTitle>
                              <DialogDescription>
                                Full conversation transcript between AI agent and customer service
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-96">
                              <div className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg">
                                {transcript}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
