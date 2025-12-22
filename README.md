# SecureVault - Sovereign Identity & Document Storage
________________________________________
## 📖 About The Project

SecureVault isn't just a clone of Google Drive; it's a prototype for a **government-grade digital locker**. 

I built this platform to solve a specific problem: **Secure, verifiable document sharing for citizens.** Unlike standard cloud storage, SecureVault emphasizes identity verification (Aadhaar-based) and auditability. Every action—from login to file viewing—is logged in an immutable audit trail, making it suitable for sensitive legal or financial documents.

The core philosophy here is **"Privacy by Design."** Files aren't just saved; they are encrypted at rest using AES-256 before they ever touch the database.
________________________________________
2. KEY FEATURES
Security First
•	AES-256 Encryption: Files are encrypted on upload. Even the database administrator cannot view user files without the decryption keys.
•	Production Hardening: Implemented Rate Limiting, NoSQL Injection protection, and Parameter Pollution guards.
•	Identity Verification: Mock Aadhaar-based registration system to ensure 1:1 identity mapping.
Smart Organization
•	Virtual "Shared" System: A unique approach to file sharing that doesn't duplicate data. Shared files appear in a dedicated, virtual "Shared with Me" directory.
•	Nested Folders: Full support for deep folder structures with breadcrumb navigation.
•	Granular Permissions: Time-limited sharing (e.g., "Grant access for 24 hours").
User Experience
•	Robust Error Handling: Global Error Boundaries prevent application crashes.
•	Visual Feedback: Professional skeleton loaders and toast notifications (replacing native browser alerts).
•	Responsive Dashboard: Clean, grid-based UI compatible with all devices.
________________________________________
3. TECH STACK
•	Frontend: React 18, Vite, Tailwind CSS, Radix UI.
•	Backend: Node.js, Express 5.
•	Database: MongoDB Atlas (GridFS for file chunking).
•	Security Tools: Helmet, Express-Rate-Limit, Crypto (Node.js native), BCrypt.
________________________________________
4. LOCAL SETUP GUIDE
Prerequisites
•	Node.js (v18 or higher)
•	MongoDB URI (Local or Atlas)
Installation Steps
1.	Clone the repository: git clone https://github.com/DataWiseWizard/se-docx.git
2.	Install Backend Dependencies: cd server npm install
3.	Install Frontend Dependencies: cd ../client npm install
________________________________________
5. ARCHITECTURE HIGHLIGHTS
The Encryption Pipeline I chose not to rely on disk encryption alone. Instead, files undergo stream-based encryption:
1.	Upload: File stream enters the server -> Enciphered using the crypto module -> Chunks stored in GridFS.
2.	Download: Chunks retrieved -> Deciphered on-the-fly -> Streamed to client. This ensures that at no point does the unencrypted file exist on the server's disk.
The Virtual Folder Logic To avoid database clutter, the "Shared with Me" folder doesn't actually exist in the Folder collection. It is injected by the frontend and queries the Access Control List (ACL) on documents directly. This keeps the database schema clean and the read operations fast.
________________________________________
6. FUTURE IMPROVEMENTS
To scale this to a government-level application, the following would be implemented:
1.	Real Aadhaar API: Replacing the mock verification with actual UIDAI hooks.
2.	S3 Storage: Migrating from GridFS to AWS S3 for petabyte-scale storage capabilities.
3.	Two-Factor Authentication (2FA): Adding OTP-based 2FA for logins.
________________________________________
AUTHOR
Rudraksha Kumbhkar

