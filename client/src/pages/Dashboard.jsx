import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import ProfileMenu from '../components/ProfileMenu';
import FileInfoModal from '@/components/FileInfoModal';
import ShareModal from '../components/ShareModal';
import CreateFolderModal from '../components/CreateFolderModal';
import { useNavigate } from 'react-router-dom';
import { GoShieldLock, GoEye } from "react-icons/go";
import { LuUpload } from "react-icons/lu";
import { ImFileText2 } from "react-icons/im";
import { MdOutlineShare } from "react-icons/md";
import { BsInfoCircle } from "react-icons/bs";
import { AiOutlineFileSearch } from "react-icons/ai";
import { HiOutlineChevronRight } from "react-icons/hi2";
import { IoFolderOutline } from "react-icons/io5";
import { RiHome9Line } from "react-icons/ri";
import { TbFolderPlus } from "react-icons/tb";

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showLogs, setShowLogs] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [folders, setFolders] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [folderPath, setFolderPath] = useState([]);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const navigate = useNavigate();

    const fetchLogs = async () => {
        const { data } = await api.get('/audit');
        setLogs(data);
        setShowLogs(true);
    };

    const openInfoModal = (doc) => {
        setSelectedDoc(doc);
        setIsInfoOpen(true);
    };

    const fetchContent = async (folderId = currentFolder?._id) => {
        try {
            setLoading(true);

            if (searchTerm) {
                const { data } = await api.get(`/documents?search=${searchTerm}`);
                setDocuments(data);
                setFolders([]);
                return;
            }
            const endpoint = folderId ? `/folders/${folderId}` : '/folders/root';
            const { data } = await api.get(endpoint);

            setFolders(data.folders);
            setDocuments(data.documents);
        } catch (error) {
            console.error("Failed to fetch content", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchContent();
    }, [currentFolder, searchTerm]);

    const openShareModal = (doc) => {
        setSelectedDoc(doc);
        setIsShareOpen(true);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderId', currentFolder ? currentFolder._id : 'root');
        setUploading(true);
        try {
            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchContent();
        } catch (error) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

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

    const handleEnterFolder = (folder) => {
        // Add current folder to path history before moving
        if (currentFolder) {
            setFolderPath([...folderPath, currentFolder]);
        } else {
            // If creating path from root
            setFolderPath([...folderPath, { _id: 'root', name: 'Home' }]);
        }
        setCurrentFolder(folder);
        setSearchTerm(''); // Clear search when navigating
    };

    const handleNavigateUp = (index) => {
        // Go back to a specific point in breadcrumbs
        if (index === -1) {
            setCurrentFolder(null); // Go to Root
            setFolderPath([]);
        } else {
            const newFolder = folderPath[index];
            setCurrentFolder(newFolder);
            setFolderPath(folderPath.slice(0, index));
        }
    };

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
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 mb-6 text-sm text-slate-600">
                        <button
                            onClick={() => handleNavigateUp(-1)}
                            className={`flex items-center hover:text-blue-600 ${!currentFolder ? 'font-bold text-slate-900' : ''}`}
                        >
                            <RiHome9Line className="h-4 w-4 mr-1" /> Home
                        </button>

                        {folderPath.map((folder, index) => (
                            <div key={folder._id} className="flex items-center gap-2">
                                <HiOutlineChevronRight className="h-4 w-4 text-slate-400" />
                                <button
                                    onClick={() => handleNavigateUp(index)}
                                    className="hover:text-blue-600"
                                >
                                    {folder.name}
                                </button>
                            </div>
                        ))}

                        {currentFolder && (
                            <>
                                <HiOutlineChevronRight className="h-4 w-4 text-slate-400" />
                                <span className="font-bold text-slate-900">{currentFolder.name}</span>
                            </>
                        )}
                    </div>
                    <div className="relative w-96 mx-4">
                        <AiOutlineFileSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search files..."
                            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

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
                    <button
                        onClick={() => setIsCreateFolderOpen(true)}
                        className="mr-3 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition flex items-center gap-2"
                    >
                        <TbFolderPlus className="h-4 w-4" /> New Folder
                    </button>
                </div>

                {/* Document Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Folder Grid */}
                    {folders.length > 0 && !searchTerm && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                            {folders.map(folder => (
                                <div
                                    key={folder._id}
                                    onClick={() => handleEnterFolder(folder)}
                                    className="p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md hover:border-blue-400 cursor-pointer transition flex flex-col items-center text-center group"
                                >
                                    <IoFolderOutline className="h-10 w-10 text-blue-100 group-hover:text-blue-500 transition mb-2 fill-current" />
                                    <span className="text-sm font-medium text-slate-700 truncate w-full">{folder.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
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
                                            onClick={() => openInfoModal(doc)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                                            title="File Info & Rename"
                                        >
                                            <BsInfoCircle className="h-4 w-4" />
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
            <FileInfoModal
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                doc={selectedDoc}
                onRenameSuccess={fetchDocuments} // Refresh the table after rename
            />
            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                onShare={handleShare}
                docName={selectedDoc?.fileName}
            />
            <CreateFolderModal
                isOpen={isCreateFolderOpen}
                onClose={() => setIsCreateFolderOpen(false)}
                parentId={currentFolder?._id}
                onSuccess={() => fetchContent()}
            />
        </div>
    );
};

export default Dashboard;