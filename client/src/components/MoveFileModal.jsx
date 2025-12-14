import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LuFolderInput } from "react-icons/lu";
import api from '../utils/api';

const MoveFileModal = ({ isOpen, onClose, doc, onSuccess }) => {
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState('root');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchFolders = async () => {
            if (isOpen) {
                try {
                    const { data } = await api.get('/folders/root'); 
                    setFolders(data.folders);
                } catch (error) {
                    console.error("Failed to load folders");
                }
            }
        };
        fetchFolders();
    }, [isOpen]);

    const handleMove = async () => {
        setLoading(true);
        try {
            const destination = selectedFolder === 'root' ? null : selectedFolder;
            
            await api.put(`/documents/${doc._id}/move`, { 
                destinationFolderId: destination 
            });
            
            onSuccess();
            onClose();
        } catch (error) {
            alert("Failed to move file");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LuFolderInput className="h-5 w-5 text-blue-600" />
                        Move File
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-slate-500 mb-4">
                        Moving <span className="font-semibold text-slate-900">{doc?.fileName}</span> to:
                    </p>
                    
                    <select 
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                        value={selectedFolder}
                        onChange={(e) => setSelectedFolder(e.target.value)}
                    >
                        <option value="root">🏠 Home (Root)</option>
                        {folders.map(folder => (
                            <option key={folder._id} value={folder._id}>
                                📁 {folder.name}
                            </option>
                        ))}
                    </select>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleMove} disabled={loading}>
                        {loading ? 'Moving...' : 'Move Here'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MoveFileModal;