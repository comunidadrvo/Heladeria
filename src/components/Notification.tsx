import React from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  show: boolean;
}

const Notification: React.FC<NotificationProps> = ({ message, type, show }) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'linear-gradient(45deg, #4ecdc4, #44a08d)';
      case 'error':
        return 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
      case 'warning':
        return 'linear-gradient(45deg, #ffeaa7, #fdcb6e)';
      case 'info':
        return 'linear-gradient(45deg, #667eea, #764ba2)';
      default:
        return 'linear-gradient(45deg, #4ecdc4, #44a08d)';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: getBackgroundColor(),
        color: type === 'warning' ? '#333' : 'white',
        padding: '15px 25px',
        borderRadius: '12px',
        fontWeight: 'bold',
        boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
        zIndex: 1000,
        transform: show ? 'translateX(0)' : 'translateX(400px)',
        transition: 'transform 0.3s ease'
      }}
    >
      {message}
    </div>
  );
};

export default Notification;
