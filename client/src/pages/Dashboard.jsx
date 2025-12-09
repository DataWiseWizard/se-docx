import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import ProfileMenu from '../components/ProfileMenu';
import ShareModal from '../components/ShareModal';
import { useNavigate } from 'react-router-dom';
import { GoShieldLock, GoEye } from "react-icons/go";
import { LuUpload } from "react-icons/lu";
import { ImFileText2 } from "react-icons/im";
import { MdOutlineShare } from "react-icons/md";



const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showLogs, setShowLogs] = useState(false);
    const [logs, setLogs] = useState([]);
    const navigate = useNavigate();

    const fetchLogs = async () => {
        const { data } = await api.get('/audit');
        setLogs(data);
        setShowLogs(true);
    };

    // 1. Fetch Documents on Load
    const fetchDocuments = async () => {
        try {
            const { data } = await api.get('/documents');
            setDocuments(data);
        } catch (error) {
            console.error("Failed to fetch docs", error);
        } finally {
            setLoading(false);
        }
    };

    const openShareModal = (doc) => {
        setSelectedDoc(doc);
        setIsShareOpen(true);
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    // 2. Handle File Upload
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchDocuments(); // Refresh list
        } catch (error) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    // 3. Handle View Document
    const handleView = async (id) => {
        try {
            const response = await api.get(`/documents/${id}`, {
                responseType: 'blob' // Important: Expect binary data
            });

            // Create a blob URL to view in new tab
            const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
            window.open(fileURL, '_blank');
        } catch (error) {
            alert('Failed to decrypt document');
        }
    };

    const handleShare = async (email, duration) => {
        try {
            await api.post(`/documents/${selectedDoc._id}/share`, {
                email,
                durationInHours: duration
            });
            alert(`Access granted to ${email} for ${duration} hours.`);
        } catch (error) {
            alert(error.response?.data?.message || 'Sharing failed');
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-800">
                    <GoShieldLock className="h-8 w-8 text-blue-900" />
                    <span className="text-xl font-bold tracking-tight">SecureVault</span>
                </div>
                <div className="flex items-center gap-6">
                    <ProfileMenu
                        user={user}
                        onLogout={logout}
                        onOpenLogs={() => {
                            fetchLogs(); 
                            // We don't need setShowLogs(true) here because fetchLogs does it,
                            // but if your fetchLogs doesn't set it, add setShowLogs(true) here.
                        }}
                    />
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-8 py-10">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">My Documents</h1>

                    {/* Hidden File Input + Custom Button */}
                    <div className="relative">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                        <label
                            htmlFor="file-upload"
                            className={`flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-md cursor-pointer hover:bg-blue-800 transition ${uploading ? 'opacity-50' : ''}`}
                        >
                            <LuUpload className="h-4 w-4" />
                            {uploading ? 'Encrypting...' : 'Secure Upload'}
                        </label>
                    </div>
                </div>

                {/* Document Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium">Document Name</th>
                                <th className="px-6 py-4 font-medium">Size</th>
                                <th className="px-6 py-4 font-medium">Date Uploaded</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {documents.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-10 text-center text-slate-400">
                                        No documents found. Upload one to get started.
                                    </td>
                                </tr>
                            )}

                            {documents.map((doc) => (
                                <tr key={doc._id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded">
                                            <ImFileText2 className="h-5 w-5" />
                                        </div>
                                        <span className="font-medium text-slate-700">{doc.fileName}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {(doc.size / 1024).toFixed(2)} KB
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {new Date(doc.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                                        <button
                                            onClick={() => handleView(doc._id)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                                            title="View Decrypted"
                                        >
                                            <GoEye className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => openShareModal(doc)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                                            title="Share Access"
                                        >
                                            <MdOutlineShare className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showLogs && (
                    <div className="mt-10 bg-white p-6 rounded-xl border border-slate-200">
                        <h2 className="text-lg font-bold mb-4">Security Audit Trail</h2>
                        <div className="overflow-auto max-h-60">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-2">Time</th>
                                        <th className="px-4 py-2">Action</th>
                                        <th className="px-4 py-2">Resource</th>
                                        <th className="px-4 py-2">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log._id} className="border-b">
                                            <td className="px-4 py-2">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className="px-4 py-2 font-bold text-blue-800">{log.action}</td>
                                            <td className="px-4 py-2">{log.resource}</td>
                                            <td className="px-4 py-2 text-slate-500">{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                onShare={handleShare}
                docName={selectedDoc?.fileName}
            />
        </div>
    );
};

export default Dashboard;