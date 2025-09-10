interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  timestamp: string;
  userAgent: string;
  userId?: string;
  errorId: string;
}

interface ErrorContext {
  component?: string;
  action?: string;
  props?: any;
  state?: any;
  additionalInfo?: any;
}

class ErrorLogger {
  private errorQueue: ErrorInfo[] = [];
  private isLoggingEnabled = true;

  constructor() {
    // Capturar errores JavaScript globales
    window.addEventListener('error', this.handleGlobalError.bind(this));
    
    // Capturar errores de promesas rechazadas
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
  }

  private generateErrorId(): string {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleGlobalError(event: ErrorEvent) {
    const errorInfo: ErrorInfo = {
      message: event.message,
      stack: event.error?.stack,
      url: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      errorId: this.generateErrorId()
    };

    this.logError(errorInfo);
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    const error = event.reason;
    const errorInfo: ErrorInfo = {
      message: error?.message || 'Promise rejection sin mensaje',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      errorId: this.generateErrorId()
    };

    this.logError(errorInfo);
  }

  public logError(error: Error | ErrorInfo | string, context?: ErrorContext) {
    if (!this.isLoggingEnabled) return;

    let errorInfo: ErrorInfo;

    if (typeof error === 'string') {
      errorInfo = {
        message: error,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        errorId: this.generateErrorId()
      };
    } else if (error instanceof Error) {
      errorInfo = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        errorId: this.generateErrorId()
      };
    } else {
      errorInfo = error;
    }

    // Agregar contexto si se proporciona
    if (context) {
      (errorInfo as any).context = context;
    }

    // Agregar a la cola de errores
    this.errorQueue.push(errorInfo);

    // Log en consola con formato detallado
    this.logToConsole(errorInfo, context);

    // Almacenar en localStorage para persistencia
    this.saveToLocalStorage(errorInfo);

    return errorInfo.errorId;
  }

  private logToConsole(errorInfo: ErrorInfo, context?: ErrorContext) {
    console.group(`🚨 ERROR DETECTADO - ID: ${errorInfo.errorId}`);
    
    console.error('📍 MENSAJE:', errorInfo.message);
    
    if (errorInfo.stack) {
      console.error('📊 STACK TRACE:', errorInfo.stack);
    }
    
    if (errorInfo.componentStack) {
      console.error('⚛️ COMPONENT STACK:', errorInfo.componentStack);
    }
    
    console.info('🕐 TIMESTAMP:', errorInfo.timestamp);
    
    if (errorInfo.url) {
      console.info('📄 ARCHIVO:', errorInfo.url);
      console.info('📍 LÍNEA:', errorInfo.lineNumber);
      console.info('📍 COLUMNA:', errorInfo.columnNumber);
    }
    
    console.info('🌐 USER AGENT:', errorInfo.userAgent);
    
    if (context) {
      console.group('📋 CONTEXTO ADICIONAL:');
      
      if (context.component) {
        console.info('🎯 COMPONENTE:', context.component);
      }
      
      if (context.action) {
        console.info('⚡ ACCIÓN:', context.action);
      }
      
      if (context.props) {
        console.info('🔧 PROPS:', context.props);
      }
      
      if (context.state) {
        console.info('📊 ESTADO:', context.state);
      }
      
      if (context.additionalInfo) {
        console.info('ℹ️ INFO ADICIONAL:', context.additionalInfo);
      }
      
      console.groupEnd();
    }
    
    console.error('🔗 CÓMO REPRODUCIR:');
    console.info('1. Revisa el stack trace arriba');
    console.info('2. Localiza el archivo y línea del error');
    console.info('3. Verifica el contexto del componente');
    console.info('4. Revisa las props y estado si están disponibles');
    
    console.groupEnd();
  }

  private saveToLocalStorage(errorInfo: ErrorInfo) {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      existingErrors.push(errorInfo);
      
      // Mantener solo los últimos 50 errores
      const recentErrors = existingErrors.slice(-50);
      localStorage.setItem('app_errors', JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('No se pudo guardar el error en localStorage:', e);
    }
  }

  public getStoredErrors(): ErrorInfo[] {
    try {
      return JSON.parse(localStorage.getItem('app_errors') || '[]');
    } catch {
      return [];
    }
  }

  public clearStoredErrors() {
    localStorage.removeItem('app_errors');
    this.errorQueue = [];
  }

  public getRecentErrors(): ErrorInfo[] {
    return this.errorQueue.slice(-10);
  }

  public enableLogging() {
    this.isLoggingEnabled = true;
  }

  public disableLogging() {
    this.isLoggingEnabled = false;
  }

  // Método para capturar errores de async/await
  public async catchAsyncError<T>(
    asyncFn: () => Promise<T>, 
    context?: ErrorContext
  ): Promise<T | null> {
    try {
      return await asyncFn();
    } catch (error) {
      this.logError(error as Error, context);
      return null;
    }
  }

  // Método para capturar errores de funciones síncronas
  public catchSyncError<T>(
    syncFn: () => T, 
    context?: ErrorContext
  ): T | null {
    try {
      return syncFn();
    } catch (error) {
      this.logError(error as Error, context);
      return null;
    }
  }
}

// Instancia singleton del logger
export const errorLogger = new ErrorLogger();

// Exportar tipos para uso en otros archivos
export type { ErrorInfo, ErrorContext };