# Attendance Management System

The **Attendance Management System** is built with TypeScript and Node.js. It helps manage employee attendance records with Google Forms integration and Excel export functionality.


## Overview

This system provides:
- Employee attendance management (check-in/check-out).
- Google Forms integration for data entry.
- Excel file export for attendance reporting.
- A simple front-end interface for viewing and managing attendance.

### Key Files:
- **`app.ts`**: Contains front-end logic for handling attendance.
- **`server.ts`**: The backend server using Express for API handling and Excel export.
- **`index.html`**: Front-end user interface.
- **`view-attendance.html`**: Additional view for attendance management.
- **`styles.css`**: Styling for the front-end.

## Features

- **Check-In/Check-Out**: Track employee attendance.
- **Google Forms Integration**: Input attendance data via Google Forms.
- **Export to Excel**: Generate attendance reports in Excel format.
- **Simple Front-End**: Easy-to-use interface for managing records.

## Installation

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed.

### Steps

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/attendance-management-system.git
    ```

2. Navigate into the project directory:
    ```bash
    cd attendance-management-system
    ```

3. Install dependencies:
    ```bash
    npm install
    ```

4. Start the server:
    ```bash
    npm start
    ```

5. Open your browser and go to `http://localhost:3000/`.

## Usage

1. Employees check in/check out using the system's web interface.
2. Administrators can view and manage attendance records.
3. Use Google Forms to submit attendance data and synchronize with the system.
4. Export attendance reports in Excel format for analysis.

## API Endpoints

The server exposes the following API routes:

- `GET /api/attendance`: Retrieve all attendance records.
- `POST /api/attendance`: Submit new attendance data (check-in/check-out).
- `GET /api/attendance/excel`: Export attendance records as an Excel file.

## Configuration

- The Google Form URL is configurable in `app.ts` under the `googleFormUrl` variable.
- The Excel file export path is set in `server.ts` and can be modified to suit deployment needs.

## Contributing

We welcome contributions! Please follow the steps below:

1. Fork the repository.
2. Create a new branch:
    ```bash
    git checkout -b feature-name
    ```
3. Make your changes and commit them:
    ```bash
    git commit -m "Describe your feature"
    ```
4. Push the changes to your fork:
    ```bash
    git push origin feature-name
    ```
5. Create a Pull Request on the original repository.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
