import React, { useEffect } from "react";

const Toast = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, notification.duration || 3000);

    return () => clearTimeout(timer);
  }, [notification.id]);

  const getToastClass = (type) => {
    const baseClass =
      "fixed bottom-4 right-4 p-4 rounded-lg shadow-lg max-w-md transform transition-all duration-300 ease-in-out";
    const typeClasses = {
      success: "bg-green-500 text-white",
      error: "bg-red-500 text-white",
      warning: "bg-yellow-500 text-white",
      info: "bg-blue-500 text-white",
      limit: "bg-purple-500 text-white",
    };
    return `${baseClass} ${typeClasses[type] || typeClasses.info}`;
  };

  return (
    <div className={getToastClass(notification.type)}>
      <div className="flex items-center">
        <span className="mr-2">{notification.icon}</span>
        <div>
          <h4 className="font-bold">{notification.title}</h4>
          <p className="text-sm">{notification.message}</p>
        </div>
        {notification.action && (
          <button
            onClick={() => (window.location.href = notification.action.url)}
            className="ml-4 px-3 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-all"
          >
            {notification.action.text}
          </button>
        )}
        <button
          onClick={() => onClose(notification.id)}
          className="ml-4 opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;
