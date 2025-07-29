import { useState, useCallback } from 'react';

interface Notification {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  show: boolean;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<Notification>({
    message: '',
    type: 'success',
    show: false
  });

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setNotification({ message, type, show: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  return { notification, showNotification };
};
