import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  return (
    <>
      <div className="space-y-4 overflow-y-scroll lg:overflow-y-hidden max-h-[506px] h-full">
        {notifications.map((notification, index) => (
          <article key={index} className="flex w-full flex-col space-y-8 rounded-lg h-fit bg-white/5 p-4">
            <div className="flex gap-4">
              <div className="space-y-1">
                <h3 className="font-medium">{notification.title}</h3>
                <p className="text-sm text-slate-400">{new Date(notification.createdAt).toLocaleDateString()}</p>
                <p className="text-sm text-slate-400">{notification.message}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
};

export default Notification;