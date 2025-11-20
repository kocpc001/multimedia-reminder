/**
 * Calendar Service
 * Handles Google Calendar Link Generation
 */

class CalendarService {
    constructor() {
        this.baseUrl = "https://www.google.com/calendar/render";
    }

    generateLink(reminder) {
        const title = encodeURIComponent("Reminder: " + (reminder.type.toUpperCase()));

        // Format dates: YYYYMMDDTHHMMSSZ
        // Google Calendar expects UTC.
        const date = new Date(reminder.timestamp);
        const start = date.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const end = new Date(date.getTime() + 15 * 60000).toISOString().replace(/-|:|\.\d\d\d/g, ""); // +15 mins

        // Deep Link
        const deepLink = `reminderapp://view_content?id=${reminder.id}`;

        // Web Link (Fallback)
        const webLink = `${window.location.origin}${window.location.pathname}?id=${reminder.id}`;

        const details = encodeURIComponent(
            `View your multimedia reminder here:\n\nApp Link: ${deepLink}\n\nWeb Link: ${webLink}`
        );

        return `${this.baseUrl}?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&sf=true&output=xml`;
    }

    openCalendar(reminder) {
        const link = this.generateLink(reminder);
        window.open(link, '_blank');
    }
}

window.CalendarService = new CalendarService();
