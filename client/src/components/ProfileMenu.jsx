import { useNavigate } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LuHistory } from "react-icons/lu";
import { FaUserTie } from "react-icons/fa";
import { HiOutlineLogout } from "react-icons/hi";


const ProfileMenu = ({ user, onLogout, onOpenLogs }) => {
    const navigate = useNavigate();
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : 'U';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative h-10 w-10 rounded-full overflow-hidden border border-slate-200 hover:ring-2 hover:ring-slate-400 transition focus:outline-none">
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="h-full w-full bg-slate-900 flex items-center justify-center text-white font-medium">
                            {user?.fullName?.charAt(0) || 'U'}
                        </div>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-slate-500 font-normal">{user?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={onOpenLogs} className="cursor-pointer">
                    <LuHistory className="mr-2 h-4 w-4" />
                    <span>Activity Log</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
                    <FaUserTie className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                    <HiOutlineLogout className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ProfileMenu;