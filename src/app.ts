console.log('app.ts is loaded');

import { AttendanceRecord } from './types.js';

export class AttendanceSystem {
    private attendanceRecords: Array<{
        employeeId: string;
        employeeName: string;
        checkIn: string;
        checkOut: string | null;
        status: 'Present' | 'Checked Out';
        date: string;
    }> = [];
    private apiUrl = '/api/attendance';
    private googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSexvLFYNSlaA92_EDQAuWKqR9Rf25B8FHhdKnpa92x_D7cpyg/formResponse';
    private midnightTimeout: NodeJS.Timeout | null = null;

    constructor() {
        console.log('AttendanceSystem initialized');
        this.initializeEventListeners();
        this.loadAttendanceData();
        this.setupMidnightReset();
    }

    private initializeEventListeners(): void {
        console.log('Setting up event listeners...');
        
        const checkInButton = document.getElementById('checkIn');
        const checkOutButton = document.getElementById('checkOut');
        const exportButton = document.getElementById('exportExcel');

        if (checkInButton) {
            console.log('Check In button found');
            checkInButton.onclick = () => {
                console.log('Check In clicked');
                this.markAttendance('in');
            };
        } else {
            console.error('Check In button not found');
        }

        if (checkOutButton) {
            console.log('Check Out button found');
            checkOutButton.onclick = () => {
                console.log('Check Out clicked');
                this.markAttendance('out');
            };
        } else {
            console.error('Check Out button not found');
        }

        if (exportButton) {
            console.log('Export button found');
            exportButton.onclick = () => {
                console.log('Export clicked');
                this.exportToExcel();
            };
        } else {
            console.error('Export button not found');
        }

        console.log('Event listeners initialized');
    }

    private exportToExcel(): void {
        window.location.href = `${this.apiUrl}/export`;
    }

