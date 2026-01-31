import { useAuth } from "../context/AuthContext";

export const usePermission = () => {
    const { user } = useAuth();

    const hasPermission = (module: string, action: string) => {
        // Validation: Check checking role name (string or object)
        // Ensure user.role is not null before checking if it is an object
        const roleName = (user?.role && typeof user.role === 'object') ? (user.role as any).name : user?.role;

        // Check for Admin (case insensitive)
        const isAdmin = roleName?.toLowerCase() === 'admin';

        if (isAdmin) return true;

        // If not admin, check permissions
        const userPermissions: string[] = (user?.role && typeof user.role === 'object' ? (user.role as any).permissions : []) || [];

        return userPermissions.includes(`${module}.${action}`);
    };

    return { hasPermission };
};

interface PermissionGuardProps {
    module: string;
    action: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    showMessage?: boolean;
}

export const PermissionGuard = ({ module, action, children, fallback = null, showMessage = false }: PermissionGuardProps) => {
    const { hasPermission } = usePermission();

    if (!hasPermission(module, action)) {
        if (showMessage) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="text-red-500 font-medium mb-1">Access Denied</div>
                    <div className="text-gray-500 text-sm">You do not have permission to view this content.</div>
                </div>
            );
        }
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
