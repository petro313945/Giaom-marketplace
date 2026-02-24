import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { useToast } from './ui/use-toast'
import { useAuth } from '../context/AuthContext'
import * as reportService from '../services/reportService'
import { AlertCircle } from 'lucide-react'

interface ReportDialogProps {
  reportedType: 'product' | 'user' | 'review'
  reportedId: string
  reportedTitle?: string // For display purposes
  trigger?: React.ReactNode
}

const REPORT_REASONS: { [key: string]: string[] } = {
  product: [
    'Fake or counterfeit',
    'Inappropriate content',
    'Misleading description',
    'Policy violation',
    'Spam',
    'Other'
  ],
  user: [
    'Harassment',
    'Spam',
    'Inappropriate behavior',
    'Scam or fraud',
    'Policy violation',
    'Other'
  ],
  review: [
    'Spam',
    'Inappropriate content',
    'Fake review',
    'Offensive language',
    'Policy violation',
    'Other'
  ]
}

export default function ReportDialog({
  reportedType,
  reportedId,
  reportedTitle,
  trigger
}: ReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to submit a report.',
        variant: 'destructive',
      })
      return
    }

    if (!reason) {
      toast({
        title: 'Reason Required',
        description: 'Please select a reason for reporting.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      await reportService.submitReport({
        reportedType,
        reportedId,
        reason,
        description: description.trim() || undefined
      })
      toast({
        title: 'Report Submitted',
        description: 'Thank you for your report. We will review it shortly.',
        variant: 'default',
      })
      setOpen(false)
      setReason('')
      setDescription('')
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to submit report'
      toast({
        title: 'Report Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <AlertCircle className="h-4 w-4" />
      Report
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report {reportedType === 'product' ? 'Product' : reportedType === 'user' ? 'User' : 'Review'}</DialogTitle>
          <DialogDescription>
            {reportedTitle && (
              <span className="block mb-2 font-medium">{reportedTitle}</span>
            )}
            Please provide details about why you're reporting this content. Our team will review your report.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason *</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS[reportedType].map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Details (Optional)</label>
            <Textarea
              placeholder="Provide any additional information that might help us understand the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/1000 characters
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              setReason('')
              setDescription('')
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
