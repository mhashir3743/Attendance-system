export interface AttendanceRecord {
    employeeId: string;
    employeeName: string;
    checkIn: string;
    checkOut: string | null;
    status: 'Present' | 'Checked Out';
    date: string;
}

export interface ExcelConfig {
    fileName: string;
    sheetName: string;
} 