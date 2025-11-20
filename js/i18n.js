/**
 * Internationalization (i18n) Service
 * Handles text translations for the application.
 */

const translations = {
    'en': {
        'app_name': 'RemindMe',
        'manage': 'Manage',
        'done': 'Done',
        'greeting': 'Hello, User',
        'upcoming_reminders': 'You have <span id="reminder-count">0</span> upcoming reminders.',
        'no_reminders_title': 'No Reminders Yet',
        'no_reminders_desc': 'Tap the + button to create your first multimedia reminder.',
        'new_reminder': 'New Reminder',
        'cancel': 'Cancel',
        'save': 'Save',
        'when': 'When?',
        'tab_voice': 'Voice',
        'tab_text': 'Text',
        'tab_doodle': 'Doodle',
        'tap_to_record': 'Tap to Record',
        'recording': 'Recording...',
        'sync_gcal': 'Sync to Google Calendar',
        'alert_title': 'Reminder',
        'now': 'Now',
        'snooze': 'Snooze 5m',
        'complete': 'Complete',
        'placeholder_text': 'Type your note here...',
        'delete_confirm': 'Are you sure you want to delete selected reminders?',
        'mic_error': 'Microphone access denied. Please ensure you are using HTTPS or localhost.',
        'save_success': 'Reminder saved!',
        'error_no_content': 'Please provide some content (Voice, Text, or Doodle).',
        'error_no_time': 'Please select a time for the reminder.'
    },
    'zh-TW': {
        'app_name': '提醒我',
        'manage': '管理',
        'done': '完成',
        'greeting': '你好',
        'upcoming_reminders': '您有 <span id="reminder-count">0</span> 個待辦事項。',
        'no_reminders_title': '尚無提醒',
        'no_reminders_desc': '點擊 + 按鈕建立您的第一個多媒體提醒。',
        'new_reminder': '新增提醒',
        'cancel': '取消',
        'save': '儲存',
        'when': '時間?',
        'tab_voice': '語音',
        'tab_text': '文字',
        'tab_doodle': '塗鴉',
        'tap_to_record': '點擊錄音',
        'recording': '錄音中...',
        'sync_gcal': '同步至 Google 日曆',
        'alert_title': '提醒',
        'now': '現在',
        'snooze': '貪睡 5 分鐘',
        'complete': '完成',
        'placeholder_text': '在此輸入您的筆記...',
        'delete_confirm': '確定要刪除選取的提醒嗎？',
        'mic_error': '無法存取麥克風。請確保您使用的是 HTTPS 或 localhost。',
        'save_success': '提醒已儲存！',
        'error_no_content': '請提供內容（語音、文字或塗鴉）。',
        'error_no_time': '請選擇提醒時間。'
    }
};

class I18nService {
    constructor() {
        this.lang = this.detectLanguage();
        this.data = translations[this.lang] || translations['en'];
    }

    detectLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.toLowerCase().includes('zh')) {
            return 'zh-TW';
        }
        return 'en';
    }

    t(key) {
        return this.data[key] || key;
    }

    updatePage() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (this.data[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = this.data[key];
                } else {
                    el.innerHTML = this.data[key];
                }
            }
        });
    }
}

window.I18nService = new I18nService();
