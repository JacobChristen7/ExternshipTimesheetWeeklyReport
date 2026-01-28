# MTECH Externship Timesheet & Weekly Report

An Angular-based web application for tracking externship hours and submitting weekly reports. Built with Angular, Firebase Authentication, and Cloud Firestore.

## Current Features

- ✅ **Authentication**: Email/password and Google Sign-In with Firebase
- ✅ **Timesheet Tracking**: Weekly timesheet with auto-save on input deselect
- ✅ **Weekly Report Submission**: Submit weekly reports that save to Firebase with success/error feedback
- ✅ **Route Guards**: Protected routes for authenticated users only
- ✅ **Dark Mode**: Persistent dark/light theme toggle
- ✅ **User-Specific Data**: Firestore security rules ensure users only see their own data

## Tech

- **Frontend**: Angular (Standalone Components, Signals)
- **Styling**: Tailwind CSS, Angular Material
- **Backend**: Firebase (Auth + Firestore)
- **Language**: TypeScript

## Setup & Installation

1. **Clone the repo:**
   ```bash
   git clone https://github.com/JacobChristen7/ExternshipTimesheetWeeklyReport.git
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   ng serve
   ```
   Navigate to `http://localhost:4200/`

## Database Structure

This app uses Firebase Firestore with the following structure. If you're using a different database, adapt your schema accordingly:

### Collections

#### `timesheets` Collection
Each document represents one week of timesheet data:

```typescript
{
  userId: string,              // Firebase Auth UID (for filtering user data)
  userEmail: string,           // User's email (for admin identification)
  weekStartDate: string,       // Week start date (format: "M/D/YYYY")
  weekEndDate: string,         // Week end date (format: "M/D/YYYY")
  totalHours: number,          // Total hours for the week (sum of all days)
  days: [                      // Array of 7 day objects (Monday-Sunday)
    {
      date: string,            // Date (format: "M/D/YYYY")
      hours: number,           // Hours worked (0-24)
      notes: string            // Daily notes/activities
    },
    // ... 6 more day objects
  ],
  createdAt: Timestamp,        // Firestore server timestamp
  updatedAt: Timestamp         // Firestore server timestamp
}
```

#### `reports` Collection
Each document represents one weekly report submission:

```typescript
{
  userId: string,              // Firebase Auth UID (for filtering user data)
  userEmail: string,           // User's email (for admin identification)
  week: string,                // Week identifier (e.g., "Week 1", "Week 2")
  studentName: string,         // Student's name
  manager: string,             // Manager/Supervisor name
  company: string,             // Company name
  programmingLanguages: string, // Languages learned this week
  accomplishments: string,     // What was accomplished or gained
  challenges: string,          // Challenges faced this week
  goals: string,               // Goals for upcoming week
  hoursThisWeek: number,       // Hours worked this specific week
  totalHours: number,          // Total hours accrued in externship
  questions: string,           // Questions/concerns for coordinator
  createdAt: Timestamp,        // Firestore server timestamp
  updatedAt: Timestamp         // Firestore server timestamp
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /timesheets/{timesheetId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    match /reports/{reportId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

**Key Points:**
- Users can only read/write their own data (filtered by `userId`)
- All write operations require authentication
- The `userEmail` field is optional but helpful for identifying users in the Firebase Console
- In timesheets: `totalHours` is calculated and stored for quick access to weekly totals
- In reports: Both `hoursThisWeek` and `totalHours` are user-provided values

## Additional Resources

- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [RxJS Documentation](https://rxjs.dev/)
