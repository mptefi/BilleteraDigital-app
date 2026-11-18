import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { remindersSupported } from "../services/reminders";

export default function useReminderNavigation({ user, isUnlocked, openHistory, openNotifications }) {
  const [pending, setPending] = useState(null);

  useEffect(() => {
    if (!remindersSupported) return;
    const receive = (response) => {
      const data = response?.notification?.request?.content?.data;
      if (response?.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER &&
          ["movements", "notifications"].includes(data?.route) && typeof data.uid === "string") {
        setPending({ uid: data.uid, route: data.route });
      }
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(receive);
    receive(Notifications.getLastNotificationResponse());
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!pending || !user) return;
    if (pending.uid === user.uid && !isUnlocked) return;
    Notifications.clearLastNotificationResponse();
    setPending(null);
    if (pending.uid !== user.uid) return;
    if (pending.route === "notifications") openNotifications();
    else openHistory();
  }, [isUnlocked, openHistory, openNotifications, pending, user]);
}
