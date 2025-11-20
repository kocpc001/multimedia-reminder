/**
 * Main Application Logic
 */

class App {
    constructor() {
        this.store = window.StorageService;
        this.calendar = window.CalendarService;
        this.recorder = window.RecorderService;
        this.canvas = window.CanvasService;
        this.i18n = window.I18nService;

        this.currentType = 'voice';
        this.audioBlob = null;
        this.isSelectionMode = false;
        this.alarmInterval = null;
        this.audioContext = null;

        this.init();
    }

    async init() {
        try {
            // Initialize Services
            this.i18n.updatePage();
            await this.recorder.init(document.getElementById('audio-visualizer'));
            this.canvas.init(document.getElementById('doodle-canvas'));

            // Event Listeners
            this.setupEventListeners();

            // Check for Deep Link
            this.checkDeepLink();

            // Load Reminders
            this.loadReminders();

            // Start Polling
            setInterval(() => this.checkDueReminders(), 10000); // Every 10s

            // Request Notification Permission
            if ("Notification" in window) {
                Notification.requestPermission();
            }
        } catch (e) {
            console.error("App initialization failed:", e);
            alert("App failed to initialize. See console for details.");
        }
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('fab-add').addEventListener('click', () => this.showView('add-view'));
        document.getElementById('close-add-btn').addEventListener('click', () => this.showView('home-view'));

        // Manage / Delete Mode
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.toggleSelectionMode());

