import express from 'express';
import XLSX from 'xlsx';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import types
import { Request, Response, NextFunction } from 'express';
import { AttendanceRecord } from './types.js';

const app = express();
const PORT = 3000;
const EXCEL_FILE_PATH = path.join(__dirname, '../data/attendance_records.xlsx');

// Add logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Add these middleware configurations
app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.url.endsWith('.js')) {
        res.type('application/javascript');
    }
    next();
});

// Update static file serving
app.use(express.static(path.join(__dirname, '../dist')));
app.use(express.static(path.join(__dirname, '../src')));

app.use(cors());
app.use(express.json());

// Add this validation function at the top of the file, after the imports
function isValidEmployeeId(id: string): boolean {
    return /^\d+$/.test(id); // This regex checks if string contains only numbers
}

// Read from Excel file
function readExcelFile(): AttendanceRecord[] {
    try {
        if (!XLSX.readFile(EXCEL_FILE_PATH)) {
            // Create new file if it doesn't exist
            writeExcelFile([]);
            return [];
        }
        const workbook = XLSX.readFile(EXCEL_FILE_PATH);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
        console.error('Error reading Excel file:', error);
        return [];
    }
}

// Write to Excel file
function writeExcelFile(data: AttendanceRecord[]): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, EXCEL_FILE_PATH);
}

// Get all attendance records
app.get('/api/attendance', (req: Request, res: Response) => {
    const records = readExcelFile();
    res.json(records);
});

// Add new attendance record
app.post('/api/attendance', (req: Request, res: Response) => {
    try {
        const newRecord = req.body as AttendanceRecord;
        
        // Validate required fields
        if (!newRecord.employeeId || !newRecord.employeeName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        // Validate employee ID format
        if (!isValidEmployeeId(newRecord.employeeId)) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID must contain only numbers'
            });
        }
        
        const records = readExcelFile();
        records.push(newRecord);
        writeExcelFile(records);
        res.json({ success: true, message: 'Record added successfully' });
    } catch (error) {
        console.error('Error adding record:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Update attendance record
app.put('/api/attendance', (req: Request, res: Response) => {
    const updatedRecord = req.body as AttendanceRecord;

    // Validate employee ID format
    if (!isValidEmployeeId(updatedRecord.employeeId)) {
        return res.status(400).json({
            success: false,
            message: 'Employee ID must contain only numbers'
        });
    }

    const records = readExcelFile();
    const index = records.findIndex(
        (record) => 
            record.employeeId === updatedRecord.employeeId && 
            record.date === updatedRecord.date
    );
    
    if (index !== -1) {
        records[index] = updatedRecord;
        writeExcelFile(records);
        res.json({ success: true, message: 'Record updated successfully' });
    } else {
        res.status(404).json({ success: false, message: 'Record not found' });
    }
});

// Add export endpoint
app.get('/api/attendance/export', (req: Request, res: Response) => {
    try {
        const records = readExcelFile();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance.xlsx');
        
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(records);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);
    } catch (error) {
        console.error('Error exporting Excel:', error);
        res.status(500).json({ success: false, message: 'Error exporting data' });
    }
});

// Add this route at the end, before app.listen
app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../src/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});