    private async loadAttendanceData(): Promise<void> {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const records = await response.json();
            
            // Only load today's records
            const today = this.formatDate(new Date());
            this.attendanceRecords = records.filter(
                (record: AttendanceRecord) => record.date === today
            );
            
            this.updateAttendanceTable();
        } catch (error) {
            console.error('Error loading attendance data:', error);
            this.showToast('Error loading attendance data. Please try again.', 'error');
        }
    }

    private isValidEmployeeId(id: string): boolean {
        return /^\d+$/.test(id);
    }

    private async submitToGoogleForm(data: AttendanceRecord) {
        try {
            // Create form data
            const formData = new URLSearchParams();
            formData.append('entry.891535886', data.employeeId);
            formData.append('entry.474494596', data.employeeName);
            formData.append('entry.1816829517', data.checkIn);
            formData.append('entry.87362829', data.checkOut || '');
            formData.append('entry.425001362', data.date);

            // Submit using fetch with no-cors mode
            const response = await fetch(this.googleFormUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });

            // In no-cors mode, we won't get a proper response
            // but if we reach here, it means the request was sent
            console.log('Form submitted:', data);
            return true;

        } catch (error) {
            console.error('Error submitting to Google Form:', error);
            return false;
        }
    }

    private formatTime(date: Date): string {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    private showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
        const container = document.querySelector('.toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Get icon based on type
        let icon = '🔔';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">×</button>
        `;

        container.appendChild(toast);

        // Add click handler for close button
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                toast.style.animation = 'slideOut 0.3s ease-in-out forwards';
                setTimeout(() => container.removeChild(toast), 300);
            });
        }

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (container.contains(toast)) {
                toast.style.animation = 'slideOut 0.3s ease-in-out forwards';
                setTimeout(() => container.removeChild(toast), 300);
            }
        }, 5000);
    }

    private async markAttendance(type: 'in' | 'out'): Promise<void> {
        const employeeId = (document.getElementById('employeeId') as HTMLInputElement).value;
        const employeeName = (document.getElementById('employeeName') as HTMLInputElement).value;

        if (!employeeId || !employeeName) {
            alert('Please enter both Employee ID and Name');
            return;
        }

        if (!this.isValidEmployeeId(employeeId)) {
            alert('Employee ID must contain only numbers');
            return;
        }

        const now = new Date();
        const currentDate = this.formatDate(now);
        const currentTime = this.formatTime(now);

        try {
            if (type === 'in') {
                const existingRecord = this.attendanceRecords.find(
                    record => record.employeeId === employeeId && record.date === currentDate
                );

                if (existingRecord) {
                    this.showToast('Employee already checked in today', 'error');
                    return;
                }

                const newRecord: AttendanceRecord = {
                    employeeId,
                    employeeName,
                    checkIn: currentTime,
                    checkOut: null,
                    status: 'Present',
                    date: currentDate
                };

                const submitted = await this.submitToGoogleForm(newRecord);
                if (submitted) {
                    this.attendanceRecords.push(newRecord);
                    this.updateAttendanceTable();
                    this.showToast('Check-in successful!', 'success');
                    this.clearForm();
                } else {
                    this.showToast('Error submitting attendance. Please try again.', 'error');
                }
            } else {
                const record = this.attendanceRecords.find(
                    record => record.employeeId === employeeId && record.date === currentDate
                );

                if (!record) {
                    this.showToast('No check-in record found for today', 'error');
                    return;
                }

                if (record.checkOut) {
                    this.showToast('Employee already checked out', 'error');
                    return;
                }

                // Create updated record
                const updatedRecord = { ...record };
                updatedRecord.checkOut = currentTime;
                updatedRecord.status = 'Checked Out';

                const submitted = await this.submitToGoogleForm(updatedRecord);
                if (submitted) {
                    record.checkOut = currentTime;
                    record.status = 'Checked Out';
                    this.updateAttendanceTable();
                    this.showToast('Check-out successful!', 'success');
                    this.clearForm();
                } else {
                    this.showToast('Error updating attendance. Please try again.', 'error');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            this.showToast('An error occurred. Please try again.', 'error');
        }
    }

    private updateAttendanceTable(): void {
        console.log('Updating table with records:', this.attendanceRecords);
        const tbody = document.getElementById('attendanceBody');
        if (!tbody) {
            console.error('Table body element not found');
            return;
        }

        tbody.innerHTML = '';
        const currentDate = this.formatDate(new Date());
        const todayRecords = this.attendanceRecords.filter(record => record.date === currentDate);
        console.log('Today\'s records:', todayRecords);

        todayRecords.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.employeeId}</td>
                <td>${record.employeeName}</td>
                <td>${record.checkIn}</td>
                <td>${record.checkOut || '-'}</td>
                <td>${record.status}</td>
            `;
            tbody.appendChild(row);
        });
    }

    private clearForm(): void {
        (document.getElementById('employeeId') as HTMLInputElement).value = '';
        (document.getElementById('employeeName') as HTMLInputElement).value = '';
    }

    private setupMidnightReset(): void {
        // Clear any existing timeout
        if (this.midnightTimeout) {
            clearTimeout(this.midnightTimeout);
        }

        // Calculate time until next midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();

        // Set timeout for midnight
        this.midnightTimeout = setTimeout(() => {
            this.clearTodayAttendance();
            // Setup next day's timeout
            this.setupMidnightReset();
        }, timeUntilMidnight);

        console.log(`Attendance will reset in ${Math.floor(timeUntilMidnight / 1000 / 60)} minutes`);
    }

    private clearTodayAttendance(): void {
        const today = this.formatDate(new Date());
        
        // Remove today's records from the array
        this.attendanceRecords = this.attendanceRecords.filter(
            record => record.date !== today
        );

        // Update the table
        this.updateAttendanceTable();
        
        // Show notification
        this.showToast('Attendance records have been reset for the new day', 'info');
    }

    public cleanup(): void {
        if (this.midnightTimeout) {
            clearTimeout(this.midnightTimeout);
        }
    }
}

// Update initialization to handle cleanup
let attendanceSystem: AttendanceSystem | null = null;

if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Initializing AttendanceSystem');
        attendanceSystem = new AttendanceSystem();
    });

    // Clean up when the page is unloaded
    window.addEventListener('beforeunload', () => {
        if (attendanceSystem) {
            attendanceSystem.cleanup();
        }
    });
}

// Make it available globally
declare global {
    interface Window {
        AttendanceSystem: typeof AttendanceSystem;
        initApp: () => void;
    }
}

window.AttendanceSystem = AttendanceSystem;
window.initApp = () => {
    console.log('Initializing app...');
    new AttendanceSystem();
};

export default AttendanceSystem; 