import { useCallback } from 'react';
import { errorLogger, ErrorContext } from '@/utils/errorLogger';
import { toast } from '@/hooks/use-toast';

interface UseErrorHandlerOptions {
  showToast?: boolean;
  toastTitle?: string;
  context?: ErrorContext;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { 
    showToast = true, 
    toastTitle = "Error del Sistema", 
    context 
  } = options;

  const handleError = useCallback((
    error: Error | string, 
    additionalContext?: Partial<ErrorContext>
  ) => {
    const mergedContext = {
      ...context,
      ...additionalContext
    };

    const errorId = errorLogger.logError(error, mergedContext);

    if (showToast) {
      const message = typeof error === 'string' ? error : error.message;
      toast({
        variant: "destructive",
        title: toastTitle,
        description: `${message} (ID: ${errorId})`
      });
    }

    return errorId;
  }, [showToast, toastTitle, context]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    additionalContext?: Partial<ErrorContext>
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, additionalContext);
      return null;
    }
  }, [handleError]);

  const handleSyncError = useCallback(<T>(
    syncFn: () => T,
    additionalContext?: Partial<ErrorContext>
  ): T | null => {
    try {
      return syncFn();
    } catch (error) {
      handleError(error as Error, additionalContext);
      return null;
    }
  }, [handleError]);

  // Hook para envolver componentes con manejo de errores
  const withErrorHandling = useCallback(<T extends any[]>(
    fn: (...args: T) => void | Promise<void>,
    actionName?: string
  ) => {
    return async (...args: T) => {
      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        handleError(error as Error, {
          action: actionName,
          additionalInfo: { arguments: args }
        });
      }
    };
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
    handleSyncError,
    withErrorHandling
  };
};

// Hook especializado para formularios
export const useFormErrorHandler = (formName: string) => {
  return useErrorHandler({
    context: {
      component: formName,
      action: 'form_submission'
    },
    toastTitle: "Error en el Formulario"
  });
};

// Hook especializado para API calls
export const useApiErrorHandler = (apiEndpoint: string) => {
  return useErrorHandler({
    context: {
      component: 'API_CLIENT',
      action: 'api_request',
      additionalInfo: { endpoint: apiEndpoint }
    },
    toastTitle: "Error de Conexión"
  });
};

// Hook especializado para componentes de UI
export const useUIErrorHandler = (componentName: string) => {
  return useErrorHandler({
    context: {
      component: componentName,
      action: 'ui_interaction'
    },
    toastTitle: "Error de Interfaz"
  });
};