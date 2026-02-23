import { useToast } from '@/components/ui/use-toast'
import { getErrorMessage } from '@/utils/errorHandler'

export const useErrorHandler = () => {
  const { toast } = useToast()

  const handleError = (error: unknown, customMessage?: string) => {
    const message = customMessage || getErrorMessage(error)
    
    toast({
      variant: 'destructive',
      title: 'Error',
      description: message,
    })
  }

  const handleSuccess = (message: string) => {
    toast({
      title: 'Success',
      description: message,
    })
  }

  return {
    handleError,
    handleSuccess,
  }
}