        const deleteBtn = document.getElementById('delete-selected-btn');
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteSelectedReminders());

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Recording
        const recordBtn = document.getElementById('record-toggle');
        recordBtn.addEventListener('click', async () => {
            if (this.recorder.isRecording) {
                this.audioBlob = await this.recorder.stopRecording();
                recordBtn.classList.remove('recording');
                document.getElementById('record-status').innerText = this.i18n.t('tap_to_record'); // Reset text

                const url = this.recorder.getAudioUrl();
                const audioPreview = document.getElementById('audio-preview');
                audioPreview.src = url;
                audioPreview.hidden = false;
                document.getElementById('delete-audio').hidden = false;
            } else {
                const started = await this.recorder.startRecording();
                if (started) {
                    recordBtn.classList.add('recording');
                    document.getElementById('record-status').innerText = this.i18n.t('recording');
                    document.getElementById('audio-preview').hidden = true;
                    document.getElementById('delete-audio').hidden = true;
                }
            }
        });

        document.getElementById('delete-audio').addEventListener('click', () => {
            this.audioBlob = null;
            document.getElementById('audio-preview').hidden = true;
            document.getElementById('delete-audio').hidden = true;
            document.getElementById('record-status').innerText = this.i18n.t('tap_to_record');
        });

        // Canvas Colors
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.canvas.setColor(e.currentTarget.dataset.color);
            });
        });

        document.getElementById('clear-canvas').addEventListener('click', () => this.canvas.clear());

        // Save
        document.getElementById('save-btn').addEventListener('click', () => this.saveReminder());

        // Alert Actions
        document.getElementById('dismiss-btn').addEventListener('click', () => {
            this.showView('home-view');
            this.stopAlarm();
            // Stop audio if playing
            const audio = document.querySelector('#alert-content-area audio');
            if (audio) audio.pause();
        });

        document.getElementById('snooze-btn').addEventListener('click', () => {
            // Snooze logic (add 5 mins to current reminder)
            // For simplicity, just hide for now
            this.showView('home-view');
            this.stopAlarm();
            const audio = document.querySelector('#alert-content-area audio');
            if (audio) audio.pause();
        });
    }

    showView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');

        // Reset selection mode when leaving home
        if (viewId !== 'home-view') {
            this.isSelectionMode = false;
            document.body.classList.remove('selection-mode');
            // Reset Manage button text
            document.getElementById('settings-btn').innerText = this.i18n.t('manage');
        }

        if (viewId === 'home-view') {
            this.loadReminders();
        }
    }

    switchTab(tabId) {
        this.currentType = tabId;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.getElementById(`tab-${tabId}`).classList.add('active');

        // Resize canvas if switching to doodle
        if (tabId === 'doodle') {
            this.canvas.resize();
        }
    }

    generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for non-secure contexts
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async saveReminder() {
        const timeInput = document.getElementById('reminder-time').value;
        if (!timeInput) {
            alert(this.i18n.t('error_no_time'));
            return;
        }

        const timestamp = new Date(timeInput).getTime();
        const id = this.generateUUID();
        const sync = document.getElementById('sync-gcal').checked;

        let content = null;
        let textContent = null;

        if (this.currentType === 'voice') {
            // Auto-stop if recording
            if (this.recorder.isRecording) {
                this.audioBlob = await this.recorder.stopRecording();
                document.getElementById('record-toggle').classList.remove('recording');
            }

            if (!this.audioBlob) {
                alert(this.i18n.t('error_no_content'));
                return;
            }
            content = this.audioBlob;
        } else if (this.currentType === 'text') {
            textContent = document.getElementById('reminder-text').value;
            if (!textContent) {
                alert(this.i18n.t('error_no_content'));
                return;
            }
        } else if (this.currentType === 'doodle') {
            content = await this.canvas.getImageBlob();
            if (!content) {
                alert(this.i18n.t('error_no_content'));
                return;
            }
        }

        const reminder = {
            id,
            timestamp,
            type: this.currentType,
            content,
            textContent,
            sync,
            status: 'pending'
        };

        try {
            await this.store.saveReminder(reminder);

            if (sync) {
                this.calendar.openCalendar(reminder);
            }

            this.showView('home-view');
            this.resetForm();
            // Optional: Toast notification
            // alert(this.i18n.t('save_success')); 
        } catch (err) {
            console.error(err);
            alert("Failed to save reminder: " + err.message);
        }
    }

    resetForm() {
        document.getElementById('reminder-time').value = '';
        document.getElementById('reminder-text').value = '';
        this.audioBlob = null;
        document.getElementById('audio-preview').hidden = true;
        document.getElementById('delete-audio').hidden = true;
        document.getElementById('record-status').innerText = this.i18n.t('tap_to_record');
        this.canvas.clear();
        this.switchTab('voice');
    }

    toggleSelectionMode() {
        this.isSelectionMode = !this.isSelectionMode;
        document.body.classList.toggle('selection-mode', this.isSelectionMode);

        // Update button text
        const btn = document.getElementById('settings-btn');
        btn.innerText = this.isSelectionMode ? this.i18n.t('done') : this.i18n.t('manage');

        this.loadReminders(); // Re-render to show/hide checkboxes
    }

    async deleteSelectedReminders() {
        const checkboxes = document.querySelectorAll('.reminder-checkbox:checked');
        if (checkboxes.length === 0) return;

        if (!confirm(this.i18n.t('delete_confirm'))) return;

        for (const cb of checkboxes) {
            await this.store.deleteReminder(cb.value);
        }

        this.isSelectionMode = false;
        document.body.classList.remove('selection-mode');
        document.getElementById('settings-btn').innerText = this.i18n.t('manage');
        this.loadReminders();
    }

    async loadReminders() {
        const list = document.getElementById('reminder-list');
        const reminders = await this.store.getAllReminders();

        const countEl = document.getElementById('reminder-count');
        if (countEl) {
            countEl.innerText = reminders.filter(r => r.timestamp > Date.now()).length;
        }

        if (reminders.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-clipboard-list"></i></div>
                    <h3>${this.i18n.t('no_reminders_title')}</h3>
                    <p>${this.i18n.t('no_reminders_desc')}</p>
                </div>`;
            return;
        }

        list.innerHTML = '';
        reminders.forEach(r => {
            const date = new Date(r.timestamp);
            const isPast = date < new Date();

            const card = document.createElement('div');
            card.className = 'reminder-card';

            // Checkbox for selection mode
            if (this.isSelectionMode) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'reminder-checkbox';
                checkbox.value = r.id;
                card.appendChild(checkbox);
            }

            const contentDiv = document.createElement('div');
            contentDiv.className = 'reminder-content-wrapper';
            contentDiv.innerHTML = `
                <div class="card-icon">
                    <i class="fas fa-${r.type === 'voice' ? 'microphone' : r.type === 'text' ? 'align-left' : 'paint-brush'}"></i>
                </div>
                <div class="card-info">
                    <div class="card-time">${date.toLocaleString()}</div>
                    <div class="card-preview">${this.getPreviewText(r)}</div>
                </div>
                ${isPast ? '<i class="fas fa-check-circle" style="color: var(--success)"></i>' : ''}
            `;

            // Only trigger alert if NOT in selection mode
            contentDiv.addEventListener('click', (e) => {
                if (!this.isSelectionMode) {
                    this.triggerAlert(r);
                } else {
                    // Toggle checkbox if clicking card in selection mode
                    const cb = card.querySelector('.reminder-checkbox');
                    if (cb) cb.checked = !cb.checked;
                }
            });

            card.appendChild(contentDiv);
            list.appendChild(card);
        });
    }

    getPreviewText(reminder) {
        if (reminder.type === 'text') return reminder.textContent.substring(0, 30) + '...';
        if (reminder.type === 'voice') return this.i18n.t('tab_voice');
        if (reminder.type === 'doodle') return this.i18n.t('tab_doodle');
        return 'Reminder';
    }

    async checkDueReminders() {
        const reminders = await this.store.getAllReminders();
        const now = Date.now();

        reminders.forEach(r => {
            if (r.status === 'pending' && r.timestamp <= now) {
                // Trigger!
                this.triggerAlert(r);

                // Update status
                r.status = 'completed';
                this.store.saveReminder(r);

                // Notification
                if (Notification.permission === "granted") {
                    new Notification("Multimedia Reminder", {
                        body: "You have a new reminder!",
                        icon: "icon.png" // placeholder
                    });
                }
            }
        });
    }

    async checkDeepLink() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            const reminder = await this.store.getReminder(id);
            if (reminder) {
                this.triggerAlert(reminder);
            } else {
                // Try to find it? Or maybe it's not synced yet?
                // For local-first, if it's not in IDB, we can't show it.
                console.log("Reminder not found locally");
            }
        }
    }

    triggerAlert(reminder) {
        const alertView = document.getElementById('alert-view');
        const contentArea = document.getElementById('alert-content-area');
        const title = document.getElementById('alert-title');
        const time = document.getElementById('alert-time');

        title.innerText = this.i18n.t('alert_title');
        time.innerText = new Date(reminder.timestamp).toLocaleString();

        contentArea.innerHTML = '';

        if (reminder.type === 'voice') {
            const url = URL.createObjectURL(reminder.content);
            const audio = document.createElement('audio');
            audio.src = url;
            audio.controls = true;
            audio.autoplay = false; // Don't autoplay voice note if alarm is ringing
            audio.style.width = '100%';
            contentArea.appendChild(audio);
        } else if (reminder.type === 'text') {
            const p = document.createElement('p');
            p.style.fontSize = '1.5rem';
            p.innerText = reminder.textContent;
            contentArea.appendChild(p);
        } else if (reminder.type === 'doodle') {
            const url = URL.createObjectURL(reminder.content);
            const img = document.createElement('img');
            img.src = url;
            contentArea.appendChild(img);
        }

        this.showView('alert-view');
        this.startAlarm();
    }

    startAlarm() {
        if (this.alarmInterval) return;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        const playBeep = () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5
            oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.5);

            gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.5);
        };

        playBeep();
        this.alarmInterval = setInterval(playBeep, 1000); // Beep every second
    }

    stopAlarm() {
        if (this.alarmInterval) {
            clearInterval(this.alarmInterval);
            this.alarmInterval = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

// Start App
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
