import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2, AlertCircle, Bell } from "lucide-react";
import { format, isToday, isTomorrow, isPast, differenceInDays, parseISO } from "date-fns";
import { Contact } from "@/pages/Dashboard";

interface FollowUpRemindersSectionProps {
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
}

interface FollowUpContact extends Contact {
  daysUntil: number;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
}

export const FollowUpRemindersSection = ({
  contacts,
  onContactClick,
}: FollowUpRemindersSectionProps) => {
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<FollowUpContact[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then(setNotificationPermission);
    } else if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }

    // Filter and sort contacts with follow-up dates
    const now = new Date();
    const followUps: FollowUpContact[] = contacts
      .filter((contact) => contact.follow_up_date)
      .map((contact) => {
        try {
          // Handle both ISO string and Date object formats
          const followUpDate = contact.follow_up_date instanceof Date 
            ? contact.follow_up_date 
            : parseISO(contact.follow_up_date!);
          
          // Validate date
          if (isNaN(followUpDate.getTime())) {
            return null;
          }
          
          const daysUntil = differenceInDays(followUpDate, now);
          
          return {
            ...contact,
            daysUntil,
            isOverdue: isPast(followUpDate) && !isToday(followUpDate),
            isToday: isToday(followUpDate),
            isTomorrow: isTomorrow(followUpDate),
          };
        } catch (error) {
          console.error('Error parsing follow-up date:', error, contact);
          return null;
        }
      })
      .filter((contact): contact is FollowUpContact => contact !== null)
      .sort((a, b) => {
        // Sort: overdue first, then today, then tomorrow, then by date
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.isToday && !b.isToday) return -1;
        if (!a.isToday && b.isToday) return 1;
        if (a.isTomorrow && !b.isTomorrow) return -1;
        if (!a.isTomorrow && b.isTomorrow) return 1;
        return a.daysUntil - b.daysUntil;
      })
      .slice(0, 10); // Show top 10

    setUpcomingFollowUps(followUps);

    // Check for due reminders and show notifications
    const dueReminders = followUps.filter((f) => f.isToday || f.isOverdue);
    if (dueReminders.length > 0 && notificationPermission === "granted" && "Notification" in window) {
      try {
        dueReminders.forEach((reminder) => {
          new Notification(`Follow-up reminder: ${reminder.name}`, {
            body: reminder.follow_up_notes || `Time to follow up with ${reminder.name}`,
            icon: "/favicon.png",
            tag: `follow-up-${reminder.id}`,
          });
        });
      } catch (error) {
        console.error('Error showing notifications:', error);
      }
    }
  }, [contacts, notificationPermission]);

  const getReminderBadge = (followUp: FollowUpContact) => {
    if (followUp.isOverdue) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          Overdue
        </Badge>
      );
    }
    if (followUp.isToday) {
      return (
        <Badge variant="default" className="gap-1 bg-orange-500">
          <Clock className="w-3 h-3" />
          Today
        </Badge>
      );
    }
    if (followUp.isTomorrow) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="w-3 h-3" />
          Tomorrow
        </Badge>
      );
    }
    if (followUp.daysUntil <= 7) {
      return (
        <Badge variant="outline" className="gap-1">
          <Calendar className="w-3 h-3" />
          {followUp.daysUntil} days
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Calendar className="w-3 h-3" />
        {(() => {
          try {
            const date = followUp.follow_up_date instanceof Date 
              ? followUp.follow_up_date 
              : parseISO(followUp.follow_up_date!);
            return format(date, "MMM d");
          } catch {
            return "Invalid date";
          }
        })()}
      </Badge>
    );
  };

  if (upcomingFollowUps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Follow-up Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No upcoming follow-ups. Add a follow-up date to any contact to get reminders.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overdueCount = upcomingFollowUps.filter((f) => f.isOverdue).length;
  const todayCount = upcomingFollowUps.filter((f) => f.isToday).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Follow-up Reminders
          </CardTitle>
          {(overdueCount > 0 || todayCount > 0) && (
            <Badge variant={overdueCount > 0 ? "destructive" : "default"} className="gap-1">
              {overdueCount > 0 && `${overdueCount} overdue`}
              {overdueCount > 0 && todayCount > 0 && " • "}
              {todayCount > 0 && `${todayCount} today`}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingFollowUps.map((followUp) => (
            <div
              key={followUp.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                followUp.isOverdue
                  ? "border-destructive bg-destructive/5"
                  : followUp.isToday
                  ? "border-orange-500 bg-orange-500/5"
                  : "border-border bg-card"
              }`}
              onClick={() => onContactClick(followUp)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-base truncate">{followUp.name}</h4>
                    {getReminderBadge(followUp)}
                  </div>
                  {followUp.company && (
                    <p className="text-sm text-muted-foreground truncate mb-1">
                      {followUp.company}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {(() => {
                        try {
                          const date = followUp.follow_up_date instanceof Date 
                            ? followUp.follow_up_date 
                            : parseISO(followUp.follow_up_date!);
                          return format(date, "EEEE, MMMM d, yyyy");
                        } catch {
                          return "Invalid date";
                        }
                      })()}
                    </span>
                  </div>
                  {followUp.follow_up_notes && (
                    <p className="text-sm text-foreground line-clamp-2 mt-2">
                      {followUp.follow_up_notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {contacts.filter((c) => c.follow_up_date).length > 10 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Showing 10 of {contacts.filter((c) => c.follow_up_date).length} upcoming follow-ups
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

