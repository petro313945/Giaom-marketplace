import { useToast } from '@/components/ui/use-toast'
import { getUserFriendlyMessage } from '@/utils/errorUtils'

export const useErrorHandler = () => {
  const { toast } = useToast()

  const handleError = (error: any, customMessage?: string) => {
    const message = customMessage || getUserFriendlyMessage(error)
    
    toast({
      variant: 'destructive',
      title: 'Error',
      description: message,
    })
  }

  const handleSuccess = (message: string) => {
    toast({
      variant: 'success',
      title: 'Success',
      description: message,
    })
  }

  return {
    handleError,
    handleSuccess,
  }
}
