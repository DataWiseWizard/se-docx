import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
// import { GoShieldLock } from "react-icons/go";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { FaUserCheck, FaHdd, FaFileAlt } from "react-icons/fa";
import SkeletonLoader from '../components/SkeletonLoader';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/auth/me');
                setProfile(data);
            } catch (error) {
                console.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <div className="p-10"><SkeletonLoader mode="table" /></div>;
    if (!profile) return null;

    const { user, stats } = profile;
    const usedPercent = (stats.usedStorage / stats.totalStorage) * 100;

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-2xl mx-auto">
                <button 
                    onClick={() => navigate('/dashboard')} 
                    className="flex items-center text-slate-500 hover:text-blue-900 mb-6 transition"
                >
                    <HiOutlineArrowLeft className="mr-2" /> Back to Vault
                </button>

                {/* Identity Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div className="bg-slate-900 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                                {user.fullName.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">{user.fullName}</h1>
                                <p className="text-slate-400">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
                            <FaUserCheck /> Verified Citizen
                        </div>
                    </div>
                    
                    <div className="p-6 grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs uppercase text-slate-500 font-bold">Aadhaar ID</label>
                            <p className="font-mono text-slate-800 text-lg">
                                XXXX-XXXX-{user.aadhaarId.slice(-4)}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs uppercase text-slate-500 font-bold">Account Role</label>
                            <p className="capitalize text-slate-800 text-lg">{user.role}</p>
                        </div>
                    </div>
                </div>

                {/* Storage Stats */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <FaHdd />
                            </div>
                            <span className="font-semibold text-slate-700">Storage Used</span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">{formatSize(stats.usedStorage)}</h2>
                        <div className="w-full bg-slate-100 rounded-full h-2 mt-4">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${usedPercent}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-right">
                            of {formatSize(stats.totalStorage)} used
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                         <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <FaFileAlt />
                            </div>
                            <span className="font-semibold text-slate-700">Total Documents</span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">{stats.totalFiles}</h2>
                        <p className="text-sm text-slate-500 mt-1">Encrypted & Secured</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;